import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Department } from '@/types/employee.types'

interface DepartmentFilterProps {
  departments: Department[]
  selectedDepartmentId: string | null
  onSelectionChange: (departmentId: string | null) => void
}

export function DepartmentFilter({
  departments,
  selectedDepartmentId,
  onSelectionChange,
}: DepartmentFilterProps) {
  const selectedName = departments.find((d) => d.id === selectedDepartmentId)?.name

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          {selectedName || 'Department'}
          {selectedDepartmentId && (
            <span className="rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
              1
            </span>
          )}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuRadioGroup
          value={selectedDepartmentId || ''}
          onValueChange={(value) => onSelectionChange(value || null)}
        >
          <DropdownMenuRadioItem value="">All Departments</DropdownMenuRadioItem>
          {departments.map((dept) => (
            <DropdownMenuRadioItem key={dept.id} value={dept.id}>
              {dept.name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
