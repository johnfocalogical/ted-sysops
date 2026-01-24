import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  Edit2,
  Loader2,
  Mail,
  Phone,
  Trash2,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ContactTypeBadge } from '@/components/contacts/ContactTypeBadge'
import { ContactForm } from '@/components/contacts/ContactForm'
import { DeleteContactDialog } from '@/components/contacts/DeleteContactDialog'
import { CustomFieldsDisplay } from '@/components/custom-fields'
import { ActivityCard } from '@/components/activity'
import { useAuth } from '@/hooks/useAuth'
import { useContactStore } from '@/hooks/useContactStore'
import { useCompanyStore } from '@/hooks/useCompanyStore'
import { getContactById, updateContact } from '@/lib/contactService'
import { saveContactMethodsForContact } from '@/lib/contactMethodHelpers'
import { createCompany, linkContactToCompany } from '@/lib/companyService'
import { getContactCustomFieldsGroupedByType } from '@/lib/customFieldValueService'
import { toast } from 'sonner'
import type { ContactWithDetails } from '@/types/contact.types'
import type { CustomFieldsGroupedByType } from '@/types/custom-fields.types'
import type { CompanyTypeSection } from '@/components/shared/CompanyTypeSectionsInput'

export function ContactDetailPage() {
  const { orgId, teamId, contactId } = useParams<{
    orgId: string
    teamId: string
    contactId: string
  }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { contactTypes, loadContactTypes, setTeamId: setContactTeamId } = useContactStore()
  const { companyTypes, loadCompanyTypes, setTeamId: setCompanyTeamId } = useCompanyStore()

  const [contact, setContact] = useState<ContactWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [customFieldGroups, setCustomFieldGroups] = useState<CustomFieldsGroupedByType[]>([])

  // Load contact data
  useEffect(() => {
    const loadContact = async () => {
      if (!contactId) return

      setLoading(true)
      try {
        const data = await getContactById(contactId)
        setContact(data)
      } catch (err) {
        console.error('Error loading contact:', err)
        toast.error('Failed to load contact')
      } finally {
        setLoading(false)
      }
    }

    loadContact()
  }, [contactId])

  // Load types when teamId is available
  useEffect(() => {
    if (teamId) {
      setContactTeamId(teamId)
      setCompanyTeamId(teamId)
      loadContactTypes()
      loadCompanyTypes()
    }
  }, [teamId, setContactTeamId, setCompanyTeamId, loadContactTypes, loadCompanyTypes])

  // Load custom fields when contact changes
  useEffect(() => {
    const loadCustomFields = async () => {
      if (!contact?.id || contact.types.length === 0) {
        setCustomFieldGroups([])
        return
      }

      try {
        const groups = await getContactCustomFieldsGroupedByType(
          contact.id,
          contact.types.map((t) => ({
            id: t.id,
            name: t.name,
            color: t.color,
            icon: t.icon,
          }))
        )
        setCustomFieldGroups(groups)
      } catch (err) {
        console.error('Error loading custom fields:', err)
      }
    }

    loadCustomFields()
  }, [contact?.id, contact?.types])

  const handleSubmit = async (
    data: {
      first_name: string
      last_name?: string
      notes?: string
      type_ids?: string[]
      contact_methods?: { method_type: 'phone' | 'email' | 'fax' | 'other'; label: string; value: string; is_primary: boolean }[]
      company_sections?: CompanyTypeSection[]
    },
    saveCustomFields: (entityId: string) => Promise<void>
  ) => {
    if (!contact || !user) return

    setIsSubmitting(true)
    try {
      await updateContact(contact.id, {
        first_name: data.first_name,
        last_name: data.last_name || null,
        notes: data.notes || null,
        type_ids: data.type_ids,
      })

      if (data.contact_methods) {
        await saveContactMethodsForContact(contact.id, data.contact_methods)
      }

      await saveCustomFields(contact.id)

      // Create new companies and link them
      if (data.company_sections?.length) {
        for (const section of data.company_sections) {
          const company = await createCompany(
            {
              team_id: contact.team_id,
              name: section.company_name,
              type_ids: [section.type_id],
            },
            user.id
          )

          await linkContactToCompany({
            contact_id: contact.id,
            company_id: company.id,
            contact_methods: section.contact_methods,
          })
        }
      }

      toast.success('Contact updated successfully')
      // Reload contact data
      const updatedContact = await getContactById(contact.id)
      setContact(updatedContact)
      setIsEditing(false)
    } catch (err) {
      console.error('Error updating contact:', err)
      toast.error('Failed to update contact')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleted = () => {
    navigate(`/org/${orgId}/team/${teamId}/contacts`)
  }

  // Format display name
  const displayName = contact
    ? contact.last_name
      ? `${contact.first_name} ${contact.last_name}`
      : contact.first_name
    : ''

  // Get primary phone and email
  const primaryPhone = contact?.contact_methods.find(
    (m) => m.method_type === 'phone' && m.is_primary
  ) || contact?.contact_methods.find((m) => m.method_type === 'phone')

  const primaryEmail = contact?.contact_methods.find(
    (m) => m.method_type === 'email' && m.is_primary
  ) || contact?.contact_methods.find((m) => m.method_type === 'email')

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!contact) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Contact not found</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate(`/org/${orgId}/team/${teamId}/contacts`)}
        >
          Back to Contacts
        </Button>
      </div>
    )
  }

  if (isEditing) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back/Cancel Button */}
        <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Cancel Editing
        </Button>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Edit Contact</h2>
          <ContactForm
            contact={contact}
            contactTypes={contactTypes}
            companyTypes={companyTypes}
            teamId={contact.team_id}
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
          <Link to={`/org/${orgId}/team/${teamId}/contacts`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Contacts
          </Link>
        </Button>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Edit2 className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Scrollable */}
        <div className="overflow-y-auto space-y-4 pr-2">
          {/* Contact Header */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl shrink-0">
              <User className="h-8 w-8" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold truncate">{displayName}</h1>
              {contact.types.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {contact.types.map((type) => (
                    <ContactTypeBadge key={type.id} type={type} />
                  ))}
                </div>
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
          {contact.contact_methods.length > 0 && (
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Contact Info
              </div>
              <div className="space-y-2">
                {contact.contact_methods.map((method) => (
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

          {/* Companies */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <Building2 className="h-3 w-3" />
              Companies ({contact.companies.length})
            </div>
            {contact.companies.length === 0 ? (
              <p className="text-sm text-muted-foreground pl-1">No company links</p>
            ) : (
              <div className="space-y-2">
                {contact.companies.map((link) => (
                  <div
                    key={link.id}
                    className="rounded-lg border bg-muted/30 p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium">{link.company.name}</div>
                        {link.role_title && (
                          <div className="text-sm text-muted-foreground">{link.role_title}</div>
                        )}
                      </div>
                      {link.is_primary && (
                        <Badge variant="secondary" className="text-xs">Primary</Badge>
                      )}
                    </div>
                    {/* Company Types */}
                    {link.company.types && link.company.types.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {link.company.types.map((type) => (
                          <Badge
                            key={type.id}
                            variant="outline"
                            className="text-xs"
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
                      <div className="space-y-1 pt-2 border-t border-border/50">
                        {link.contact_methods.map((method) => (
                          <div key={method.id} className="flex items-center gap-2 text-sm">
                            {method.method_type === 'phone' ? (
                              <Phone className="h-3 w-3 text-muted-foreground" />
                            ) : method.method_type === 'email' ? (
                              <Mail className="h-3 w-3 text-muted-foreground" />
                            ) : (
                              <span className="w-3" />
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
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          {contact.notes && (
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Notes
              </div>
              <p className="text-sm whitespace-pre-wrap">{contact.notes}</p>
            </div>
          )}

          {/* Custom Fields */}
          {customFieldGroups.length > 0 && (
            <CustomFieldsDisplay groups={customFieldGroups} />
          )}
        </div>

        {/* Right Column - Activity (Full Height) */}
        <div className="flex flex-col min-h-0">
          {/* Activity Card - Takes most of the space */}
          <div className="flex-1 min-h-0 rounded-lg border bg-muted/30 p-4">
            {teamId && (
              <ActivityCard
                entityType="contact"
                entityId={contact.id}
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
                <span className="text-muted-foreground">Created: </span>
                {new Date(contact.created_at).toLocaleDateString()}
                {contact.created_by_user && (
                  <span> by {contact.created_by_user.full_name || contact.created_by_user.email}</span>
                )}
              </div>
              <div>
                <span className="text-muted-foreground">Last updated: </span>
                {new Date(contact.updated_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      <DeleteContactDialog
        contactId={contact.id}
        contactName={displayName}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onDeleted={handleDeleted}
      />
    </div>
  )
}
