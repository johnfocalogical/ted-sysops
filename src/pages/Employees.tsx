import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PageHeader } from '@/components/shared/PageHeader'
import { useTeamContext } from '@/hooks/useTeamContext'
import { useEmployeeStore } from '@/hooks/useEmployeeStore'
import { EmployeeList, EmployeeDetailDrawer } from '@/components/employees'

export function Employees() {
  const { teamId } = useParams<{ orgId: string; teamId: string }>()
  const { hasFullAccess } = useTeamContext()

  const canEdit = hasFullAccess('employees')

  // Drawer state
  const [showDrawer, setShowDrawer] = useState(false)

  // Store
  const employeeStore = useEmployeeStore()

  // Initialize store with team ID
  useEffect(() => {
    if (teamId) {
      employeeStore.setTeamId(teamId)
    }
  }, [teamId])

  // Load data when team changes
  useEffect(() => {
    if (teamId) {
      employeeStore.loadEmployees()
      employeeStore.loadDepartments()
    }
  }, [teamId])

  // Handle employee row click
  const handleEmployeeClick = async (employeeId: string) => {
    await employeeStore.selectEmployee(employeeId)
    setShowDrawer(true)
  }

  if (!teamId) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Invalid team</p>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Employee Sentinel"
        subtitle="Manage your team members and employee profiles"
      />

      {/* View-only banner */}
      {!canEdit && (
        <Alert className="mb-4">
          <AlertDescription>
            You have view-only access to this section. Contact an admin to request edit permissions.
          </AlertDescription>
        </Alert>
      )}

      {/* Employee List */}
      <EmployeeList onEmployeeClick={handleEmployeeClick} />

      {/* Employee Detail Drawer */}
      <EmployeeDetailDrawer
        open={showDrawer}
        onOpenChange={setShowDrawer}
      />
    </div>
  )
}
