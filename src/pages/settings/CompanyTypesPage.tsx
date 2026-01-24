import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Loader2, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ViewOnlyBanner } from '@/components/shared/ViewOnlyBanner'
import { TypeList } from '@/components/settings/TypeList'
import { TypeFormModal } from '@/components/settings/TypeFormModal'
import { TypeCreationWizard } from '@/components/settings/TypeCreationWizard'
import { CustomFieldDefinitionManager } from '@/components/settings/CustomFieldDefinitionManager'
import { usePermissions } from '@/hooks/usePermissions'
import { useTeamContext } from '@/hooks/useTeamContext'
import { getTeamCompanyTypes } from '@/lib/teamTypeService'
import type { TeamCompanyTypeWithUsage } from '@/types/type-system.types'

export function CompanyTypesPage() {
  const { orgId, teamId } = useParams<{ orgId: string; teamId: string }>()
  const { isViewOnly } = usePermissions('settings')
  const { context, isAdmin } = useTeamContext()
  const settingsPath = `/org/${orgId}/team/${teamId}/settings`

  const [types, setTypes] = useState<TeamCompanyTypeWithUsage[]>([])
  const [loading, setLoading] = useState(true)
  const [showWizard, setShowWizard] = useState(false)
  const [editingType, setEditingType] = useState<TeamCompanyTypeWithUsage | null>(null)
  const [manageFieldsType, setManageFieldsType] = useState<TeamCompanyTypeWithUsage | null>(null)

  const loadTypes = async () => {
    if (!context) return

    setLoading(true)
    try {
      const data = await getTeamCompanyTypes(context.team.id)
      setTypes(data)
    } catch (err) {
      console.error('Error loading company types:', err)
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

  if (!context) return null

  return (
    <div className="max-w-4xl">
      {/* Back Link */}
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to={settingsPath}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Settings
        </Link>
      </Button>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Company Types</h1>
        <p className="text-muted-foreground mt-1">
          Manage company type categories and their custom fields
        </p>
      </div>

      {/* View Only Banner */}
      {isViewOnly && <ViewOnlyBanner className="mb-6" />}

      {/* Content */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Company Types</CardTitle>
              <CardDescription>
                {types.length} type{types.length !== 1 ? 's' : ''} configured
              </CardDescription>
            </div>
          </div>
          {isAdmin() && (
            <Button
              onClick={() => setShowWizard(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Type
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <TypeList
              types={types}
              entityType="company"
              onEdit={(type) => setEditingType(type as TeamCompanyTypeWithUsage)}
              onManageFields={(type) => setManageFieldsType(type as TeamCompanyTypeWithUsage)}
              onRefresh={loadTypes}
            />
          )}
        </CardContent>
      </Card>

      {/* Type Creation Wizard */}
      <TypeCreationWizard
        open={showWizard}
        onClose={() => setShowWizard(false)}
        onCreated={handleTypeSaved}
        initialEntityType="company"
      />

      {/* Edit Modal */}
      <TypeFormModal
        open={!!editingType}
        type={editingType}
        entityType="company"
        onClose={() => setEditingType(null)}
        onSaved={handleTypeSaved}
      />

      {/* Custom Field Definition Manager */}
      <CustomFieldDefinitionManager
        open={!!manageFieldsType}
        onOpenChange={(open) => !open && setManageFieldsType(null)}
        type={manageFieldsType}
        entityType="company"
      />
    </div>
  )
}
