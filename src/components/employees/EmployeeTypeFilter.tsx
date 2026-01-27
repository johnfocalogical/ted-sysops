import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { TeamEmployeeType } from '@/types/type-system.types'

interface EmployeeTypeFilterProps {
  employeeTypes: TeamEmployeeType[]
  selectedTypeId: string | null
  onSelectionChange: (typeId: string | null) => void
}

export function EmployeeTypeFilter({
  employeeTypes,
  selectedTypeId,
  onSelectionChange,
}: EmployeeTypeFilterProps) {
  const selectedName = employeeTypes.find((t) => t.id === selectedTypeId)?.name

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          {selectedName || 'Employee Type'}
          {selectedTypeId && (
            <span className="rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
              1
            </span>
          )}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuRadioGroup
          value={selectedTypeId || ''}
          onValueChange={(value) => onSelectionChange(value || null)}
        >
          <DropdownMenuRadioItem value="">All Types</DropdownMenuRadioItem>
          {employeeTypes.map((type) => (
            <DropdownMenuRadioItem key={type.id} value={type.id}>
              {type.name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
