import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { BarChart3, Users, Download } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/shared/PageHeader'
import { useTeamContext } from '@/hooks/useTeamContext'
import { useEmployeeStore } from '@/hooks/useEmployeeStore'
import { EmployeeList, EmployeeDetailDrawer } from '@/components/employees'
import { TeamOverviewTab } from '@/components/employees/dashboard/TeamOverviewTab'
import { exportEmployeesToCSV } from '@/lib/employeeExportUtils'
import { toast } from 'sonner'

export function Employees() {
  const { teamId } = useParams<{ orgId: string; teamId: string }>()
  const { context, hasFullAccess } = useTeamContext()

  const canEdit = hasFullAccess('employees')

  // Tab state
  const [activeTab, setActiveTab] = useState<'overview' | 'directory'>('overview')

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

  // Handle CSV export
  const handleExport = () => {
    if (employeeStore.employees.length === 0) {
      toast.error('No employees to export')
      return
    }
    const teamName = context?.team.name || 'team'
    exportEmployeesToCSV(employeeStore.employees, teamName)
    toast.success('Employee directory exported')
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
        subtitle="Performance metrics and team directory"
        actions={
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        }
      />

      {/* View-only banner */}
      {!canEdit && (
        <Alert className="mb-4">
          <AlertDescription>
            You have view-only access to this section. Contact an admin to request edit permissions.
          </AlertDescription>
        </Alert>
      )}

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'overview' | 'directory')}
        className="w-full"
      >
        <TabsList className="mb-4">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="directory" className="gap-2">
            <Users className="h-4 w-4" />
            Directory
            {employeeStore.total > 0 && (
              <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                {employeeStore.total}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0">
          <TeamOverviewTab
            employees={employeeStore.employees}
            departments={employeeStore.departments}
            total={employeeStore.total}
            teamId={teamId}
            loading={employeeStore.loading}
          />
        </TabsContent>

        <TabsContent value="directory" className="mt-0">
          <EmployeeList onEmployeeClick={handleEmployeeClick} />
        </TabsContent>
      </Tabs>

      {/* Employee Detail Drawer */}
      <EmployeeDetailDrawer
        open={showDrawer}
        onOpenChange={setShowDrawer}
      />
    </div>
  )
}
