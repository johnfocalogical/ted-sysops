import { useMemo, useState, useEffect } from 'react'
import { X, Trash2, Zap, ChevronDown, ChevronRight, Plus, Minus, FormInput } from 'lucide-react'
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
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useAutomatorBuilderStore } from '@/stores/automatorBuilderStore'
import { ActionEditor } from './actions'
import type {
  AutomatorNodeData,
  EndNodeData,
  DecisionNodeData,
  DecisionOption,
  DataCollectionNodeData,
  DataCollectionField,
  DataCollectionFieldType,
  AutomatorAction,
  WaitNodeData,
} from '@/types/automator.types'
import { getEffectiveOptions } from '@/lib/decisionNodeUtils'

interface ConfigurationPanelProps {
  onClose: () => void
}

export function ConfigurationPanel({ onClose }: ConfigurationPanelProps) {
  const { nodes, selectedNodeId, updateNodeData, deleteNode, selectNode } =
    useAutomatorBuilderStore()

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId),
    [nodes, selectedNodeId]
  )

  const data = selectedNode?.data as AutomatorNodeData | undefined
  const nodeType = data?.type

  // Get branch labels from the node's options (not from edges)
  const branchLabels = useMemo(() => {
    if (nodeType !== 'decision' || !selectedNode) return []
    const decData = selectedNode.data as DecisionNodeData
    return getEffectiveOptions(decData.options).map((o) => o.label)
  }, [selectedNode, nodeType])

  if (!selectedNode || !data) {
    return (
      <div className="w-80 border-l bg-card p-4 flex items-center justify-center text-muted-foreground">
        Select a node to configure
      </div>
    )
  }

  const handleDelete = () => {
    deleteNode(selectedNode.id)
    selectNode(null)
    onClose()
  }

  // Direct update via store — avoids the keyof typing constraints from the old generic
  const handleUpdateData = (updates: Record<string, unknown>) => {
    updateNodeData(selectedNode.id, updates as Partial<AutomatorNodeData>)
  }

  return (
    <div className="w-80 border-l bg-card flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold capitalize">
          {{ start: 'Start', end: 'End', decision: 'Decision', dataCollection: 'Action', wait: 'Wait' }[nodeType ?? ''] ?? nodeType} Node
        </h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Common Fields */}
        <div className="space-y-2">
          <Label htmlFor="label">Label</Label>
          <Input
            id="label"
            value={data.label}
            onChange={(e) => handleUpdateData({ label: e.target.value })}
            placeholder="Node label"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={data.description || ''}
            onChange={(e) => handleUpdateData({ description: e.target.value })}
            placeholder="Optional description"
            rows={2}
          />
        </div>

        <Separator />

        {/* Type-specific fields */}
        {nodeType === 'end' && (
          <EndNodeConfig
            data={data as EndNodeData}
            onUpdate={handleUpdateData}
          />
        )}

        {nodeType === 'decision' && (
          <DecisionNodeConfig
            data={data as DecisionNodeData}
            onUpdate={handleUpdateData}
          />
        )}

        {nodeType === 'dataCollection' && (
          <DataCollectionNodeConfig
            data={data as DataCollectionNodeData}
            onUpdate={handleUpdateData}
          />
        )}

        {nodeType === 'wait' && (
          <WaitNodeConfig
            data={data as WaitNodeData}
            onUpdate={handleUpdateData}
          />
        )}

        {/* Backend Actions Section — all non-start nodes */}
        {nodeType !== 'start' && (
          <BackendActionsSection
            data={data}
            nodeType={nodeType}
            branchLabels={branchLabels}
            onUpdate={handleUpdateData}
          />
        )}
      </div>

      {/* Footer - Delete button */}
      <div className="p-4 border-t">
        <Button
          variant="destructive"
          size="sm"
          className="w-full"
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Node
        </Button>
      </div>
    </div>
  )
}

// ============================================================================
// Backend Actions Section
// ============================================================================

