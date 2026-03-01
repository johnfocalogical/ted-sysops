import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Hash, MessageSquare, Users, Loader2, Link2 } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ValueSourcePicker } from './ValueSourcePicker'
import * as commsService from '@/lib/commsService'
import type {
  SendMessageActionParams,
  SendMessageTarget,
  DataCollectionField,
} from '@/types/automator.types'

interface SendMessageActionProps {
  params: SendMessageActionParams
  onChange: (params: SendMessageActionParams) => void
  availableFields?: DataCollectionField[]
}

const TARGET_OPTIONS: { value: SendMessageTarget; label: string; icon: typeof MessageSquare; description: string }[] = [
  { value: 'deal_chat', label: 'Deal Chat', icon: MessageSquare, description: 'Send to the deal\'s linked conversation' },
  { value: 'channel', label: 'Team Channel', icon: Hash, description: 'Send to a team channel' },
  { value: 'new_group', label: 'New Group', icon: Users, description: 'Create a new group conversation' },
]

export function SendMessageAction({ params, onChange, availableFields }: SendMessageActionProps) {
  const { teamId } = useParams<{ teamId: string }>()
  const [channels, setChannels] = useState<{ id: string; name: string | null }[]>([])
  const [loadingChannels, setLoadingChannels] = useState(false)
  const [teamMembers, setTeamMembers] = useState<{ id: string; full_name: string | null }[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)

  // Load channels when target is 'channel'
  useEffect(() => {
    if (params.target !== 'channel' || !teamId) return
    setLoadingChannels(true)
    commsService.getTeamChannels(teamId)
      .then((ch) => setChannels(ch.map((c) => ({ id: c.id, name: c.name }))))
      .catch((err) => console.error('Failed to load channels:', err))
      .finally(() => setLoadingChannels(false))
  }, [params.target, teamId])

  // Load team members when target is 'new_group'
  useEffect(() => {
    if (params.target !== 'new_group' || !teamId) return
    setLoadingMembers(true)
    commsService.getTeamMembersForComms(teamId)
      .then(setTeamMembers)
      .catch((err) => console.error('Failed to load team members:', err))
      .finally(() => setLoadingMembers(false))
  }, [params.target, teamId])

  const handleTargetChange = (target: SendMessageTarget) => {
    onChange({
      ...params,
      target,
      channel_id: undefined,
      participant_ids: undefined,
      include_deal_employees: false,
      include_deal_owner: false,
    })
  }

  const toggleParticipant = (userId: string) => {
    const current = params.participant_ids ?? []
    const updated = current.includes(userId)
      ? current.filter((id) => id !== userId)
      : [...current, userId]
    onChange({ ...params, participant_ids: updated })
  }

  return (
    <div className="space-y-3">
      {/* Target selector */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Send To</Label>
        <Select value={params.target} onValueChange={(v) => handleTargetChange(v as SendMessageTarget)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TARGET_OPTIONS.map((opt) => {
              const Icon = opt.icon
              return (
                <SelectItem key={opt.value} value={opt.value}>
                  <span className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                    {opt.label}
                  </span>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
        <p className="text-[10px] text-muted-foreground">
          {TARGET_OPTIONS.find((o) => o.value === params.target)?.description}
        </p>
      </div>

      {/* Channel selector (for 'channel' target) */}
      {params.target === 'channel' && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <Hash className="h-3 w-3" />
            Channel
          </Label>
          {loadingChannels ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading channels...
            </div>
          ) : channels.length === 0 ? (
            <p className="text-xs text-muted-foreground">No channels available.</p>
          ) : (
            <Select
              value={params.channel_id ?? ''}
              onValueChange={(channelId) => onChange({ ...params, channel_id: channelId })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select channel..." />
              </SelectTrigger>
              <SelectContent>
                {channels.map((ch) => (
                  <SelectItem key={ch.id} value={ch.id}>
                    # {ch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* Participant options (for 'new_group' target) */}
      {params.target === 'new_group' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="include-deal-employees"
              checked={params.include_deal_employees ?? false}
              onCheckedChange={(checked) =>
                onChange({ ...params, include_deal_employees: !!checked })
              }
            />
            <label htmlFor="include-deal-employees" className="text-xs cursor-pointer">
              Include deal assigned employees
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="include-deal-owner"
              checked={params.include_deal_owner ?? false}
              onCheckedChange={(checked) =>
                onChange({ ...params, include_deal_owner: !!checked })
              }
            />
            <label htmlFor="include-deal-owner" className="text-xs cursor-pointer">
              Include deal owner
            </label>
          </div>

          {/* Manual participant picker */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Additional Participants</Label>
            {loadingMembers ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading members...
              </div>
            ) : (
              <div className="max-h-[120px] overflow-y-auto space-y-1 border rounded-md p-2">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`member-${member.id}`}
                      checked={(params.participant_ids ?? []).includes(member.id)}
                      onCheckedChange={() => toggleParticipant(member.id)}
                    />
                    <label htmlFor={`member-${member.id}`} className="text-xs cursor-pointer">
                      {member.full_name ?? 'Unknown'}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Message content */}
      <ValueSourcePicker
        label="Message Content"
        value={params.message_content}
        onChange={(message_content) => onChange({ ...params, message_content })}
        availableFields={availableFields}
      />

      {/* Include deal link */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="include-deal-link"
          checked={params.include_deal_link}
          onCheckedChange={(checked) =>
            onChange({ ...params, include_deal_link: !!checked })
          }
        />
        <label htmlFor="include-deal-link" className="text-xs cursor-pointer flex items-center gap-1">
          <Link2 className="h-3 w-3" />
          Include deal reference card
        </label>
      </div>
    </div>
  )
}
