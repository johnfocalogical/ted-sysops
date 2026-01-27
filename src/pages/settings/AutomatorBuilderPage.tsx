import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AutomatorCanvas } from '@/components/automators/builder/AutomatorCanvas'
import { AutomatorToolbar } from '@/components/automators/builder/AutomatorToolbar'
import { NodePalette } from '@/components/automators/builder/NodePalette'
import { ConfigurationPanel } from '@/components/automators/builder/ConfigurationPanel'
import { useAutomatorBuilderStore } from '@/stores/automatorBuilderStore'
import { getAutomator } from '@/lib/automatorService'
import { toast } from 'sonner'

export function AutomatorBuilderPage() {
  const { orgId, teamId, automatorId } = useParams<{
    orgId: string
    teamId: string
    automatorId: string
  }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [showConfigPanel, setShowConfigPanel] = useState(false)

  const { setAutomator, reset, selectedNodeId } = useAutomatorBuilderStore()

  // Load automator on mount
  useEffect(() => {
    const loadAutomator = async () => {
      if (!automatorId) return

      setLoading(true)
      try {
        const data = await getAutomator(automatorId)
        if (!data) {
          toast.error('Automator not found')
          navigate(`/org/${orgId}/team/${teamId}/settings/automators`)
          return
        }
        setAutomator(data)
      } catch (err) {
        console.error('Error loading automator:', err)
        toast.error('Failed to load automator')
        navigate(`/org/${orgId}/team/${teamId}/settings/automators`)
      } finally {
        setLoading(false)
      }
    }

    loadAutomator()

    // Cleanup on unmount
    return () => {
      reset()
    }
  }, [automatorId, orgId, teamId, navigate, setAutomator, reset])

  // Show config panel when a node is selected
  useEffect(() => {
    if (selectedNodeId) {
      setShowConfigPanel(true)
    }
  }, [selectedNodeId])

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Toolbar */}
      <AutomatorToolbar />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - Node Palette */}
        <div className="w-64 border-r bg-card overflow-y-auto">
          <NodePalette />
        </div>

        {/* Canvas */}
        <div className="flex-1">
          <AutomatorCanvas
            onNodeSelect={(nodeId) => {
              if (nodeId) {
                setShowConfigPanel(true)
              }
            }}
          />
        </div>

        {/* Right sidebar - Configuration Panel */}
        {showConfigPanel && (
          <ConfigurationPanel onClose={() => setShowConfigPanel(false)} />
        )}
      </div>
    </div>
  )
}
