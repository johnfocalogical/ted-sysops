import { useState, useEffect } from 'react'
import { Tag, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useTeamContext } from '@/hooks/useTeamContext'
import {
  getTeamContactTypes,
  getTeamCompanyTypes,
} from '@/lib/teamTypeService'
import type {
  TeamContactTypeWithUsage,
  TeamCompanyTypeWithUsage,
} from '@/types/type-system.types'
import { TypeList } from './TypeList'
import { TypeFormModal } from './TypeFormModal'
import { TypeCreationWizard } from './TypeCreationWizard'

type TabValue = 'contact' | 'company'

export function TypeSettingsSection() {
  const { context, isAdmin } = useTeamContext()
  const [activeTab, setActiveTab] = useState<TabValue>('contact')
  const [contactTypes, setContactTypes] = useState<TeamContactTypeWithUsage[]>([])
  const [companyTypes, setCompanyTypes] = useState<TeamCompanyTypeWithUsage[]>([])
  const [loading, setLoading] = useState(true)
  const [showWizard, setShowWizard] = useState(false)
  const [editingType, setEditingType] = useState<
    TeamContactTypeWithUsage | TeamCompanyTypeWithUsage | null
  >(null)
  const [editingEntityType, setEditingEntityType] = useState<'contact' | 'company'>('contact')

  const loadTypes = async () => {
    if (!context) return

    setLoading(true)
    try {
      const [contactData, companyData] = await Promise.all([
        getTeamContactTypes(context.team.id),
        getTeamCompanyTypes(context.team.id),
      ])
      setContactTypes(contactData)
      setCompanyTypes(companyData)
    } catch (err) {
      console.error('Error loading types:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTypes()
  }, [context?.team.id])

  const handleTypeSaved = () => {
    setShowWizard(false)
    setEditingType(null)
    loadTypes()
  }

  const handleEditType = (
    type: TeamContactTypeWithUsage | TeamCompanyTypeWithUsage,
    entityType: 'contact' | 'company'
  ) => {
    setEditingType(type)
    setEditingEntityType(entityType)
  }

  if (!context) return null

  // Only admins can manage types
  if (!isAdmin()) {
    return null
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Tag className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Contact & Company Types</CardTitle>
              <CardDescription>
                Manage type categories for contacts and companies
              </CardDescription>
            </div>
          </div>
          <Button
            onClick={() => setShowWizard(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Type
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
              <TabsList className="mb-4">
                <TabsTrigger value="contact" className="gap-2">
                  Contact Types
                  <Badge variant="secondary" className="ml-1">
                    {contactTypes.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="company" className="gap-2">
                  Company Types
                  <Badge variant="secondary" className="ml-1">
                    {companyTypes.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="contact" className="mt-0">
                <TypeList
                  types={contactTypes}
                  entityType="contact"
                  onEdit={(type) => handleEditType(type, 'contact')}
                  onRefresh={loadTypes}
                />
              </TabsContent>

              <TabsContent value="company" className="mt-0">
                <TypeList
                  types={companyTypes}
                  entityType="company"
                  onEdit={(type) => handleEditType(type, 'company')}
                  onRefresh={loadTypes}
                />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Type Creation Wizard */}
      <TypeCreationWizard
        open={showWizard}
        onClose={() => setShowWizard(false)}
        onCreated={handleTypeSaved}
        initialEntityType={activeTab}
      />

      {/* Edit Modal */}
      <TypeFormModal
        open={!!editingType}
        type={editingType}
        entityType={editingEntityType}
        onClose={() => setEditingType(null)}
        onSaved={handleTypeSaved}
      />
    </>
  )
}
