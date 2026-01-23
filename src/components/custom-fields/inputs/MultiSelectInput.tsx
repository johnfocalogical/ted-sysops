import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Plus, X } from 'lucide-react'

interface MultiSelectInputProps {
  name: string
  value: string[]
  onChange: (value: string[]) => void
  options: string[] | null
  description?: string | null
  isRequired?: boolean
  error?: string
  disabled?: boolean
  onAddOption?: (option: string) => Promise<void>
}

export function MultiSelectInput({
  name,
  value,
  onChange,
  options,
  description,
  isRequired,
  error,
  disabled,
  onAddOption,
}: MultiSelectInputProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newOption, setNewOption] = useState('')
  const [adding, setAdding] = useState(false)

  const localOptions = options || []
  const selectedSet = new Set(value || [])

  const toggleOption = (opt: string) => {
    const newSet = new Set(selectedSet)
    if (newSet.has(opt)) {
      newSet.delete(opt)
    } else {
      newSet.add(opt)
    }
    onChange(Array.from(newSet))
  }

  const removeOption = (opt: string) => {
    const newSet = new Set(selectedSet)
    newSet.delete(opt)
    onChange(Array.from(newSet))
  }

  const handleAddOption = async () => {
    if (!newOption.trim() || !onAddOption) return

    setAdding(true)
    try {
      await onAddOption(newOption.trim())
      // Also select the new option
      const newSet = new Set(selectedSet)
      newSet.add(newOption.trim())
      onChange(Array.from(newSet))
      setShowAddDialog(false)
      setNewOption('')
    } catch (err) {
      console.error('Error adding option:', err)
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="space-y-2">
      <Label>
        {name}
        {isRequired && <span className="text-destructive ml-1">*</span>}
      </Label>

      {/* Selected items display */}
      {value && value.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {value.map((item) => (
            <Badge key={item} variant="secondary" className="text-xs">
              {item}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeOption(item)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Options checkboxes */}
      <div className={`border rounded-md p-3 space-y-2 ${error ? 'border-destructive' : ''}`}>
        {localOptions.map((opt) => (
          <div key={opt} className="flex items-center gap-2">
            <Checkbox
              id={`${name}-${opt}`}
              checked={selectedSet.has(opt)}
              onCheckedChange={() => toggleOption(opt)}
              disabled={disabled}
            />
            <label
              htmlFor={`${name}-${opt}`}
              className="text-sm cursor-pointer"
            >
              {opt}
            </label>
          </div>
        ))}
        {localOptions.length === 0 && (
          <p className="text-sm text-muted-foreground">No options available</p>
        )}
        {onAddOption && !disabled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowAddDialog(true)}
            className="mt-2"
          >
            <Plus className="mr-2 h-3 w-3" />
            Add Option
          </Button>
        )}
      </div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add New Option</DialogTitle>
            <DialogDescription>
              Add a new option to &quot;{name}&quot;. This will be available for
              all records using this field.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              placeholder="Enter new option"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddOption()
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddOption} disabled={!newOption.trim() || adding}>
              {adding ? 'Adding...' : 'Add Option'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
