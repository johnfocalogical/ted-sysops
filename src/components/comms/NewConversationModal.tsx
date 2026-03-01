import { useState, useEffect } from 'react'
import { Loader2, Search } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { useCommsStore } from '@/hooks/useCommsStore'
import * as commsService from '@/lib/commsService'
import type { ConversationType } from '@/types/comms.types'
import { toast } from 'sonner'

interface NewConversationModalProps {
  open: boolean
  onClose: () => void
  teamId: string
}

interface TeamMember {
  id: string
  full_name: string | null
  avatar_url: string | null
}

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function NewConversationModal({
  open,
  onClose,
  teamId,
}: NewConversationModalProps) {
  const { createConversation, selectConversation } = useCommsStore()

  const [type, setType] = useState<ConversationType>('dm')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [initialMessage, setInitialMessage] = useState('')
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set())
  const [memberSearch, setMemberSearch] = useState('')
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Load team members when modal opens
  useEffect(() => {
    if (!open) return

    const load = async () => {
      setLoading(true)
      try {
        const members = await commsService.getTeamMembersForComms(teamId)
        setTeamMembers(members)
      } catch (err) {
        console.error('Failed to load team members:', err)
      } finally {
        setLoading(false)
      }
    }

    load()

    // Reset form
    setType('dm')
    setName('')
    setDescription('')
    setInitialMessage('')
    setSelectedMemberIds(new Set())
    setMemberSearch('')
  }, [open, teamId])

  const filteredMembers = teamMembers.filter((m) => {
    if (!memberSearch) return true
    return m.full_name?.toLowerCase().includes(memberSearch.toLowerCase())
  })

  const toggleMember = (memberId: string) => {
    const next = new Set(selectedMemberIds)
    if (type === 'dm') {
      // DMs only allow one participant
      next.clear()
      next.add(memberId)
    } else {
      if (next.has(memberId)) {
        next.delete(memberId)
      } else {
        next.add(memberId)
      }
    }
    setSelectedMemberIds(next)
  }

  const canSubmit =
    selectedMemberIds.size > 0 &&
    (type !== 'channel' || name.trim().length > 0)

  const handleSubmit = async () => {
    if (!canSubmit) return

    setSubmitting(true)
    try {
      const conversation = await createConversation({
        type,
        name: type === 'dm' ? undefined : name || undefined,
        description: type === 'channel' ? description || undefined : undefined,
        participant_ids: Array.from(selectedMemberIds),
        initial_message: initialMessage || undefined,
      })

      selectConversation(conversation.id)
      toast.success(
        type === 'dm'
          ? 'Direct message started'
          : type === 'group'
            ? 'Group created'
            : 'Channel created'
      )
      onClose()
    } catch (err) {
      console.error('Failed to create conversation:', err)
      toast.error('Failed to create conversation')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
          <DialogDescription>
            Start a direct message, group chat, or team channel.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Type selector */}
          <Tabs value={type} onValueChange={(v) => setType(v as ConversationType)}>
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="dm">DM</TabsTrigger>
              <TabsTrigger value="group">Group</TabsTrigger>
              <TabsTrigger value="channel">Channel</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Name (for groups and channels) */}
          {type !== 'dm' && (
            <div className="space-y-2">
              <Label htmlFor="conv-name">
                {type === 'channel' ? 'Channel Name' : 'Group Name'}
                {type === 'channel' && <span className="text-destructive ml-1">*</span>}
              </Label>
              <Input
                id="conv-name"
                placeholder={type === 'channel' ? 'e.g., general' : 'e.g., Deal Team Alpha'}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          {/* Description (channels only) */}
          {type === 'channel' && (
            <div className="space-y-2">
              <Label htmlFor="conv-desc">Description</Label>
              <Input
                id="conv-desc"
                placeholder="What's this channel about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          )}

          {/* Participant selector */}
          <div className="space-y-2">
            <Label>
              {type === 'dm' ? 'Select person' : 'Add participants'}
            </Label>

            {/* Selected participants */}
            {selectedMemberIds.size > 0 && (
              <div className="flex flex-wrap gap-1">
                {Array.from(selectedMemberIds).map((id) => {
                  const member = teamMembers.find((m) => m.id === id)
                  return (
                    <Badge
                      key={id}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => toggleMember(id)}
                    >
                      {member?.full_name ?? 'Unknown'}
                      <span className="ml-1 text-muted-foreground">&times;</span>
                    </Badge>
                  )
                })}
              </div>
            )}

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search team members..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            {/* Member list */}
            <ScrollArea className="h-48 border rounded-md">
              {loading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : filteredMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No team members found
                </p>
              ) : (
                <div className="p-1">
                  {filteredMembers.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => toggleMember(member.id)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        checked={selectedMemberIds.has(member.id)}
                        className="pointer-events-none"
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                          {getInitials(member.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">
                        {member.full_name ?? 'Unknown'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Initial message */}
          <div className="space-y-2">
            <Label htmlFor="initial-msg">First message (optional)</Label>
            <Textarea
              id="initial-msg"
              placeholder="Say something..."
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="bg-primary hover:bg-primary/90"
          >
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {type === 'dm'
              ? 'Start DM'
              : type === 'group'
                ? 'Create Group'
                : 'Create Channel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
