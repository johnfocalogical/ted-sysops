import { Check, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ContactType } from '@/types/contact.types'

interface ContactTypeFilterProps {
  types: ContactType[]
  selectedTypeIds: string[]
  onSelectionChange: (typeIds: string[]) => void
}

export function ContactTypeFilter({
  types,
  selectedTypeIds,
  onSelectionChange,
}: ContactTypeFilterProps) {
  const handleToggle = (typeId: string) => {
    if (selectedTypeIds.includes(typeId)) {
      onSelectionChange(selectedTypeIds.filter((id) => id !== typeId))
    } else {
      onSelectionChange([...selectedTypeIds, typeId])
    }
  }

  const handleClear = () => {
    onSelectionChange([])
  }

  const selectedCount = selectedTypeIds.length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          Type
          {selectedCount > 0 && (
            <span className="rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
              {selectedCount}
            </span>
          )}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {types.map((type) => (
          <DropdownMenuCheckboxItem
            key={type.id}
            checked={selectedTypeIds.includes(type.id)}
            onCheckedChange={() => handleToggle(type.id)}
          >
            {type.name}
          </DropdownMenuCheckboxItem>
        ))}
        {selectedCount > 0 && (
          <>
            <div className="my-1 border-t" />
            <button
              onClick={handleClear}
              className="w-full px-2 py-1.5 text-left text-sm text-muted-foreground hover:bg-muted rounded"
            >
              Clear filter
            </button>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
