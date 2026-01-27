import { useMemo } from 'react'
import { X, Trash2 } from 'lucide-react'
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
import { useAutomatorBuilderStore } from '@/stores/automatorBuilderStore'
import type {
  AutomatorNodeData,
  StartNodeData,
  EndNodeData,
  DecisionNodeData,
  DataCollectionNodeData,
} from '@/types/automator.types'

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

  if (!selectedNode) {
    return (
      <div className="w-80 border-l bg-card p-4 flex items-center justify-center text-muted-foreground">
        Select a node to configure
      </div>
    )
  }

  const data = selectedNode.data as AutomatorNodeData
  const nodeType = data.type

  const handleDelete = () => {
    deleteNode(selectedNode.id)
    selectNode(null)
    onClose()
  }

  const updateField = <T extends AutomatorNodeData>(
    field: keyof T,
    value: T[keyof T]
  ) => {
    updateNodeData(selectedNode.id, { [field]: value } as Partial<AutomatorNodeData>)
  }

  return (
    <div className="w-80 border-l bg-card flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold capitalize">{nodeType} Node</h3>
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
            onChange={(e) => updateField('label', e.target.value)}
            placeholder="Node label"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={data.description || ''}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Optional description"
            rows={2}
          />
        </div>

        <Separator />

        {/* Type-specific fields */}
        {nodeType === 'end' && (
          <EndNodeConfig
            data={data as EndNodeData}
            updateField={updateField}
          />
        )}

        {nodeType === 'decision' && (
          <DecisionNodeConfig
            data={data as DecisionNodeData}
            updateField={updateField}
          />
        )}

        {nodeType === 'dataCollection' && (
          <DataCollectionNodeConfig
            data={data as DataCollectionNodeData}
            updateField={updateField}
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

// End Node Config
function EndNodeConfig({
  data,
  updateField,
}: {
  data: EndNodeData
  updateField: <T extends AutomatorNodeData>(field: keyof T, value: T[keyof T]) => void
}) {
  return (
    <div className="space-y-2">
      <Label>Outcome</Label>
      <Select
        value={data.outcome}
        onValueChange={(value) => updateField('outcome', value as EndNodeData['outcome'])}
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

// Decision Node Config
function DecisionNodeConfig({
  data,
  updateField,
}: {
  data: DecisionNodeData
  updateField: <T extends AutomatorNodeData>(field: keyof T, value: T[keyof T]) => void
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="question">Question</Label>
        <Textarea
          id="question"
          value={data.question}
          onChange={(e) => updateField('question', e.target.value)}
          placeholder="Enter the yes/no question"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="storeAs">Store answer as (optional)</Label>
        <Input
          id="storeAs"
          value={data.storeAs || ''}
          onChange={(e) => updateField('storeAs', e.target.value)}
          placeholder="e.g., has_buyer"
        />
        <p className="text-xs text-muted-foreground">
          Field name to store the yes/no answer
        </p>
      </div>
    </>
  )
}

// Data Collection Node Config
function DataCollectionNodeConfig({
  data,
  updateField,
}: {
  data: DataCollectionNodeData
  updateField: <T extends AutomatorNodeData>(field: keyof T, value: T[keyof T]) => void
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="fieldName">Field Name</Label>
        <Input
          id="fieldName"
          value={data.fieldName}
          onChange={(e) => updateField('fieldName', e.target.value)}
          placeholder="e.g., showing_date"
        />
        <p className="text-xs text-muted-foreground">
          Key to store the collected value
        </p>
      </div>

      <div className="space-y-2">
        <Label>Field Type</Label>
        <Select
          value={data.fieldType}
          onValueChange={(value) =>
            updateField('fieldType', value as DataCollectionNodeData['fieldType'])
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="textarea">Text Area</SelectItem>
            <SelectItem value="number">Number</SelectItem>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="select">Select (Dropdown)</SelectItem>
            <SelectItem value="multiselect">Multi-select</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="placeholder">Placeholder</Label>
        <Input
          id="placeholder"
          value={data.placeholder || ''}
          onChange={(e) => updateField('placeholder', e.target.value)}
          placeholder="Enter placeholder text"
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="required">Required</Label>
        <Switch
          id="required"
          checked={data.required}
          onCheckedChange={(checked) => updateField('required', checked)}
        />
      </div>

      {data.fieldType === 'number' && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="min">Min</Label>
              <Input
                id="min"
                type="number"
                value={data.min ?? ''}
                onChange={(e) =>
                  updateField('min', e.target.value ? Number(e.target.value) : undefined)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max">Max</Label>
              <Input
                id="max"
                type="number"
                value={data.max ?? ''}
                onChange={(e) =>
                  updateField('max', e.target.value ? Number(e.target.value) : undefined)
                }
              />
            </div>
          </div>
        </>
      )}
    </>
  )
}
