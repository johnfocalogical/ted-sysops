import { useState, useEffect } from 'react'
import {
  Building2,
  Edit2,
  ExternalLink,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Trash2,
  User,
  Star,
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
import { CompanyTypeBadge } from './CompanyTypeBadge'
import { CompanyForm } from './CompanyForm'
import { DeleteCompanyDialog } from './DeleteCompanyDialog'
import { CustomFieldsDisplay } from '@/components/custom-fields'
import { useCompanyStore } from '@/hooks/useCompanyStore'
import { updateCompany } from '@/lib/companyService'
import { saveContactMethodsForCompany } from '@/lib/contactMethodHelpers'
import { getCompanyCustomFieldsGroupedByType } from '@/lib/customFieldValueService'
import { toast } from 'sonner'
import type { ContactMethod } from '@/types/contact.types'
import type { CustomFieldsGroupedByType } from '@/types/custom-fields.types'

interface CompanyDetailDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  canEdit?: boolean
}

export function CompanyDetailDrawer({
  open,
  onOpenChange,
  canEdit = true,
}: CompanyDetailDrawerProps) {
  const {
    selectedCompany,
    loadingSelected,
    companyTypes,
    refreshSelected,
    refreshList,
    selectCompany,
  } = useCompanyStore()

  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [customFieldGroups, setCustomFieldGroups] = useState<CustomFieldsGroupedByType[]>([])

  // Load custom field values when company changes
  useEffect(() => {
    const loadCustomFields = async () => {
      if (!selectedCompany?.id || selectedCompany.types.length === 0) {
        setCustomFieldGroups([])
        return
      }

      try {
        const groups = await getCompanyCustomFieldsGroupedByType(
          selectedCompany.id,
          selectedCompany.types.map((t) => ({
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
  }, [selectedCompany?.id, selectedCompany?.types])

  const handleClose = () => {
    setIsEditing(false)
    onOpenChange(false)
    selectCompany(null)
  }

  const handleSubmit = async (
    data: {
      name: string
      address?: string
      city?: string
      state?: string
      zip?: string
      website?: string
      notes?: string
      type_ids?: string[]
      contact_methods?: { method_type: 'phone' | 'email' | 'fax' | 'other'; label: string; value: string; is_primary: boolean }[]
    },
    saveCustomFields: (entityId: string) => Promise<void>
  ) => {
    if (!selectedCompany) return

    setIsSubmitting(true)
    try {
      await updateCompany(selectedCompany.id, {
        name: data.name,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        zip: data.zip || null,
        website: data.website || null,
        notes: data.notes || null,
        type_ids: data.type_ids,
      })

      // Update contact methods separately
      if (data.contact_methods) {
        await saveContactMethodsForCompany(selectedCompany.id, data.contact_methods)
      }

      // Save custom field values
      await saveCustomFields(selectedCompany.id)

      toast.success('Company updated successfully')
      await refreshSelected()
      await refreshList()
      setIsEditing(false)
    } catch (err) {
      console.error('Error updating company:', err)
      toast.error('Failed to update company')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleted = () => {
    refreshList()
    handleClose()
  }

  // Group contact methods by type
  const groupedMethods = selectedCompany?.contact_methods.reduce(
    (acc, method) => {
      if (!acc[method.method_type]) {
        acc[method.method_type] = []
      }
      acc[method.method_type].push(method)
      return acc
    },
    {} as Record<string, ContactMethod[]>
  )

  // Format address
  const formatAddress = () => {
    if (!selectedCompany) return null
    const parts = [
      selectedCompany.address,
      selectedCompany.city,
      selectedCompany.state,
      selectedCompany.zip,
    ].filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : null
  }

  return (
    <>
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {loadingSelected ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !selectedCompany ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Company not found</p>
            </div>
          ) : isEditing ? (
            // Edit Mode
            <div>
              <SheetHeader className="mb-6">
                <SheetTitle>Edit Company</SheetTitle>
                <SheetDescription>
                  Update company information
                </SheetDescription>
              </SheetHeader>
              <CompanyForm
                company={selectedCompany}
                companyTypes={companyTypes}
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
                      <Building2 className="h-5 w-5" />
                      {selectedCompany.name}
                    </SheetTitle>
                    {selectedCompany.types.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedCompany.types.map((type) => (
                          <CompanyTypeBadge key={type.id} type={type} />
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

              {/* POC Banner */}
              {selectedCompany.poc_contact && (
                <Card className="mb-4 border-primary/20 bg-primary/5">
                  <CardContent className="py-3">
                    <div className="flex items-center gap-3">
                      <Star className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Point of Contact</p>
                        <p className="font-medium">
                          {selectedCompany.poc_contact.first_name}
                          {selectedCompany.poc_contact.last_name &&
                            ` ${selectedCompany.poc_contact.last_name}`}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="contacts">
                    Contacts ({selectedCompany.contacts.length})
                  </TabsTrigger>
                  <TabsTrigger value="methods">
                    Contact ({selectedCompany.contact_methods.length})
                  </TabsTrigger>
                </TabsList>

                {/* Details Tab */}
                <TabsContent value="details" className="mt-4 space-y-4">
                  {formatAddress() && (
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Address
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="py-2">
                        <p className="text-sm">{formatAddress()}</p>
                      </CardContent>
                    </Card>
                  )}

                  {selectedCompany.website && (
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <ExternalLink className="h-4 w-4" />
                          Website
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="py-2">
                        <a
                          href={selectedCompany.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          {selectedCompany.website}
                        </a>
                      </CardContent>
                    </Card>
                  )}

                  {selectedCompany.notes && (
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm">Notes</CardTitle>
                      </CardHeader>
                      <CardContent className="py-2">
                        <p className="text-sm whitespace-pre-wrap">
                          {selectedCompany.notes}
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
                        {new Date(selectedCompany.created_at).toLocaleDateString()}
                        {selectedCompany.created_by_user && (
                          <> by {selectedCompany.created_by_user.full_name || selectedCompany.created_by_user.email}</>
                        )}
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Contacts Tab */}
                <TabsContent value="contacts" className="mt-4 space-y-3">
                  {selectedCompany.contacts.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No contacts linked yet
                    </p>
                  ) : (
                    selectedCompany.contacts.map((link) => (
                      <Card key={link.id}>
                        <CardContent className="py-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                  {link.contact.first_name}
                                  {link.contact.last_name &&
                                    ` ${link.contact.last_name}`}
                                </span>
                                {selectedCompany.poc_contact_id === link.contact_id && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Star className="h-3 w-3 mr-1" />
                                    POC
                                  </Badge>
                                )}
                              </div>
                              {link.role_title && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {link.role_title}
                                </p>
                              )}
                            </div>
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
                                  ) : (
                                    <Mail className="h-3 w-3 text-muted-foreground" />
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
                  {selectedCompany.contact_methods.length === 0 ? (
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
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Dialog */}
      {selectedCompany && (
        <DeleteCompanyDialog
          companyId={selectedCompany.id}
          companyName={selectedCompany.name}
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onDeleted={handleDeleted}
        />
      )}
    </>
  )
}
