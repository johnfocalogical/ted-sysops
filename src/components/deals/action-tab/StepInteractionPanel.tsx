import { useState, useEffect } from 'react'
import {
  GitBranch,
  Flag,
  Loader2,
  ChevronDown,
  ChevronRight,
  Zap,
  Clock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import type {
  AutomatorInstance,
  AutomatorInstanceStep,
  AutomatorNode,
  AutomatorAction,
  DecisionNodeData,
  DataCollectionNodeData,
  EndNodeData,
} from '@/types/automator.types'
import { getEffectiveOptions } from '@/lib/decisionNodeUtils'

// ============================================================================
// Action Preview Helpers
// ============================================================================

function getActionPreviewLabel(action: AutomatorAction): string {
  switch (action.action_type) {
    case 'set_deal_field': {
      const p = action.params as { target_field: string }
      return `Set deal field "${p.target_field}"`
    }
    case 'set_date_field': {
      const p = action.params as { target_field: string }
      return `Set date "${p.target_field}"`
    }
    case 'check_checklist_item': {
      const p = action.params as { checklist_item_key: string }
      return `Check "${p.checklist_item_key}" on checklist`
    }
    case 'add_expense':
      return 'Add an expense record'
    case 'add_vendor':
      return 'Link a vendor to the deal'
    case 'add_employee':
      return 'Assign an employee to the deal'
    case 'create_showing':
      return 'Schedule a property showing'
    case 'update_deal_status': {
      const p = action.params as { status: string }
      return `Move deal to "${p.status}"`
    }
    case 'trigger_automator':
      return 'Start a child automator'
    default:
      return action.action_type
  }
}

// ============================================================================
// Actions Preview Section
// ============================================================================

function ActionsPreview({ actions }: { actions: AutomatorAction[] }) {
  const [expanded, setExpanded] = useState(false)

  if (!actions || actions.length === 0) return null

  return (
    <div className="mt-4 border border-border/50 rounded-lg">
      <button
        type="button"
        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:bg-muted/30 transition-colors rounded-lg"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        <Zap className="h-3 w-3 text-accent" />
        <span>
          When you submit, {actions.length} automated action
          {actions.length !== 1 ? 's' : ''} will run
        </span>
      </button>
      {expanded && (
        <div className="px-3 pb-2 space-y-1">
          {actions.map((action, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-xs text-muted-foreground pl-5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-accent/50" />
              {getActionPreviewLabel(action)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Decision Node Interaction
// ============================================================================

function DecisionInteraction({
  node,
  onExecute,
  isExecuting,
}: {
  node: AutomatorNode
  onExecute: (
    nodeId: string,
    response?: Record<string, unknown>,
    branchTaken?: string
  ) => void
  isExecuting: boolean
}) {
  const data = node.data as DecisionNodeData
  const options = getEffectiveOptions(data.options)
  const branches = options.map((o) => o.label)

  // Collect actions for preview: global actions + branch-specific
  const globalActions = data.actions ?? []

  return (
    <div className="space-y-4">
      <p className="text-base font-medium">{data.question}</p>

      <div className="flex gap-3">
        {branches.map((branch) => {
          const branchActions = data.branch_actions?.[branch] ?? []
          const allActions = [...globalActions, ...branchActions]

          return (
            <div key={branch} className="flex-1">
              <Button
                className="w-full bg-primary hover:bg-primary/90 h-12 text-base"
                onClick={() => onExecute(node.id, undefined, branch)}
                disabled={isExecuting}
              >
                {isExecuting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  branch
                )}
              </Button>
              {allActions.length > 0 && (
                <ActionsPreview actions={allActions} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================================
// Data Collection Node Interaction
// ============================================================================

function DataCollectionInteraction({
  node,
  onExecute,
  isExecuting,
}: {
  node: AutomatorNode
  onExecute: (
    nodeId: string,
    response?: Record<string, unknown>,
    branchTaken?: string
  ) => void
  isExecuting: boolean
}) {
  const data = node.data as DataCollectionNodeData
  const [formValues, setFormValues] = useState<Record<string, unknown>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Determine if we have multi-field form, single legacy field, or pure-backend
  const hasMultiFields = data.fields && data.fields.length > 0
  const hasLegacyField = !hasMultiFields && data.fieldName

  const fields = hasMultiFields
    ? data.fields!
    : hasLegacyField
      ? [
          {
            field_id: data.field_id ?? data.fieldName,
            label: data.label,
            fieldType: data.fieldType,
            required: data.required,
            placeholder: data.placeholder,
            options: data.options,
            min: data.min,
            max: data.max,
            validationMessage: data.validationMessage,
          },
        ]
      : [] // No input fields — pure backend action node

  const handleFieldChange = (fieldId: string, value: unknown) => {
    setFormValues((prev) => ({ ...prev, [fieldId]: value }))
    // Clear error when user types
    if (errors[fieldId]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[fieldId]
        return next
      })
    }
  }

  const handleSubmit = () => {
    // Validate required fields
    const newErrors: Record<string, string> = {}
    for (const field of fields) {
      if (field.required) {
        const val = formValues[field.field_id]
        if (val === undefined || val === null || val === '') {
          newErrors[field.field_id] =
            field.validationMessage ?? `${field.label} is required`
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onExecute(node.id, formValues)
  }

  const renderField = (field: typeof fields[number]) => {
    const fieldId = field.field_id
    const value = formValues[fieldId] as string | undefined

    switch (field.fieldType) {
      case 'text':
        return (
          <Input
            placeholder={field.placeholder}
            value={value ?? ''}
            onChange={(e) => handleFieldChange(fieldId, e.target.value)}
          />
        )

      case 'number':
      case 'currency':
        return (
          <Input
            type="number"
            placeholder={field.placeholder}
            value={value ?? ''}
            onChange={(e) => handleFieldChange(fieldId, e.target.value)}
            min={field.min}
            max={field.max}
          />
        )

      case 'date':
        return (
          <Input
            type="date"
            value={value ?? ''}
            onChange={(e) => handleFieldChange(fieldId, e.target.value)}
          />
        )

      case 'textarea':
        return (
          <Textarea
            placeholder={field.placeholder}
            value={value ?? ''}
            onChange={(e) => handleFieldChange(fieldId, e.target.value)}
            rows={3}
          />
        )

      case 'select':
      case 'dropdown':
        return (
          <Select
            value={value ?? ''}
            onValueChange={(v) => handleFieldChange(fieldId, v)}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder ?? 'Select...'} />
            </SelectTrigger>
            <SelectContent>
              {(field.options ?? []).map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'multiselect': {
        // Simple checkbox-style multi-select
        const selected = (formValues[fieldId] as string[] | undefined) ?? []
        return (
          <div className="space-y-2">
            {(field.options ?? []).map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-2 text-sm cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(opt.value)}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...selected, opt.value]
                      : selected.filter((v) => v !== opt.value)
                    handleFieldChange(fieldId, next)
                  }}
                  className="rounded border-border"
                />
                {opt.label}
              </label>
            ))}
          </div>
        )
      }

      case 'contact':
        // Simplified: text input for contact name/ID (full contact picker would be a future enhancement)
        return (
          <Input
            placeholder={field.placeholder ?? 'Enter contact name or ID'}
            value={value ?? ''}
            onChange={(e) => handleFieldChange(fieldId, e.target.value)}
          />
        )

      default:
        return (
          <Input
            placeholder={field.placeholder}
            value={value ?? ''}
            onChange={(e) => handleFieldChange(fieldId, e.target.value)}
          />
        )
    }
  }

  const actions = data.actions ?? []

  // Pure-backend node: no input fields, show action summary + Execute button
  if (fields.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center py-2">
          <Zap className="h-6 w-6 mx-auto text-accent mb-2" />
          <p className="text-sm text-muted-foreground">
            This step will execute {actions.length} backend action{actions.length !== 1 ? 's' : ''}.
          </p>
        </div>

        <ActionsPreview actions={actions} />

        <Button
          className="w-full bg-primary hover:bg-primary/90"
          onClick={() => onExecute(node.id, {})}
          disabled={isExecuting}
        >
          {isExecuting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Executing...
            </>
          ) : (
            'Execute'
          )}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <div key={field.field_id} className="space-y-1.5">
          <Label className="text-sm font-medium">
            {field.label}
            {field.required && (
              <span className="text-destructive ml-1">*</span>
            )}
          </Label>
          {renderField(field)}
          {errors[field.field_id] && (
            <p className="text-xs text-destructive">{errors[field.field_id]}</p>
          )}
        </div>
      ))}

      <Button
        className="w-full bg-primary hover:bg-primary/90"
        onClick={handleSubmit}
        disabled={isExecuting}
      >
        {isExecuting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          'Submit'
        )}
      </Button>

      <ActionsPreview actions={actions} />
    </div>
  )
}

// ============================================================================
// Wait Node Interaction
// ============================================================================

function formatCountdown(targetDate: string): string {
  const now = new Date()
  const target = new Date(targetDate)
  const diffMs = target.getTime() - now.getTime()

  if (diffMs <= 0) return 'now'

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)
  const remainingHours = diffHours % 24

  const parts: string[] = []
  if (diffDays > 0) parts.push(`${diffDays} day${diffDays !== 1 ? 's' : ''}`)
  if (remainingHours > 0) parts.push(`${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`)
  return parts.length > 0 ? parts.join(', ') : 'less than an hour'
}

function WaitInteraction({
  node,
  instance,
  onExecute,
  isExecuting,
}: {
  node: AutomatorNode
  instance: AutomatorInstance
  onExecute: (
    nodeId: string,
    response?: Record<string, unknown>,
    branchTaken?: string
  ) => void
  isExecuting: boolean
}) {
  const [, setTick] = useState(0)

  // Re-render every minute to update countdown
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60_000)
    return () => clearInterval(interval)
  }, [])

  const now = new Date()
  const showAt = instance.wait_show_at ? new Date(instance.wait_show_at) : null
  const dueAt = instance.wait_due_at ? new Date(instance.wait_due_at) : null

  const isBeforeShow = showAt && now < showAt
  const isOverdue = dueAt && now > dueAt

  if (isBeforeShow) {
    return (
      <div className="text-center py-4 space-y-3">
        <Clock className="h-8 w-8 mx-auto text-amber-500" />
        <div>
          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-300 dark:border-amber-700">
            Scheduled
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Will appear in <span className="font-medium text-foreground">{formatCountdown(instance.wait_show_at!)}</span>
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-center py-2 space-y-2">
        <Clock className="h-8 w-8 mx-auto text-primary" />
        {isOverdue ? (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-300 dark:border-red-700">
            Overdue
          </Badge>
        ) : (
          <Badge className="bg-primary/10 text-primary border border-primary/30">
            Ready
          </Badge>
        )}
        {dueAt && !isOverdue && (
          <p className="text-sm text-muted-foreground">
            Due in <span className="font-medium text-foreground">{formatCountdown(instance.wait_due_at!)}</span>
          </p>
        )}
        {isOverdue && (
          <p className="text-sm text-red-600 dark:text-red-400">
            Was due {formatCountdown(instance.wait_due_at!)} ago
          </p>
        )}
      </div>

      <Button
        className="w-full bg-primary hover:bg-primary/90"
        onClick={() => onExecute(node.id)}
        disabled={isExecuting}
      >
        {isExecuting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Continuing...
          </>
        ) : (
          'Continue'
        )}
      </Button>
    </div>
  )
}

// ============================================================================
// End Node Display
// ============================================================================

function EndNodeDisplay({ node }: { node: AutomatorNode }) {
  const data = node.data as EndNodeData
  const outcomeConfig = {
    success: {
      label: 'Completed Successfully',
      badge: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-300 dark:border-green-700',
    },
    failure: {
      label: 'Ended with Failure',
      badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-300 dark:border-red-700',
    },
    cancelled: {
      label: 'Cancelled',
      badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-300 dark:border-amber-700',
    },
  }

  const config = outcomeConfig[data.outcome] ?? outcomeConfig.success

  return (
    <div className="text-center py-4 space-y-3">
      <Flag className="h-8 w-8 mx-auto text-muted-foreground" />
      <div>
        <Badge className={config.badge}>{config.label}</Badge>
      </div>
      {data.description && (
        <p className="text-sm text-muted-foreground">{data.description}</p>
      )}
    </div>
  )
}

// ============================================================================
// Main StepInteractionPanel
// ============================================================================

interface StepInteractionPanelProps {
  instance: AutomatorInstance & { steps: AutomatorInstanceStep[] }
  currentNode: AutomatorNode
  completedSteps: AutomatorInstanceStep[]
  onExecuteStep: (
    nodeId: string,
    response?: Record<string, unknown>,
    branchTaken?: string
  ) => void
  isExecuting: boolean
}

export function StepInteractionPanel({
  instance,
  currentNode,
  completedSteps,
  onExecuteStep,
  isExecuting,
}: StepInteractionPanelProps) {
  // Calculate progress
  const totalNodes = instance.definition_snapshot?.nodes?.filter(
    (n) => n.type !== 'start'
  ).length ?? 0
  const completedCount = completedSteps.length
  const progressPct = totalNodes > 0 ? Math.round((completedCount / totalNodes) * 100) : 0

  const nodeTypeConfig: Record<string, { icon: typeof GitBranch; label: string }> = {
    decision: { icon: GitBranch, label: 'Decision' },
    dataCollection: { icon: Zap, label: 'Action' },
    wait: { icon: Clock, label: 'Wait' },
    end: { icon: Flag, label: 'Completion' },
  }

  const config = nodeTypeConfig[currentNode.type] ?? {
    icon: Zap,
    label: currentNode.type,
  }
  const NodeIcon = config.icon

  return (
    <Card className="border-2 border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <NodeIcon className="h-5 w-5 text-primary" />
            {currentNode.data.label}
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            Step {completedCount + 1} of {totalNodes}
          </Badge>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-1.5 mt-2">
          <div
            className="bg-primary rounded-full h-1.5 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        {currentNode.data.description && (
          <p className="text-sm text-muted-foreground mt-1">
            {currentNode.data.description}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {currentNode.type === 'decision' && (
          <DecisionInteraction
            node={currentNode}
            onExecute={onExecuteStep}
            isExecuting={isExecuting}
          />
        )}
        {currentNode.type === 'dataCollection' && (
          <DataCollectionInteraction
            node={currentNode}
            onExecute={onExecuteStep}
            isExecuting={isExecuting}
          />
        )}
        {currentNode.type === 'wait' && (
          <WaitInteraction
            node={currentNode}
            instance={instance}
            onExecute={onExecuteStep}
            isExecuting={isExecuting}
          />
        )}
        {currentNode.type === 'end' && <EndNodeDisplay node={currentNode} />}
      </CardContent>
    </Card>
  )
}
