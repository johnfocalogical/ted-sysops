import { useEffect, useState } from 'react'
import { Search, Loader2, Users } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useEmployeeStore } from '@/hooks/useEmployeeStore'
import { EmployeeStatusBadge } from './EmployeeStatusBadge'
import { DepartmentBadge } from './DepartmentBadge'
import { DepartmentFilter } from './DepartmentFilter'
import { EmployeeStatusFilter } from './EmployeeStatusFilter'
import type { EmployeeListItem } from '@/types/employee.types'

interface EmployeeListProps {
  onEmployeeClick: (employeeId: string) => void
}

export function EmployeeList({ onEmployeeClick }: EmployeeListProps) {
  const {
    employees,
    loading,
    page,
    pageSize,
    totalPages,
    total,
    search,
    departmentFilter,
    statusFilter,
    departments,
    setPage,
    setSearch,
    setDepartmentFilter,
    setStatusFilter,
    loadEmployees,
    loadDepartments,
  } = useEmployeeStore()

  const [searchInput, setSearchInput] = useState(search)

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) {
        setSearch(searchInput)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput, search, setSearch])

  // Load departments on mount
  useEffect(() => {
    loadDepartments()
  }, [loadDepartments])

  // Format display name
  const formatName = (employee: EmployeeListItem) => {
    return employee.user.full_name || employee.user.email
  }

  // Get initials for avatar
  const getInitials = (employee: EmployeeListItem) => {
    if (employee.user.full_name) {
      return employee.user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return employee.user.email[0].toUpperCase()
  }

  // Loading state
  if (loading && employees.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <DepartmentFilter
          departments={departments}
          selectedDepartmentId={departmentFilter}
          onSelectionChange={setDepartmentFilter}
        />
        <EmployeeStatusFilter
          selectedStatus={statusFilter}
          onSelectionChange={setStatusFilter}
        />
      </div>

      {/* Empty State */}
      {employees.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          {searchInput || departmentFilter || statusFilter ? (
            <>
              <h3 className="font-medium">No employees found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your search or filters
              </p>
            </>
          ) : (
            <>
              <h3 className="font-medium">No employees yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Employees are created automatically when team members are added
              </p>
            </>
          )}
        </div>
      )}

      {/* Employee Table */}
      {employees.length > 0 && (
        <>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Roles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow
                    key={employee.id}
                    className={`cursor-pointer hover:bg-muted/50 ${
                      employee.status === 'inactive' ? 'opacity-50' : ''
                    }`}
                    onClick={() => onEmployeeClick(employee.id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={employee.user.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getInitials(employee)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-medium truncate">
                            {formatName(employee)}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {employee.user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {employee.job_title || '—'}
                    </TableCell>
                    <TableCell>
                      {employee.department ? (
                        <DepartmentBadge name={employee.department.name} />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <EmployeeStatusBadge status={employee.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {employee.primary_phone || '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {employee.primary_email || '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {employee.roles.slice(0, 2).map((role) => (
                          <span
                            key={role.id}
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{
                              backgroundColor: `${role.color}20`,
                              color: role.color,
                            }}
                          >
                            {role.name}
                          </span>
                        ))}
                        {employee.roles.length > 2 && (
                          <span className="text-xs text-muted-foreground">
                            +{employee.roles.length - 2}
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * pageSize + 1} to{' '}
                {Math.min(page * pageSize, total)} of {total} employees
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1 || loading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
