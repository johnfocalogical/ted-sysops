import { useState, useEffect } from 'react'
import {
  Building2,
  Edit2,
  Loader2,
  Mail,
  Phone,
  Trash2,
  User,
  Link as LinkIcon,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ContactTypeBadge } from './ContactTypeBadge'
import { ContactForm } from './ContactForm'
import { DeleteContactDialog } from './DeleteContactDialog'
import { CustomFieldsDisplay } from '@/components/custom-fields'
import { useContactStore } from '@/hooks/useContactStore'
import { useTeamContext } from '@/hooks/useTeamContext'
import { updateContact } from '@/lib/contactService'
import { saveContactMethodsForContact } from '@/lib/contactMethodHelpers'
import { getContactCustomFieldsGroupedByType } from '@/lib/customFieldValueService'
import { toast } from 'sonner'
import type { ContactMethod } from '@/types/contact.types'
import type { CustomFieldsGroupedByType } from '@/types/custom-fields.types'

interface ContactDetailDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  canEdit?: boolean
}

export function ContactDetailDrawer({
  open,
  onOpenChange,
  canEdit = true,
}: ContactDetailDrawerProps) {
  const {
    selectedContact,
    loadingSelected,
    contactTypes,
    refreshSelected,
    refreshList,
    selectContact,
  } = useContactStore()

  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [customFieldGroups, setCustomFieldGroups] = useState<CustomFieldsGroupedByType[]>([])

  // Load custom field values when contact changes
  useEffect(() => {
    const loadCustomFields = async () => {
      if (!selectedContact?.id || selectedContact.types.length === 0) {
        setCustomFieldGroups([])
        return
      }

      try {
        const groups = await getContactCustomFieldsGroupedByType(
          selectedContact.id,
          selectedContact.types.map((t) => ({
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
  }, [selectedContact?.id, selectedContact?.types])

  const handleClose = () => {
    setIsEditing(false)
    onOpenChange(false)
    selectContact(null)
  }

  const handleSubmit = async (
    data: {
      first_name: string
      last_name?: string
      notes?: string
      type_ids?: string[]
      contact_methods?: { method_type: 'phone' | 'email' | 'fax' | 'other'; label: string; value: string; is_primary: boolean }[]
    },
    saveCustomFields: (entityId: string) => Promise<void>
  ) => {
    if (!selectedContact) return

    setIsSubmitting(true)
    try {
      await updateContact(selectedContact.id, {
        first_name: data.first_name,
        last_name: data.last_name || null,
        notes: data.notes || null,
        type_ids: data.type_ids,
      })

      // Update contact methods separately
      if (data.contact_methods) {
        await saveContactMethodsForContact(selectedContact.id, data.contact_methods)
      }

      // Save custom field values
      await saveCustomFields(selectedContact.id)

      toast.success('Contact updated successfully')
      await refreshSelected()
      await refreshList()
      setIsEditing(false)
    } catch (err) {
      console.error('Error updating contact:', err)
      toast.error('Failed to update contact')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleted = () => {
    refreshList()
    handleClose()
  }

  // Format display name
  const displayName = selectedContact
    ? selectedContact.last_name
      ? `${selectedContact.first_name} ${selectedContact.last_name}`
      : selectedContact.first_name
    : ''

  // Group contact methods by type
  const groupedMethods = selectedContact?.contact_methods.reduce(
    (acc, method) => {
      if (!acc[method.method_type]) {
        acc[method.method_type] = []
      }
      acc[method.method_type].push(method)
      return acc
    },
    {} as Record<string, ContactMethod[]>
  )

  return (
    <>
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {loadingSelected ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !selectedContact ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Contact not found</p>
            </div>
          ) : isEditing ? (
            // Edit Mode
            <div>
              <SheetHeader className="mb-6">
                <SheetTitle>Edit Contact</SheetTitle>
                <SheetDescription>
                  Update contact information
                </SheetDescription>
              </SheetHeader>
              <ContactForm
                contact={selectedContact}
                contactTypes={contactTypes}
                onSubmit={handleSubmit}
                onCancel={() => setIsEditing(false)}
                isSubmitting={isSubmitting}
              />
            </div>
          ) : (
            // View Mode
            <div>
              <SheetHeader className="mb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <SheetTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {displayName}
                    </SheetTitle>
                    {selectedContact.types.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedContact.types.map((type) => (
                          <ContactTypeBadge key={type.id} type={type} />
                        ))}
                      </div>
                    )}
                  </div>
                  {canEdit && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowDeleteDialog(true)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </SheetHeader>

              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="companies">
                    Companies ({selectedContact.companies.length})
                  </TabsTrigger>
                  <TabsTrigger value="methods">
                    Contact ({selectedContact.contact_methods.length})
                  </TabsTrigger>
                </TabsList>

                {/* Details Tab */}
                <TabsContent value="details" className="mt-4 space-y-4">
                  {selectedContact.notes && (
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm">Notes</CardTitle>
                      </CardHeader>
                      <CardContent className="py-2">
                        <p className="text-sm whitespace-pre-wrap">
                          {selectedContact.notes}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Custom Fields */}
                  {customFieldGroups.length > 0 && (
                    <CustomFieldsDisplay groups={customFieldGroups} />
                  )}

                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">Created</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      <p className="text-sm text-muted-foreground">
                        {new Date(selectedContact.created_at).toLocaleDateString()}
                        {selectedContact.created_by_user && (
                          <> by {selectedContact.created_by_user.full_name || selectedContact.created_by_user.email}</>
                        )}
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Companies Tab */}
                <TabsContent value="companies" className="mt-4 space-y-3">
                  {selectedContact.companies.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No company links yet
                    </p>
                  ) : (
                    selectedContact.companies.map((link) => (
                      <Card key={link.id}>
                        <CardContent className="py-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                  {link.company.name}
                                </span>
                              </div>
                              {link.role_title && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {link.role_title}
                                </p>
                              )}
                              {link.company.city && (
                                <p className="text-xs text-muted-foreground">
                                  {link.company.city}
                                  {link.company.state && `, ${link.company.state}`}
                                </p>
                              )}
                            </div>
                            {link.is_primary && (
                              <Badge variant="secondary" className="text-xs">
                                Primary
                              </Badge>
                            )}
                          </div>
                          {/* Work contact methods */}
                          {link.contact_methods.length > 0 && (
                            <div className="mt-2 pt-2 border-t space-y-1">
                              {link.contact_methods.map((method) => (
                                <div
                                  key={method.id}
                                  className="flex items-center gap-2 text-sm"
                                >
                                  {method.method_type === 'phone' ? (
                                    <Phone className="h-3 w-3 text-muted-foreground" />
                                  ) : method.method_type === 'email' ? (
                                    <Mail className="h-3 w-3 text-muted-foreground" />
                                  ) : (
                                    <LinkIcon className="h-3 w-3 text-muted-foreground" />
                                  )}
                                  <span className="text-muted-foreground">
                                    {method.label}:
                                  </span>
                                  <span>{method.value}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>

                {/* Contact Methods Tab */}
                <TabsContent value="methods" className="mt-4 space-y-4">
                  {selectedContact.contact_methods.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No contact methods added
                    </p>
                  ) : (
                    <>
                      {groupedMethods?.phone && groupedMethods.phone.length > 0 && (
                        <Card>
                          <CardHeader className="py-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              Phone
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="py-2 space-y-2">
                            {groupedMethods.phone.map((method) => (
                              <div
                                key={method.id}
                                className="flex items-center justify-between"
                              >
                                <div>
                                  <span className="text-sm text-muted-foreground">
                                    {method.label}:{' '}
                                  </span>
                                  <a
                                    href={`tel:${method.value}`}
                                    className="text-sm hover:underline"
                                  >
                                    {method.value}
                                  </a>
                                </div>
                                {method.is_primary && (
                                  <Badge variant="secondary" className="text-xs">
                                    Primary
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )}

                      {groupedMethods?.email && groupedMethods.email.length > 0 && (
                        <Card>
                          <CardHeader className="py-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              Email
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="py-2 space-y-2">
                            {groupedMethods.email.map((method) => (
                              <div
                                key={method.id}
                                className="flex items-center justify-between"
                              >
                                <div>
                                  <span className="text-sm text-muted-foreground">
                                    {method.label}:{' '}
                                  </span>
                                  <a
                                    href={`mailto:${method.value}`}
                                    className="text-sm hover:underline"
                                  >
                                    {method.value}
                                  </a>
                                </div>
                                {method.is_primary && (
                                  <Badge variant="secondary" className="text-xs">
                                    Primary
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )}

                      {groupedMethods?.fax && groupedMethods.fax.length > 0 && (
                        <Card>
                          <CardHeader className="py-3">
                            <CardTitle className="text-sm">Fax</CardTitle>
                          </CardHeader>
                          <CardContent className="py-2 space-y-2">
                            {groupedMethods.fax.map((method) => (
                              <div
                                key={method.id}
                                className="flex items-center justify-between"
                              >
                                <div>
                                  <span className="text-sm text-muted-foreground">
                                    {method.label}:{' '}
                                  </span>
                                  <span className="text-sm">{method.value}</span>
                                </div>
                                {method.is_primary && (
                                  <Badge variant="secondary" className="text-xs">
                                    Primary
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )}

                      {groupedMethods?.other && groupedMethods.other.length > 0 && (
                        <Card>
                          <CardHeader className="py-3">
                            <CardTitle className="text-sm">Other</CardTitle>
                          </CardHeader>
                          <CardContent className="py-2 space-y-2">
                            {groupedMethods.other.map((method) => (
                              <div
                                key={method.id}
                                className="flex items-center justify-between"
                              >
                                <div>
                                  <span className="text-sm text-muted-foreground">
                                    {method.label}:{' '}
                                  </span>
                                  <span className="text-sm">{method.value}</span>
                                </div>
                                {method.is_primary && (
                                  <Badge variant="secondary" className="text-xs">
                                    Primary
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )}
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Dialog */}
      {selectedContact && (
        <DeleteContactDialog
          contactId={selectedContact.id}
          contactName={displayName}
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onDeleted={handleDeleted}
        />
      )}
    </>
  )
}
