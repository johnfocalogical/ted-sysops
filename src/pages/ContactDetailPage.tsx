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
  Link as LinkIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import type { ContactWithDetails, ContactMethod } from '@/types/contact.types'
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

  // Group contact methods by type
  const groupedMethods = contact?.contact_methods.reduce(
    (acc, method) => {
      if (!acc[method.method_type]) {
        acc[method.method_type] = []
      }
      acc[method.method_type].push(method)
      return acc
    },
    {} as Record<string, ContactMethod[]>
  )

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

        <Card>
          <CardHeader>
            <CardTitle>Edit Contact</CardTitle>
          </CardHeader>
          <CardContent>
            <ContactForm
              contact={contact}
              contactTypes={contactTypes}
              companyTypes={companyTypes}
              teamId={contact.team_id}
              onSubmit={handleSubmit}
              onCancel={() => setIsEditing(false)}
              isSubmitting={isSubmitting}
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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

      {/* Contact Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
              <User className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl">{displayName}</CardTitle>
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
        </CardHeader>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Notes */}
          {contact.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{contact.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Contact Methods */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Contact Methods</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {contact.contact_methods.length === 0 ? (
                <p className="text-sm text-muted-foreground">No contact methods</p>
              ) : (
                <>
                  {groupedMethods?.phone && groupedMethods.phone.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Phone className="h-4 w-4" />
                        Phone
                      </div>
                      {groupedMethods.phone.map((method) => (
                        <div key={method.id} className="flex items-center justify-between pl-6">
                          <div>
                            <span className="text-sm text-muted-foreground">{method.label}: </span>
                            <a href={`tel:${method.value}`} className="text-sm hover:underline">
                              {method.value}
                            </a>
                          </div>
                          {method.is_primary && (
                            <Badge variant="secondary" className="text-xs">Primary</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {groupedMethods?.email && groupedMethods.email.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Mail className="h-4 w-4" />
                        Email
                      </div>
                      {groupedMethods.email.map((method) => (
                        <div key={method.id} className="flex items-center justify-between pl-6">
                          <div>
                            <span className="text-sm text-muted-foreground">{method.label}: </span>
                            <a href={`mailto:${method.value}`} className="text-sm hover:underline">
                              {method.value}
                            </a>
                          </div>
                          {method.is_primary && (
                            <Badge variant="secondary" className="text-xs">Primary</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {groupedMethods?.fax && groupedMethods.fax.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Fax</div>
                      {groupedMethods.fax.map((method) => (
                        <div key={method.id} className="flex items-center justify-between pl-6">
                          <div>
                            <span className="text-sm text-muted-foreground">{method.label}: </span>
                            <span className="text-sm">{method.value}</span>
                          </div>
                          {method.is_primary && (
                            <Badge variant="secondary" className="text-xs">Primary</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {groupedMethods?.other && groupedMethods.other.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Other</div>
                      {groupedMethods.other.map((method) => (
                        <div key={method.id} className="flex items-center justify-between pl-6">
                          <div>
                            <span className="text-sm text-muted-foreground">{method.label}: </span>
                            <span className="text-sm">{method.value}</span>
                          </div>
                          {method.is_primary && (
                            <Badge variant="secondary" className="text-xs">Primary</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Custom Fields */}
          {customFieldGroups.length > 0 && (
            <CustomFieldsDisplay groups={customFieldGroups} />
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Companies */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Companies ({contact.companies.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {contact.companies.length === 0 ? (
                <p className="text-sm text-muted-foreground">No company links</p>
              ) : (
                contact.companies.map((link) => (
                  <div key={link.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium">{link.company.name}</div>
                        {link.role_title && (
                          <p className="text-sm text-muted-foreground">{link.role_title}</p>
                        )}
                        {link.company.city && (
                          <p className="text-xs text-muted-foreground">
                            {link.company.city}
                            {link.company.state && `, ${link.company.state}`}
                          </p>
                        )}
                      </div>
                      {link.is_primary && (
                        <Badge variant="secondary" className="text-xs">Primary</Badge>
                      )}
                    </div>
                    {/* Work contact methods */}
                    {link.contact_methods.length > 0 && (
                      <div className="mt-2 pt-2 border-t space-y-1">
                        {link.contact_methods.map((method) => (
                          <div key={method.id} className="flex items-center gap-2 text-sm">
                            {method.method_type === 'phone' ? (
                              <Phone className="h-3 w-3 text-muted-foreground" />
                            ) : method.method_type === 'email' ? (
                              <Mail className="h-3 w-3 text-muted-foreground" />
                            ) : (
                              <LinkIcon className="h-3 w-3 text-muted-foreground" />
                            )}
                            <span className="text-muted-foreground">{method.label}:</span>
                            {method.method_type === 'phone' ? (
                              <a href={`tel:${method.value}`} className="hover:underline">
                                {method.value}
                              </a>
                            ) : method.method_type === 'email' ? (
                              <a href={`mailto:${method.value}`} className="hover:underline">
                                {method.value}
                              </a>
                            ) : (
                              <span>{method.value}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Activity */}
          {teamId && (
            <ActivityCard
              entityType="contact"
              entityId={contact.id}
              teamId={teamId}
            />
          )}

          {/* Metadata */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
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
            </CardContent>
          </Card>
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
