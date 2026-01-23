import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

interface DropdownInputProps {
  name: string
  value: string
  onChange: (value: string) => void
  options: string[] | null
  description?: string | null
  isRequired?: boolean
  error?: string
  disabled?: boolean
  onAddOption?: (option: string) => Promise<void>
}

export function DropdownInput({
  name,
  value,
  onChange,
  options,
  description,
  isRequired,
  error,
  disabled,
  onAddOption,
}: DropdownInputProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newOption, setNewOption] = useState('')
  const [adding, setAdding] = useState(false)

  const localOptions = options || []

  const handleAddOption = async () => {
    if (!newOption.trim() || !onAddOption) return

    setAdding(true)
    try {
      await onAddOption(newOption.trim())
      onChange(newOption.trim()) // Auto-select the new option
      setShowAddDialog(false)
      setNewOption('')
    } catch (err) {
      console.error('Error adding option:', err)
    } finally {
      setAdding(false)
    }
  }

  const handleClear = () => {
    onChange('')
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {name}
        {isRequired && <span className="text-destructive ml-1">*</span>}
      </Label>
      <div className="flex gap-2">
        <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger className={`flex-1 ${error ? 'border-destructive' : ''}`}>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {localOptions.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {value && !disabled && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="h-10 w-10"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        {onAddOption && !disabled && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setShowAddDialog(true)}
            className="h-10 w-10"
          >
            <Plus className="h-4 w-4" />
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
              Add a new option to the &quot;{name}&quot; dropdown. This will be
              available for all records using this field.
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
