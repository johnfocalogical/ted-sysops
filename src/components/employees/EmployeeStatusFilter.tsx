import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { EmployeeStatus } from '@/types/employee.types'

interface EmployeeStatusFilterProps {
  selectedStatus: EmployeeStatus | null
  onSelectionChange: (status: EmployeeStatus | null) => void
}

export function EmployeeStatusFilter({
  selectedStatus,
  onSelectionChange,
}: EmployeeStatusFilterProps) {
  const label = selectedStatus
    ? selectedStatus === 'active' ? 'Active' : 'Inactive'
    : 'Status'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          {label}
          {selectedStatus && (
            <span className="rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
              1
            </span>
          )}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        <DropdownMenuRadioGroup
          value={selectedStatus || ''}
          onValueChange={(value) =>
            onSelectionChange((value as EmployeeStatus) || null)
          }
        >
          <DropdownMenuRadioItem value="">All</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="active">Active</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="inactive">Inactive</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
