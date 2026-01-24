import { useNavigate, useParams } from 'react-router-dom'
import { Building2, ExternalLink, Mail, Phone, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
    <div className="flex flex-col h-full">
      {/* Header - Fixed */}
      <div className="flex items-start gap-3 shrink-0">
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

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto min-h-0 mt-4 space-y-4">
        {/* Primary Contact Info */}
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
          {!primaryPhone && !primaryEmail && (
            <p className="text-sm text-muted-foreground">No contact methods</p>
          )}
        </div>

        {/* Companies */}
        {contact.companies.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <Building2 className="h-3 w-3" />
              Companies ({contact.companies.length})
            </div>
            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
              {contact.companies.map((link) => (
                <div
                  key={link.id}
                  className="rounded-lg border bg-muted/30 p-3 space-y-2"
                >
                  <div>
                    <div className="font-medium text-sm">{link.company.name}</div>
                    {link.role_title && (
                      <div className="text-xs text-muted-foreground">{link.role_title}</div>
                    )}
                  </div>
                  {/* Company Types */}
                  {link.company.types && link.company.types.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {link.company.types.map((type) => (
                        <Badge
                          key={type.id}
                          variant="outline"
                          className="text-xs px-1.5 py-0"
                          style={{
                            borderColor: type.color,
                            color: type.color,
                          }}
                        >
                          {type.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {/* Relationship Contact Methods */}
                  {link.contact_methods.length > 0 && (
                    <div className="space-y-1 pt-1 border-t border-border/50">
                      {link.contact_methods.map((method) => (
                        <div key={method.id} className="flex items-center gap-2 text-xs">
                          {method.method_type === 'phone' ? (
                            <>
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <a
                                href={`tel:${method.value}`}
                                className="hover:text-primary transition-colors"
                              >
                                {method.value}
                              </a>
                            </>
                          ) : method.method_type === 'email' ? (
                            <>
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <a
                                href={`mailto:${method.value}`}
                                className="hover:text-primary transition-colors truncate"
                              >
                                {method.value}
                              </a>
                            </>
                          ) : (
                            <span className="text-muted-foreground">{method.value}</span>
                          )}
                          {method.label && (
                            <span className="text-muted-foreground">({method.label})</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
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
              entityType="contact"
              entityId={contact.id}
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
          View Full Details
        </Button>
      </div>
    </div>
  )
}
