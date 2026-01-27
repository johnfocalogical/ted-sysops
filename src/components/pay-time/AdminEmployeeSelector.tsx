import { useState, useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getEmployeeDirectory } from '@/lib/employeeService'
import type { EmployeeListItem } from '@/types/employee.types'

interface AdminEmployeeSelectorProps {
  currentEmployeeId: string
  teamId: string
  onEmployeeChange: (employeeId: string) => void
}

export function AdminEmployeeSelector({
  currentEmployeeId,
  teamId,
  onEmployeeChange,
}: AdminEmployeeSelectorProps) {
  const [employees, setEmployees] = useState<EmployeeListItem[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const result = await getEmployeeDirectory({ teamId, pageSize: 100 })
        setEmployees(result.data)
      } catch (err) {
        console.error('Error loading employees for selector:', err)
      }
    }

    load()
  }, [teamId])

  if (employees.length === 0) return null

  return (
    <Select value={currentEmployeeId} onValueChange={onEmployeeChange}>
      <SelectTrigger className="w-[240px]">
        <SelectValue placeholder="Select employee" />
      </SelectTrigger>
      <SelectContent>
        {employees.map((emp) => (
          <SelectItem key={emp.id} value={emp.id}>
            <span>{emp.user.full_name || emp.user.email}</span>
            {emp.job_title && (
              <span className="text-muted-foreground ml-1">— {emp.job_title}</span>
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
