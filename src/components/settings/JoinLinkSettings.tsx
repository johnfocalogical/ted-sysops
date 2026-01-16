import { useState, useEffect } from 'react'
import { Link2, Copy, RefreshCw, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { useTeamContext } from '@/hooks/useTeamContext'

interface TeamRole {
  id: string
  name: string
}

interface JoinLinkSettingsProps {
  refreshTrigger?: number
}

export function JoinLinkSettings({ refreshTrigger }: JoinLinkSettingsProps) {
  const { context } = useTeamContext()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  // Join link state
  const [enabled, setEnabled] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [defaultRoleId, setDefaultRoleId] = useState<string | null>(null)
  const [roles, setRoles] = useState<TeamRole[]>([])

  const joinUrl = `${window.location.origin}/join/${joinCode}`

  // Load join link settings
  useEffect(() => {
    const loadSettings = async () => {
      if (!supabase || !context) return

      setLoading(true)
      try {
        // Load team settings
        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .select('join_code, join_link_enabled, default_role_id')
          .eq('id', context.team.id)
          .single()

        if (teamError) {
          console.error('Error loading team settings:', teamError)
          return
        }

        setEnabled(teamData.join_link_enabled || false)
        setJoinCode(teamData.join_code || '')
        setDefaultRoleId(teamData.default_role_id)

        // Load roles for dropdown
        const { data: rolesData } = await supabase
          .from('team_roles')
          .select('id, name')
          .eq('team_id', context.team.id)
          .order('name')

        if (rolesData) {
          setRoles(rolesData)
        }
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [context?.team.id, refreshTrigger])

  const handleToggleEnabled = async (newEnabled: boolean) => {
    if (!supabase || !context) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('teams')
        .update({ join_link_enabled: newEnabled })
        .eq('id', context.team.id)

      if (error) {
        console.error('Error updating join link:', error)
        return
      }

      setEnabled(newEnabled)
    } finally {
      setSaving(false)
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleRegenerateCode = async () => {
    if (!supabase || !context) return

    setRegenerating(true)
    try {
      // Generate new code (16 char hex)
      const newCode = crypto.randomUUID().replace(/-/g, '').substring(0, 16)

      const { error } = await supabase
        .from('teams')
        .update({ join_code: newCode })
        .eq('id', context.team.id)

      if (error) {
        console.error('Error regenerating code:', error)
        return
      }

      setJoinCode(newCode)
    } finally {
      setRegenerating(false)
    }
  }

  const handleDefaultRoleChange = async (roleId: string) => {
    if (!supabase || !context) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('teams')
        .update({ default_role_id: roleId || null })
        .eq('id', context.team.id)

      if (error) {
        console.error('Error updating default role:', error)
        return
      }

      setDefaultRoleId(roleId || null)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center">
              <Link2 className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <CardTitle>Join Link</CardTitle>
              <CardDescription>
                Loading settings...
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center">
            <Link2 className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <CardTitle>Join Link</CardTitle>
            <CardDescription>
              Allow people to join your team with a shareable link
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="join-link-toggle" className="text-base">
              Enable Join Link
            </Label>
            <p className="text-sm text-muted-foreground">
              Anyone with the link can join this team
            </p>
          </div>
          <Switch
            id="join-link-toggle"
            checked={enabled}
            onCheckedChange={handleToggleEnabled}
            disabled={saving}
          />
        </div>

        {/* Join URL Display (only when enabled) */}
        {enabled && (
          <>
            <div className="space-y-2">
              <Label>Join URL</Label>
              <div className="flex gap-2">
                <div className="flex-1 bg-muted rounded-md px-3 py-2 text-sm font-mono truncate">
                  {joinUrl}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                  title="Copy link"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRegenerateCode}
                  disabled={regenerating}
                  title="Generate new link"
                >
                  {regenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Regenerating the link will invalidate the previous one
              </p>
            </div>

            {/* Default Role Selector */}
            <div className="space-y-2">
              <Label htmlFor="default-role">Default Role</Label>
              <Select
                value={defaultRoleId || ''}
                onValueChange={handleDefaultRoleChange}
                disabled={saving}
              >
                <SelectTrigger id="default-role">
                  <SelectValue placeholder="No specific role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No specific role</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Users who join via link will be assigned this role
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
