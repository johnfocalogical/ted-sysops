import { useNavigate, useParams } from 'react-router-dom'
import {
  Briefcase,
  Calendar,
  ExternalLink,
  Mail,
  Phone,
  Shield,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { EmployeeStatusBadge } from './EmployeeStatusBadge'
import { DepartmentBadge } from './DepartmentBadge'
import { TypeBadge } from '@/components/shared/TypeBadge'
import { ActivityCard } from '@/components/activity'
import type { EmployeeWithDetails } from '@/types/employee.types'

interface EmployeeSummaryPanelProps {
  employee: EmployeeWithDetails
  onClose?: () => void
}

export function EmployeeSummaryPanel({ employee, onClose }: EmployeeSummaryPanelProps) {
  const navigate = useNavigate()
  const { orgId, teamId } = useParams<{ orgId: string; teamId: string }>()

  const displayName = employee.user.full_name || employee.user.email

  // Get initials
  const initials = employee.user.full_name
    ? employee.user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : employee.user.email[0].toUpperCase()

  // Get primary contact methods
  const primaryPhone = employee.contact_methods.find(
    (m) => m.method_type === 'phone' && m.is_primary
  ) || employee.contact_methods.find((m) => m.method_type === 'phone')

  const primaryEmail = employee.contact_methods.find(
    (m) => m.method_type === 'email' && m.is_primary
  ) || employee.contact_methods.find((m) => m.method_type === 'email')

  // Truncate notes
  const truncatedNotes = employee.employee_notes
    ? employee.employee_notes.length > 150
      ? employee.employee_notes.slice(0, 150) + '...'
      : employee.employee_notes
    : null

  const handleViewFullDetails = () => {
    onClose?.()
    navigate(`/org/${orgId}/team/${teamId}/employees/${employee.id}`)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header - Fixed */}
      <div className="flex items-start gap-3 shrink-0">
        <Avatar className="h-12 w-12">
          <AvatarImage src={employee.user.avatar_url || undefined} />
          <AvatarFallback className="bg-primary text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg truncate">{displayName}</h3>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <EmployeeStatusBadge status={employee.status} />
            {employee.department && (
              <DepartmentBadge
                name={employee.department.name}
                icon={employee.department.icon}
                color={employee.department.color}
              />
            )}
            {employee.employee_types?.map((et) => (
              <TypeBadge
                key={et.id}
                name={et.name}
                icon={et.icon}
                color={et.color}
                size="sm"
              />
            ))}
          </div>
          {employee.job_title && (
            <p className="text-sm text-muted-foreground mt-1">{employee.job_title}</p>
          )}
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto min-h-0 mt-4 space-y-4">
        {/* Contact Info */}
        <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Contact Info
          </div>
          {primaryPhone && (
            <a
              href={`tel:${primaryPhone.value}`}
              className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
            >
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{primaryPhone.value}</span>
              {primaryPhone.label && (
                <span className="text-xs text-muted-foreground">({primaryPhone.label})</span>
              )}
            </a>
          )}
          {primaryEmail && (
            <a
              href={`mailto:${primaryEmail.value}`}
              className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
            >
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{primaryEmail.value}</span>
            </a>
          )}
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="truncate text-muted-foreground">{employee.user.email}</span>
            <span className="text-xs text-muted-foreground">(account)</span>
          </div>
          {!primaryPhone && !primaryEmail && (
            <p className="text-sm text-muted-foreground">No contact methods</p>
          )}
        </div>

        {/* Profile Details */}
        <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Profile
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
          <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Emergency Contact
            </div>
            <div className="text-sm font-medium">{employee.emergency_contact_name}</div>
            {employee.emergency_contact_relationship && (
              <div className="text-xs text-muted-foreground">
                {employee.emergency_contact_relationship}
              </div>
            )}
            {employee.emergency_contact_phone && (
              <a
                href={`tel:${employee.emergency_contact_phone}`}
                className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
              >
                <Phone className="h-3 w-3 text-muted-foreground" />
                <span>{employee.emergency_contact_phone}</span>
              </a>
            )}
          </div>
        )}

        {/* Notes Preview */}
        {truncatedNotes && (
          <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Notes
            </div>
            <p className="text-sm text-muted-foreground">{truncatedNotes}</p>
          </div>
        )}

        {/* Activity Preview */}
        {teamId && (
          <div className="rounded-lg border bg-muted/30 p-3 h-[280px]">
            <ActivityCard
              entityType="employee"
              entityId={employee.id}
              teamId={teamId}
              compact
              maxItems={10}
              showHeader
            />
          </div>
        )}
      </div>

      {/* View Full Details Button - Fixed at bottom */}
      <div className="pt-4 shrink-0">
        <Button onClick={handleViewFullDetails} className="w-full">
          <ExternalLink className="mr-2 h-4 w-4" />
          View Full Profile
        </Button>
      </div>
    </div>
  )
}
