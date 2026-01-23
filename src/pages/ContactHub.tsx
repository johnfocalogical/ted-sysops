import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Building2, Plus, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PageHeader } from '@/components/shared/PageHeader'
import { useTeamContext } from '@/hooks/useTeamContext'
import { useContactStore } from '@/hooks/useContactStore'
import { useCompanyStore } from '@/hooks/useCompanyStore'
import {
  ContactList,
  ContactDetailDrawer,
  CreateContactModal,
} from '@/components/contacts'
import {
  CompanyList,
  CompanyDetailDrawer,
  CreateCompanyModal,
} from '@/components/companies'

type ViewTab = 'contacts' | 'companies'

export function ContactHub() {
  const { teamId } = useParams<{ orgId: string; teamId: string }>()
  const { hasFullAccess } = useTeamContext()

  // Determine if user has full access (can edit)
  const canEdit = hasFullAccess('contacts')

  // Active tab state
  const [activeTab, setActiveTab] = useState<ViewTab>('contacts')

  // Modal states
  const [showCreateContact, setShowCreateContact] = useState(false)
  const [showCreateCompany, setShowCreateCompany] = useState(false)

  // Drawer states
  const [showContactDrawer, setShowContactDrawer] = useState(false)
  const [showCompanyDrawer, setShowCompanyDrawer] = useState(false)

  // Store hooks
  const contactStore = useContactStore()
  const companyStore = useCompanyStore()

  // Initialize stores with team ID
  useEffect(() => {
    if (teamId) {
      contactStore.setTeamId(teamId)
      companyStore.setTeamId(teamId)
    }
  }, [teamId])

  // Load data when team changes
  useEffect(() => {
    if (teamId) {
      contactStore.loadContacts()
      contactStore.loadContactTypes()
      companyStore.loadCompanies()
      companyStore.loadCompanyTypes()
    }
  }, [teamId])

  // Handle contact row click
  const handleContactClick = async (contactId: string) => {
    await contactStore.selectContact(contactId)
    setShowContactDrawer(true)
  }

  // Handle company row click
  const handleCompanyClick = async (companyId: string) => {
    await companyStore.selectCompany(companyId)
    setShowCompanyDrawer(true)
  }

  // Handle add button click
  const handleAddClick = () => {
    if (activeTab === 'contacts') {
      setShowCreateContact(true)
    } else {
      setShowCreateCompany(true)
    }
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
        title="Contact Hub"
        subtitle="Manage contacts and companies"
        actions={
          canEdit && (
            <Button onClick={handleAddClick}>
              <Plus className="h-4 w-4 mr-2" />
              {activeTab === 'contacts' ? 'Add Contact' : 'Add Company'}
            </Button>
          )
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

      {/* View Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as ViewTab)}
        className="w-full"
      >
        <TabsList className="mb-4">
          <TabsTrigger value="contacts" className="gap-2">
            <User className="h-4 w-4" />
            Contacts
            {contactStore.total > 0 && (
              <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                {contactStore.total}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="companies" className="gap-2">
            <Building2 className="h-4 w-4" />
            Companies
            {companyStore.total > 0 && (
              <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                {companyStore.total}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="mt-0">
          <ContactList onContactClick={handleContactClick} />
        </TabsContent>

        <TabsContent value="companies" className="mt-0">
          <CompanyList onCompanyClick={handleCompanyClick} />
        </TabsContent>
      </Tabs>

      {/* Contact Drawer */}
      <ContactDetailDrawer
        open={showContactDrawer}
        onOpenChange={setShowContactDrawer}
        canEdit={canEdit}
      />

      {/* Company Drawer */}
      <CompanyDetailDrawer
        open={showCompanyDrawer}
        onOpenChange={setShowCompanyDrawer}
        canEdit={canEdit}
      />

      {/* Create Modals */}
      <CreateContactModal
        open={showCreateContact}
        onOpenChange={setShowCreateContact}
        teamId={teamId}
      />

      <CreateCompanyModal
        open={showCreateCompany}
        onOpenChange={setShowCreateCompany}
        teamId={teamId}
      />
    </div>
  )
}
