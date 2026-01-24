import { useNavigate, useParams } from 'react-router-dom'
import { Building2, ExternalLink, Mail, Phone, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ContactTypeBadge } from './ContactTypeBadge'
import { ActivityCard } from '@/components/activity'
import type { ContactWithDetails } from '@/types/contact.types'

interface ContactSummaryPanelProps {
  contact: ContactWithDetails
  onClose?: () => void
}

export function ContactSummaryPanel({ contact, onClose }: ContactSummaryPanelProps) {
  const navigate = useNavigate()
  const { orgId, teamId } = useParams<{ orgId: string; teamId: string }>()

  // Format display name
  const displayName = contact.last_name
    ? `${contact.first_name} ${contact.last_name}`
    : contact.first_name

  // Get primary phone and email
  const primaryPhone = contact.contact_methods.find(
    (m) => m.method_type === 'phone' && m.is_primary
  ) || contact.contact_methods.find((m) => m.method_type === 'phone')

  const primaryEmail = contact.contact_methods.find(
    (m) => m.method_type === 'email' && m.is_primary
  ) || contact.contact_methods.find((m) => m.method_type === 'email')

  // Truncate notes
  const truncatedNotes = contact.notes
    ? contact.notes.length > 150
      ? contact.notes.slice(0, 150) + '...'
      : contact.notes
    : null

  const handleViewFullDetails = () => {
    onClose?.()
    navigate(`/org/${orgId}/team/${teamId}/contacts/${contact.id}`)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground shrink-0">
          <User className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg truncate">{displayName}</h3>
          {contact.types.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {contact.types.map((type) => (
                <ContactTypeBadge key={type.id} type={type} size="sm" />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Primary Contact Info */}
      <div className="space-y-2 border-t pt-4">
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
        {!primaryPhone && !primaryEmail && (
          <p className="text-sm text-muted-foreground">No contact methods</p>
        )}
      </div>

      {/* Companies */}
      {contact.companies.length > 0 && (
        <div className="space-y-2 border-t pt-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Building2 className="h-4 w-4" />
            Companies
          </div>
          <ul className="space-y-1 pl-6">
            {contact.companies.slice(0, 3).map((link) => (
              <li key={link.id} className="text-sm">
                <span className="font-medium">{link.company.name}</span>
                {link.role_title && (
                  <span className="text-muted-foreground"> - {link.role_title}</span>
                )}
              </li>
            ))}
            {contact.companies.length > 3 && (
              <li className="text-sm text-muted-foreground">
                +{contact.companies.length - 3} more
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Notes Preview */}
      {truncatedNotes && (
        <div className="space-y-2 border-t pt-4">
          <div className="text-sm font-medium">Notes</div>
          <p className="text-sm text-muted-foreground">{truncatedNotes}</p>
        </div>
      )}

      {/* Activity Preview */}
      {teamId && (
        <div className="border-t pt-4">
          <ActivityCard
            entityType="contact"
            entityId={contact.id}
            teamId={teamId}
            compact
            maxItems={3}
            showHeader
          />
        </div>
      )}

      {/* View Full Details Button */}
      <div className="border-t pt-4">
        <Button onClick={handleViewFullDetails} className="w-full">
          <ExternalLink className="mr-2 h-4 w-4" />
          View Full Details
        </Button>
      </div>
    </div>
  )
}