function BackendActionsSection({
  data,
  nodeType,
  branchLabels,
  onUpdate,
}: {
  data: AutomatorNodeData
  nodeType: string
  branchLabels: string[]
  onUpdate: (updates: Record<string, unknown>) => void
}) {
  const [expanded, setExpanded] = useState(false)

  const globalActions: AutomatorAction[] = data.actions || []
  const branchActions: Record<string, AutomatorAction[]> =
    nodeType === 'decision' ? (data as DecisionNodeData).branch_actions || {} : {}

  const totalActionCount =
    globalActions.length +
    Object.values(branchActions).reduce((sum, arr) => sum + arr.length, 0)

  // Get available data collection fields for ValueSourcePicker
  const availableFields =
    nodeType === 'dataCollection' ? (data as DataCollectionNodeData).fields || [] : []

  return (
    <>
      <Separator />
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 py-1 text-left"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-purple-500" />
        ) : (
          <ChevronRight className="h-4 w-4 text-purple-500" />
        )}
        <Zap className="h-4 w-4 text-purple-500" />
        <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
          Backend Actions
        </span>
        {totalActionCount > 0 && (
          <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">
            {totalActionCount}
          </Badge>
        )}
      </button>

      {expanded && (
        <div className="space-y-3">
          <p className="text-[10px] text-muted-foreground">
            When this step completes, automatically...
          </p>

          {/* Global actions (all node types) */}
          <div className="space-y-1">
            <Label className="text-xs">Actions</Label>
            <ActionEditor
              actions={globalActions}
              onChange={(actions) => onUpdate({ actions })}
              availableFields={availableFields}
            />
          </div>

          {/* Branch-specific actions (decision nodes only) */}
          {nodeType === 'decision' && branchLabels.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs">Branch-Specific Actions</Label>
              <Tabs defaultValue={branchLabels[0]} className="w-full">
                <TabsList className="w-full h-7">
                  {branchLabels.map((label) => (
                    <TabsTrigger key={label} value={label} className="text-xs h-6 flex-1">
                      {label} Actions
                    </TabsTrigger>
                  ))}
                </TabsList>
                {branchLabels.map((label) => (
                  <TabsContent key={label} value={label} className="mt-2">
                    <ActionEditor
                      actions={branchActions[label] || []}
                      onChange={(actions) =>
                        onUpdate({
                          branch_actions: { ...branchActions, [label]: actions },
                        })
                      }
                      availableFields={availableFields}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          )}

          {nodeType === 'decision' && branchLabels.length === 0 && (
            <p className="text-[10px] text-muted-foreground italic">
              Connect branches first to configure branch-specific actions
            </p>
          )}
        </div>
      )}
    </>
  )
}

// ============================================================================
// End Node Config
// ============================================================================

