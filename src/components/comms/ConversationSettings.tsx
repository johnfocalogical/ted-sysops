import { useState, useEffect } from 'react'
import { Settings, Bell, BellOff, LogOut, Pencil, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import * as commsService from '@/lib/commsService'
import { useCommsStore } from '@/hooks/useCommsStore'
import { toast } from 'sonner'
import type { ConversationPreview } from '@/types/comms.types'

interface ConversationSettingsProps {
  conversation: ConversationPreview
  userId: string
}

export function ConversationSettings({
  conversation,
  userId,
}: ConversationSettingsProps) {
  const { selectConversation, loadConversations } = useCommsStore()

  const [isMuted, setIsMuted] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)

  // Load mute state
  useEffect(() => {
    if (!open) return
    commsService.getParticipantInfo(conversation.id, userId).then((info) => {
      if (info) setIsMuted(info.is_muted)
    })
  }, [conversation.id, userId, open])

  const handleToggleMute = async () => {
    setToggling(true)
    try {
      await commsService.toggleMuteConversation(conversation.id, userId, !isMuted)
      setIsMuted(!isMuted)
      toast.success(isMuted ? 'Notifications unmuted' : 'Conversation muted')
    } catch (err) {
      console.error('Failed to toggle mute:', err)
      toast.error('Failed to update mute setting')
    } finally {
      setToggling(false)
    }
  }

  const handleLeave = async () => {
    try {
      await commsService.leaveConversation(conversation.id, userId)
      selectConversation(null)
      loadConversations()
      toast.success('Left conversation')
      setOpen(false)
    } catch (err) {
      console.error('Failed to leave conversation:', err)
      toast.error('Failed to leave conversation')
    }
  }

  const handleRename = async () => {
    if (!newName.trim()) return
    setSaving(true)
    try {
      await commsService.renameConversation(conversation.id, newName.trim())
      loadConversations()
      setRenaming(false)
      toast.success('Conversation renamed')
    } catch (err) {
      console.error('Failed to rename:', err)
      toast.error('Failed to rename conversation')
    } finally {
      setSaving(false)
    }
  }

  const canRename = conversation.type !== 'dm'
  const canLeave = conversation.type === 'group'

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Settings className="h-4 w-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-2">
        <div className="space-y-1">
          {/* Mute/Unmute */}
          <button
            onClick={handleToggleMute}
            disabled={toggling}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors text-sm disabled:opacity-50"
          >
            {toggling ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : isMuted ? (
              <Bell className="h-4 w-4 text-muted-foreground" />
            ) : (
              <BellOff className="h-4 w-4 text-muted-foreground" />
            )}
            <span>{isMuted ? 'Unmute' : 'Mute'}</span>
          </button>

          {/* Rename (groups/channels only) */}
          {canRename && (
            <>
              {renaming ? (
                <div className="px-2 py-1.5 space-y-2">
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="New name"
                    className="h-7 text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename()
                      if (e.key === 'Escape') setRenaming(false)
                    }}
                  />
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      className="h-6 text-xs flex-1"
                      onClick={handleRename}
                      disabled={saving || !newName.trim()}
                    >
                      {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-xs"
                      onClick={() => setRenaming(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setNewName(conversation.name ?? '')
                    setRenaming(true)
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors text-sm"
                >
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                  <span>Rename</span>
                </button>
              )}
            </>
          )}

          {/* Leave conversation (groups only) */}
          {canLeave && (
            <>
              <Separator className="my-1" />
              <button
                onClick={handleLeave}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-destructive/10 transition-colors text-sm text-destructive"
              >
                <LogOut className="h-4 w-4" />
                <span>Leave conversation</span>
              </button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
