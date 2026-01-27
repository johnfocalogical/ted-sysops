import type { EmployeeListItem } from '@/types/employee.types'

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * Export employee directory to CSV and trigger browser download.
 */
export function exportEmployeesToCSV(
  employees: EmployeeListItem[],
  teamName: string
): void {
  const headers = [
    'Name',
    'Email',
    'Job Title',
    'Department',
    'Status',
    'Employee Types',
    'Hire Date',
    'Phone',
    'Roles',
  ]

  const rows = employees.map((emp) => {
    const name = emp.user.full_name || ''
    const email = emp.user.email || ''
    const jobTitle = emp.job_title || ''
    const department = emp.department?.name || ''
    const status = emp.status || ''
    const types = emp.employee_types.map((t) => t.name).join('; ')
    const hireDate = emp.hire_date || ''
    const phone = emp.primary_phone || ''
    const roles = emp.roles.map((r) => r.name).join('; ')

    return [name, email, jobTitle, department, status, types, hireDate, phone, roles]
      .map(escapeCSV)
      .join(',')
  })

  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const safeName = teamName.replace(/[^a-zA-Z0-9]/g, '_')
  const dateStr = new Date().toISOString().split('T')[0]
  const filename = `employees_${safeName}_${dateStr}.csv`

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