function EndNodeConfig({
  data,
  onUpdate,
}: {
  data: EndNodeData
  onUpdate: (updates: Record<string, unknown>) => void
}) {
  return (
    <div className="space-y-2">
      <Label>Outcome</Label>
      <Select
        value={data.outcome}
        onValueChange={(value) => onUpdate({ outcome: value })}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="success">Success</SelectItem>
          <SelectItem value="failure">Failure</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

// ============================================================================
// Decision Node Config
// ============================================================================

function DecisionNodeConfig({
  data,
  onUpdate,
}: {
  data: DecisionNodeData
  onUpdate: (updates: Record<string, unknown>) => void
}) {
  const options = getEffectiveOptions(data.options)

  const handleOptionLabelChange = (idx: number, label: string) => {
    const next = options.map((o, i) => (i === idx ? { ...o, label } : o))
    onUpdate({ options: next })
  }

  const handleAddOption = () => {
    if (options.length >= 6) return
    const nextId = `option_${Date.now()}`
    const next = [...options, { id: nextId, label: `Option ${options.length + 1}` }]
    onUpdate({ options: next })
  }

  const handleRemoveOption = (idx: number) => {
    if (options.length <= 2) return
    const removed = options[idx]
    const next = options.filter((_, i) => i !== idx)
    // Clean up branch_actions for the removed option label
    if (data.branch_actions) {
      const updatedBranchActions = { ...data.branch_actions }
      delete updatedBranchActions[removed.label]
      onUpdate({ options: next, branch_actions: updatedBranchActions })
    } else {
      onUpdate({ options: next })
    }
  }

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="question">Question</Label>
        <Textarea
          id="question"
          value={data.question}
          onChange={(e) => onUpdate({ question: e.target.value })}
          placeholder="Enter the decision question"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="storeAs">Store answer as (optional)</Label>
        <Input
          id="storeAs"
          value={data.storeAs || ''}
          onChange={(e) => onUpdate({ storeAs: e.target.value })}
          placeholder="e.g., has_buyer"
        />
        <p className="text-xs text-muted-foreground">
          Field name to store the chosen branch label
        </p>
      </div>

      <Separator />

      {/* Branch Options */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Branch Options</Label>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleAddOption}
            disabled={options.length >= 6}
            title="Add option"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="space-y-1.5">
          {options.map((opt, idx) => (
            <div key={opt.id} className="flex items-center gap-1.5">
              <Input
                value={opt.label}
                onChange={(e) => handleOptionLabelChange(idx, e.target.value)}
                className="h-7 text-xs"
                placeholder={`Option ${idx + 1}`}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => handleRemoveOption(idx)}
                disabled={options.length <= 2}
                title="Remove option"
              >
                <Minus className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground">
          {options.length}/6 branches. Min 2 required.
        </p>
      </div>
    </>
  )
}

// ============================================================================
// Wait Node Config
// ============================================================================

function WaitNodeConfig({
  data,
  onUpdate,
}: {
  data: WaitNodeData
  onUpdate: (updates: Record<string, unknown>) => void
}) {
  const showAfter = data.showAfter ?? { days: 0, hours: 0 }
  const dueIn = data.dueIn ?? { days: 0, hours: 0 }
  const showsImmediately = showAfter.days === 0 && showAfter.hours === 0

  return (
    <>
      <div className="space-y-2">
        <Label>Show After</Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Days</Label>
            <Input
              type="number"
              min={0}
              max={365}
              value={showAfter.days}
              onChange={(e) =>
                onUpdate({
                  showAfter: { ...showAfter, days: Math.max(0, Math.min(365, Number(e.target.value) || 0)) },
                })
              }
              className="h-8"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Hours</Label>
            <Input
              type="number"
              min={0}
              max={23}
              value={showAfter.hours}
              onChange={(e) =>
                onUpdate({
                  showAfter: { ...showAfter, hours: Math.max(0, Math.min(23, Number(e.target.value) || 0)) },
                })
              }
              className="h-8"
            />
          </div>
        </div>
        {showsImmediately && (
          <p className="text-[10px] text-amber-600 dark:text-amber-400">
            Task will show immediately
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Due In</Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Days</Label>
            <Input
              type="number"
              min={0}
              max={365}
              value={dueIn.days}
              onChange={(e) =>
                onUpdate({
                  dueIn: { ...dueIn, days: Math.max(0, Math.min(365, Number(e.target.value) || 0)) },
                })
              }
              className="h-8"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Hours</Label>
            <Input
              type="number"
              min={0}
              max={23}
              value={dueIn.hours}
              onChange={(e) =>
                onUpdate({
                  dueIn: { ...dueIn, hours: Math.max(0, Math.min(23, Number(e.target.value) || 0)) },
                })
              }
              className="h-8"
            />
          </div>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground">
        Task becomes visible after the show delay. Due date is relative to when it shows.
      </p>
    </>
  )
}

// ============================================================================
// User Interactions Section (Action Node)
// ============================================================================

function DataCollectionNodeConfig({
  data,
  onUpdate,
}: {
  data: DataCollectionNodeData
  onUpdate: (updates: Record<string, unknown>) => void
}) {
  const [expanded, setExpanded] = useState(false)

  // Legacy migration: if `fields` is undefined and `fieldName` exists, migrate on first render
  useEffect(() => {
    if (!data.fields && data.fieldName) {
      const migratedField: DataCollectionField = {
        field_id: data.field_id ?? `field_${Date.now()}`,
        label: data.label !== 'Action' ? data.label : data.fieldName,
        fieldType: data.fieldType,
        required: data.required,
        placeholder: data.placeholder,
        options: data.options as DataCollectionField['options'],
        min: data.min,
        max: data.max,
        validationMessage: data.validationMessage,
      }
      onUpdate({ fields: [migratedField] })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fields: DataCollectionField[] = data.fields ?? []
  const hasFillFields = fields.length > 0

  const handleAddFillFields = () => {
    if (hasFillFields) return
    const newField: DataCollectionField = {
      field_id: `field_${Date.now()}`,
      label: 'Field 1',
      fieldType: 'text',
      required: false,
    }
    onUpdate({ fields: [newField] })
    setExpanded(true)
  }

  const handleRemoveFillFields = () => {
    onUpdate({ fields: [] })
  }

  const handleAddField = () => {
    const newField: DataCollectionField = {
      field_id: `field_${Date.now()}`,
      label: `Field ${fields.length + 1}`,
      fieldType: 'text',
      required: false,
    }
    onUpdate({ fields: [...fields, newField] })
  }

  const handleUpdateField = (idx: number, updates: Partial<DataCollectionField>) => {
    const next = fields.map((f, i) => (i === idx ? { ...f, ...updates } : f))
    onUpdate({ fields: next })
  }

  const handleRemoveField = (idx: number) => {
    const next = fields.filter((_, i) => i !== idx)
    onUpdate({ fields: next })
  }

  return (
    <>
      <Separator />
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 py-1 text-left"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-primary" />
        ) : (
          <ChevronRight className="h-4 w-4 text-primary" />
        )}
        <FormInput className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-primary">
          User Interactions
        </span>
        {hasFillFields && (
          <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">
            {fields.length} field{fields.length !== 1 ? 's' : ''}
          </Badge>
        )}
      </button>

      {expanded && (
        <div className="space-y-3">
          <p className="text-[10px] text-muted-foreground">
            Collect input from the user during this step.
          </p>

          {/* Fill Fields action card */}
          {hasFillFields && (
            <FillFieldsAction
              fields={fields}
              onAddField={handleAddField}
              onUpdateField={handleUpdateField}
              onRemoveField={handleRemoveField}
              onRemoveAction={handleRemoveFillFields}
            />
          )}

          {/* Add Action button */}
          {!hasFillFields && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleAddFillFields}
            >
              <Plus className="h-3.5 w-3.5 mr-2" />
              Add Action
            </Button>
          )}
        </div>
      )}
    </>
  )
}

// ============================================================================
// Fill Fields Action Card
// ============================================================================

function FillFieldsAction({
  fields,
  onAddField,
  onUpdateField,
  onRemoveField,
  onRemoveAction,
}: {
  fields: DataCollectionField[]
  onAddField: () => void
  onUpdateField: (idx: number, updates: Partial<DataCollectionField>) => void
  onRemoveField: (idx: number) => void
  onRemoveAction: () => void
}) {
  const [open, setOpen] = useState(true)

  return (
    <div className="border rounded-md">
      {/* Action header */}
      <button
        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left hover:bg-muted/50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}
        <FormInput className="h-3.5 w-3.5 text-primary shrink-0" />
        <span className="text-xs font-medium flex-1">Fill Fields</span>
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
          {fields.length}
        </Badge>
      </button>

      {open && (
        <div className="border-t px-2.5 pb-2.5 pt-2 space-y-2">
          {/* Field list */}
          {fields.map((field, idx) => (
            <FieldEditor
              key={field.field_id}
              field={field}
              onUpdate={(updates) => onUpdateField(idx, updates)}
              onRemove={() => onRemoveField(idx)}
            />
          ))}

          {/* Add field */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-7 text-xs"
            onClick={onAddField}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Field
          </Button>

          {/* Remove this action */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-7 text-xs text-destructive hover:text-destructive"
            onClick={onRemoveAction}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Remove Action
          </Button>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Collapsible Field Editor
// ============================================================================

function FieldEditor({
  field,
  onUpdate,
  onRemove,
}: {
  field: DataCollectionField
  onUpdate: (updates: Partial<DataCollectionField>) => void
  onRemove: () => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="border rounded-md bg-muted/20">
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center gap-2 px-2 py-1 text-left hover:bg-muted/50 transition-colors">
            {open ? (
              <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
            )}
            <span className="text-xs truncate flex-1">{field.label}</span>
            <Badge variant="secondary" className="text-[9px] px-1 py-0 shrink-0">
              {field.fieldType}
            </Badge>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-2 pb-2 space-y-2 border-t pt-2">
            {/* Label */}
            <div className="space-y-1">
              <Label className="text-xs">Label</Label>
              <Input
                value={field.label}
                onChange={(e) => onUpdate({ label: e.target.value })}
                className="h-7 text-xs"
                placeholder="Field label"
              />
            </div>

            {/* Field ID (read-only) */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Field ID</Label>
              <Input
                value={field.field_id}
                readOnly
                className="h-7 text-xs bg-muted/50 font-mono"
              />
            </div>

            {/* Field Type */}
            <div className="space-y-1">
              <Label className="text-xs">Type</Label>
              <Select
                value={field.fieldType}
                onValueChange={(v) => onUpdate({ fieldType: v as DataCollectionFieldType })}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="textarea">Text Area</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="select">Select (Dropdown)</SelectItem>
                  <SelectItem value="multiselect">Multi-select</SelectItem>
                  <SelectItem value="contact">Contact</SelectItem>
                  <SelectItem value="currency">Currency</SelectItem>
                  <SelectItem value="dropdown">Dropdown</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Placeholder */}
            <div className="space-y-1">
              <Label className="text-xs">Placeholder</Label>
              <Input
                value={field.placeholder ?? ''}
                onChange={(e) => onUpdate({ placeholder: e.target.value })}
                className="h-7 text-xs"
                placeholder="Placeholder text"
              />
            </div>

            {/* Required toggle */}
            <div className="flex items-center justify-between">
              <Label className="text-xs">Required</Label>
              <Switch
                checked={field.required}
                onCheckedChange={(checked) => onUpdate({ required: checked })}
              />
            </div>

            {/* Min/Max for number types */}
            {(field.fieldType === 'number' || field.fieldType === 'currency') && (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Min</Label>
                  <Input
                    type="number"
                    value={field.min ?? ''}
                    onChange={(e) =>
                      onUpdate({ min: e.target.value ? Number(e.target.value) : undefined })
                    }
                    className="h-7 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Max</Label>
                  <Input
                    type="number"
                    value={field.max ?? ''}
                    onChange={(e) =>
                      onUpdate({ max: e.target.value ? Number(e.target.value) : undefined })
                    }
                    className="h-7 text-xs"
                  />
                </div>
              </div>
            )}

            {/* Remove field */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-6 text-[10px] text-destructive hover:text-destructive"
              onClick={onRemove}
            >
              <Trash2 className="h-2.5 w-2.5 mr-1" />
              Remove Field
            </Button>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
