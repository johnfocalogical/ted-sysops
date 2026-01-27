import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Department } from '@/types/employee.types'

interface OverviewFilterBarProps {
  selectedPeriod: string
  onPeriodChange: (period: string) => void
  departments: Department[]
  selectedDepartmentId: string | null
  onDepartmentChange: (departmentId: string | null) => void
}

export function OverviewFilterBar({
  selectedPeriod,
  onPeriodChange,
  departments,
  selectedDepartmentId,
  onDepartmentChange,
}: OverviewFilterBarProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <Select value={selectedPeriod} onValueChange={onPeriodChange}>
        <SelectTrigger className="w-[160px] h-9 text-sm">
          <SelectValue placeholder="Period" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="month">This Month</SelectItem>
          <SelectItem value="quarter">This Quarter</SelectItem>
          <SelectItem value="ytd">Year to Date</SelectItem>
          <SelectItem value="last_year">Last Year</SelectItem>
          <SelectItem value="all">All Time</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={selectedDepartmentId || 'all'}
        onValueChange={(v) => onDepartmentChange(v === 'all' ? null : v)}
      >
        <SelectTrigger className="w-[180px] h-9 text-sm">
          <SelectValue placeholder="Department" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Departments</SelectItem>
          {departments.map((dept) => (
            <SelectItem key={dept.id} value={dept.id}>
              {dept.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="text-xs text-muted-foreground italic ml-auto">
        Financial metrics available after deal integration
      </span>
    </div>
  )
}
