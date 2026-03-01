import { useState, useEffect } from 'react'
import {
  ArrowRightLeft,
  Zap,
  UserPlus,
  Users,
  DollarSign,
  CheckSquare,
  Loader2,
  Save,
  RotateCcw,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { useTeamContext } from '@/hooks/useTeamContext'
import {
  getCommsSettings,
  updateCommsSettings,
  DEFAULT_COMMS_SETTINGS,
} from '@/lib/commsEventBroadcaster'
import type { CommsSettings, DealEventType } from '@/lib/commsEventBroadcaster'

interface EventToggle {
  key: DealEventType
  label: string
  description: string
  icon: typeof ArrowRightLeft
  preview: string
}

const EVENT_TOGGLES: EventToggle[] = [
  {
    key: 'status_change',
    label: 'Status Changes',
    description: 'When a deal\'s pipeline status changes',
    icon: ArrowRightLeft,
    preview: 'Deal status changed to For Sale by Sarah Chen.',
  },
  {
    key: 'automator_milestone',
    label: 'Automator Milestones',
    description: 'When an automator completes on a deal',
    icon: Zap,
    preview: 'Automator "Title Process" completed.',
  },
  {
    key: 'employee_change',
    label: 'Employee Changes',
    description: 'When employees are assigned or removed from a deal',
    icon: UserPlus,
    preview: 'Mike Johnson was assigned as Transaction Coordinator.',
  },
  {
    key: 'vendor_change',
    label: 'Vendor Changes',
    description: 'When vendors are added or removed from a deal',
    icon: Users,
    preview: 'Vendor ABC Title Co. was added as Title Company.',
  },
  {
    key: 'financial_event',
    label: 'Financial Events',
    description: 'When expenses are added above the configured threshold',
    icon: DollarSign,
    preview: 'New expense added: Inspection — $450.',
  },
  {
    key: 'checklist_completion',
    label: 'Checklist Completions',
    description: 'When checklist items are completed on a deal',
    icon: CheckSquare,
    preview: 'Checklist item completed: "Title Ordered" ✓',
  },
]

export function CommsAutomationSettings() {
  const { context } = useTeamContext()
  const teamId = context?.team.id

  const [settings, setSettings] = useState<CommsSettings>(DEFAULT_COMMS_SETTINGS)
  const [originalSettings, setOriginalSettings] = useState<CommsSettings>(DEFAULT_COMMS_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const isDirty = JSON.stringify(settings) !== JSON.stringify(originalSettings)

  useEffect(() => {
    if (!teamId) return
    setLoading(true)
    getCommsSettings(teamId)
      .then((s) => {
        setSettings(s)
        setOriginalSettings(s)
      })
      .catch((err) => {
        console.error('Failed to load comms settings:', err)
        toast.error('Failed to load settings')
      })
      .finally(() => setLoading(false))
  }, [teamId])

  const handleSave = async () => {
    if (!teamId) return
    setSaving(true)
    try {
      await updateCommsSettings(teamId, settings)
      setOriginalSettings(settings)
      toast.success('Settings saved')
    } catch (err) {
      console.error('Failed to save comms settings:', err)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setSettings(originalSettings)
  }

  const toggleEvent = (key: DealEventType, enabled: boolean) => {
    setSettings((prev) => ({
      ...prev,
      events: { ...prev.events, [key]: enabled },
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Master toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Deal Event Broadcasting</CardTitle>
              <CardDescription>
                Automatically post system messages to deal-linked conversations when events occur.
              </CardDescription>
            </div>
            <Switch
              checked={settings.broadcast_enabled}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, broadcast_enabled: checked }))
              }
            />
          </div>
        </CardHeader>
      </Card>

      {/* Event toggles */}
      <Card className={!settings.broadcast_enabled ? 'opacity-50 pointer-events-none' : ''}>
        <CardHeader>
          <CardTitle className="text-base">Event Types</CardTitle>
          <CardDescription>
            Choose which deal events are broadcast to linked conversations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {EVENT_TOGGLES.map((evt, i) => {
            const Icon = evt.icon
            return (
              <div key={evt.key}>
                {i > 0 && <Separator className="my-3" />}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-sm font-medium">{evt.label}</Label>
                      <Switch
                        checked={settings.events[evt.key]}
                        onCheckedChange={(checked) => toggleEvent(evt.key, checked)}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{evt.description}</p>
                    <div className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded-full px-3 py-1 inline-block">
                      {evt.preview}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Thresholds */}
      <Card className={!settings.broadcast_enabled ? 'opacity-50 pointer-events-none' : ''}>
        <CardHeader>
          <CardTitle className="text-base">Thresholds</CardTitle>
          <CardDescription>
            Configure minimum values for financial event broadcasting.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm">Minimum Expense Amount ($)</Label>
            <Input
              type="number"
              min={0}
              value={settings.thresholds.min_expense_amount}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  thresholds: {
                    ...prev.thresholds,
                    min_expense_amount: Number(e.target.value) || 0,
                  },
                }))
              }
              className="max-w-[200px]"
            />
            <p className="text-xs text-muted-foreground">
              Only broadcast expenses at or above this amount.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Minimum Profit Change (%)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={settings.thresholds.min_profit_change_pct}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  thresholds: {
                    ...prev.thresholds,
                    min_profit_change_pct: Number(e.target.value) || 0,
                  },
                }))
              }
              className="max-w-[200px]"
            />
            <p className="text-xs text-muted-foreground">
              Only broadcast profit changes above this percentage.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save / Reset buttons */}
      {isDirty && (
        <div className="flex items-center gap-2 sticky bottom-0 bg-background py-3 border-t">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary hover:bg-primary/90"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
          <Button variant="outline" onClick={handleReset} disabled={saving}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      )}
    </div>
  )
}
