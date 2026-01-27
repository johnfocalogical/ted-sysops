import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  Edit2,
  Loader2,
  Mail,
  Phone,
  Shield,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { EmployeeStatusBadge, DepartmentBadge } from '@/components/employees'
import { EmployeeProfileForm } from '@/components/employees/EmployeeProfileForm'
import { ActivityCard } from '@/components/activity'
import { CommissionRulesSection } from '@/components/commissions'
import { useAuth } from '@/hooks/useAuth'
import { useTeamContext } from '@/hooks/useTeamContext'
import { getEmployeeProfileById, updateEmployeeProfile } from '@/lib/employeeService'
import { getActiveDepartments } from '@/lib/departmentService'
import { createActivityLog } from '@/lib/activityLogService'
import { toast } from 'sonner'
import type { EmployeeWithDetails, Department } from '@/types/employee.types'

export function EmployeeDetailPage() {
  const { orgId, teamId, employeeId } = useParams<{
    orgId: string
    teamId: string
    employeeId: string
  }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isAdmin, context } = useTeamContext()

  const [employee, setEmployee] = useState<EmployeeWithDetails | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Check if user can edit this profile
  const canEdit = isAdmin() || (
    context?.teamMember?.user_id === employee?.user.id
  )

  // Load employee data
  useEffect(() => {
    const loadEmployee = async () => {
      if (!employeeId) return

      setLoading(true)
      try {
        const data = await getEmployeeProfileById(employeeId)
        setEmployee(data)
      } catch (err) {
        console.error('Error loading employee:', err)
        toast.error('Failed to load employee profile')
      } finally {
        setLoading(false)
      }
    }

    loadEmployee()
  }, [employeeId])

  // Load departments
  useEffect(() => {
    const loadDepts = async () => {
      if (!teamId) return
      try {
        const data = await getActiveDepartments(teamId)
        setDepartments(data)
      } catch (err) {
        console.error('Error loading departments:', err)
      }
    }

    loadDepts()
  }, [teamId])

  const handleSubmit = async (data: {
    job_title?: string
    department_id?: string
    hire_date?: string
    status: 'active' | 'inactive'
    employee_notes?: string
    emergency_contact_name?: string
    emergency_contact_phone?: string
    emergency_contact_relationship?: string
    contact_methods?: { method_type: 'phone' | 'email' | 'fax' | 'other'; label: string; value: string; is_primary: boolean }[]
  }) => {
    if (!employee || !user || !teamId) return

    setIsSubmitting(true)
    try {
      const updated = await updateEmployeeProfile(employee.id, {
        job_title: data.job_title || null,
        department_id: data.department_id || null,
        hire_date: data.hire_date || null,
        status: data.status,
        employee_notes: data.employee_notes || null,
        emergency_contact_name: data.emergency_contact_name || null,
        emergency_contact_phone: data.emergency_contact_phone || null,
        emergency_contact_relationship: data.emergency_contact_relationship || null,
        contact_methods: data.contact_methods,
      })

      // Log the update
      await createActivityLog(
        {
          team_id: teamId,
          entity_type: 'employee',
          activity_type: 'updated',
          employee_profile_id: employee.id,
          content: 'Updated employee profile',
        },
        user.id
      )

      toast.success('Profile updated successfully')
      setEmployee(updated)
      setIsEditing(false)
    } catch (err) {
      console.error('Error updating employee:', err)
      toast.error('Failed to update profile')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Display name
  const displayName = employee?.user.full_name || employee?.user.email || ''

  // Get initials
  const initials = employee?.user.full_name
    ? employee.user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : (employee?.user.email || '?')[0].toUpperCase()

  // Get primary contact methods
  const primaryPhone = employee?.contact_methods.find(
    (m) => m.method_type === 'phone' && m.is_primary
  ) || employee?.contact_methods.find((m) => m.method_type === 'phone')

  const primaryEmail = employee?.contact_methods.find(
    (m) => m.method_type === 'email' && m.is_primary
  ) || employee?.contact_methods.find((m) => m.method_type === 'email')

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Employee not found</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate(`/org/${orgId}/team/${teamId}/employees`)}
        >
          Back to Employees
        </Button>
      </div>
    )
  }

  if (isEditing) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Cancel Editing
        </Button>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Edit Employee Profile</h2>
          <EmployeeProfileForm
            employee={employee}
            departments={departments}
            onSubmit={handleSubmit}
            onCancel={() => setIsEditing(false)}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 pb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/org/${orgId}/team/${teamId}/employees`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Employees
          </Link>
        </Button>

        {canEdit && (
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Edit2 className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        )}
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Scrollable */}
        <div className="overflow-y-auto space-y-4 pr-2">
          {/* Employee Header */}
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={employee.user.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold truncate">{displayName}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <EmployeeStatusBadge status={employee.status} />
                {employee.department && (
                  <DepartmentBadge name={employee.department.name} />
                )}
              </div>
              {employee.job_title && (
                <p className="text-muted-foreground mt-1">{employee.job_title}</p>
              )}
              {/* Quick contact info */}
              <div className="flex flex-wrap gap-4 mt-3 text-sm">
                {primaryPhone && (
                  <a
                    href={`tel:${primaryPhone.value}`}
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <Phone className="h-4 w-4" />
                    {primaryPhone.value}
                  </a>
                )}
                {primaryEmail && (
                  <a
                    href={`mailto:${primaryEmail.value}`}
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <Mail className="h-4 w-4" />
                    {primaryEmail.value}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Contact Methods */}
          {employee.contact_methods.length > 0 && (
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Contact Info
              </div>
              <div className="space-y-2">
                {employee.contact_methods.map((method) => (
                  <div key={method.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      {method.method_type === 'phone' ? (
                        <Phone className="h-4 w-4 text-muted-foreground" />
                      ) : method.method_type === 'email' ? (
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <span className="w-4" />
                      )}
                      {method.method_type === 'phone' ? (
                        <a href={`tel:${method.value}`} className="hover:text-primary">
                          {method.value}
                        </a>
                      ) : method.method_type === 'email' ? (
                        <a href={`mailto:${method.value}`} className="hover:text-primary">
                          {method.value}
                        </a>
                      ) : (
                        <span>{method.value}</span>
                      )}
                      {method.label && (
                        <span className="text-xs text-muted-foreground">({method.label})</span>
                      )}
                    </div>
                    {method.is_primary && (
                      <Badge variant="secondary" className="text-xs">Primary</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Account Email */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Account
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{employee.user.email}</span>
            </div>
          </div>

          {/* Profile Details */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Profile Details
            </div>
            {employee.hire_date && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Hired {new Date(employee.hire_date).toLocaleDateString()}</span>
              </div>
            )}
            {employee.roles.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-wrap gap-1">
                  {employee.roles.map((role) => (
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
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span className="capitalize">{employee.permission_level} access</span>
            </div>
          </div>

          {/* Emergency Contact */}
          {employee.emergency_contact_name && (
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Emergency Contact
              </div>
              <div className="text-sm font-medium">{employee.emergency_contact_name}</div>
              {employee.emergency_contact_relationship && (
                <div className="text-sm text-muted-foreground">
                  {employee.emergency_contact_relationship}
                </div>
              )}
              {employee.emergency_contact_phone && (
                <a
                  href={`tel:${employee.emergency_contact_phone}`}
                  className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                >
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{employee.emergency_contact_phone}</span>
                </a>
              )}
            </div>
          )}

          {/* Notes */}
          {employee.employee_notes && (
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Notes
              </div>
              <p className="text-sm whitespace-pre-wrap">{employee.employee_notes}</p>
            </div>
          )}

          {/* Commission Rules */}
          {teamId && (
            <CommissionRulesSection
              employeeProfileId={employee.id}
              teamId={teamId}
              isAdmin={isAdmin()}
            />
          )}
        </div>

        {/* Right Column - Activity (Full Height) */}
        <div className="flex flex-col min-h-0">
          {/* Activity Card - Takes most of the space */}
          <div className="flex-1 min-h-0 rounded-lg border bg-muted/30 p-4">
            {teamId && (
              <ActivityCard
                entityType="employee"
                entityId={employee.id}
                teamId={teamId}
                compact
                showHeader
              />
            )}
          </div>

          {/* Details Footer */}
          <div className="shrink-0 mt-4 rounded-lg border bg-muted/30 p-4">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Details
            </div>
            <div className="space-y-1 text-sm">
              <div>
                <span className="text-muted-foreground">Profile created: </span>
                {new Date(employee.created_at).toLocaleDateString()}
              </div>
              <div>
                <span className="text-muted-foreground">Last updated: </span>
                {new Date(employee.updated_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
