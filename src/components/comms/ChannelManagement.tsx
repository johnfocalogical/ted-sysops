import { useState, useEffect } from 'react'
import { Hash, Plus, Pencil, Archive, Loader2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import * as commsService from '@/lib/commsService'
import { toast } from 'sonner'
import type { Conversation } from '@/types/comms.types'

interface ChannelManagementProps {
  teamId: string
  userId: string
  open: boolean
  onClose: () => void
}

type ChannelWithCount = Conversation & { participant_count: number }

export function ChannelManagement({
  teamId,
  userId,
  open,
  onClose,
}: ChannelManagementProps) {
  const [channels, setChannels] = useState<ChannelWithCount[]>([])
  const [loading, setLoading] = useState(false)

  // Create dialog
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [creating, setCreating] = useState(false)

  // Edit dialog
  const [editChannel, setEditChannel] = useState<ChannelWithCount | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [saving, setSaving] = useState(false)

  // Archive confirmation
  const [archiveTarget, setArchiveTarget] = useState<ChannelWithCount | null>(null)

  const loadChannels = async () => {
    setLoading(true)
    try {
      const data = await commsService.getTeamChannels(teamId)
      setChannels(data)
    } catch (err) {
      console.error('Failed to load channels:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) loadChannels()
  }, [open, teamId])

  const handleCreate = async () => {
    if (!newName.trim()) return
    setCreating(true)
    try {
      await commsService.createChannel(
        teamId,
        userId,
        newName.trim(),
        newDescription.trim() || undefined
      )
      setNewName('')
      setNewDescription('')
      setShowCreate(false)
      loadChannels()
      toast.success(`#${newName.trim()} channel created`)
    } catch (err) {
      console.error('Failed to create channel:', err)
      toast.error('Failed to create channel')
    } finally {
      setCreating(false)
    }
  }

  const handleEdit = async () => {
    if (!editChannel || !editName.trim()) return
    setSaving(true)
    try {
      await commsService.updateChannel(editChannel.id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      })
      setEditChannel(null)
      loadChannels()
      toast.success('Channel updated')
    } catch (err) {
      console.error('Failed to update channel:', err)
      toast.error('Failed to update channel')
    } finally {
      setSaving(false)
    }
  }

  const handleArchive = async () => {
    if (!archiveTarget) return
    try {
      await commsService.archiveChannel(archiveTarget.id)
      setArchiveTarget(null)
      loadChannels()
      toast.success('Channel archived')
    } catch (err) {
      console.error('Failed to archive channel:', err)
      toast.error('Failed to archive channel')
    }
  }

  const openEdit = (channel: ChannelWithCount) => {
    setEditName(channel.name ?? '')
    setEditDescription(channel.description ?? '')
    setEditChannel(channel)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5 text-primary" />
              Manage Channels
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Create button */}
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Channel
            </Button>

            <Separator />

            {/* Channel list */}
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : channels.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No channels yet
              </p>
            ) : (
              <ScrollArea className="max-h-[300px]">
                <div className="space-y-1">
                  {channels.map((channel) => (
                    <div
                      key={channel.id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0" />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">
                            {channel.name}
                          </span>
                          {channel.is_default && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0">
                              Default
                            </Badge>
                          )}
                        </div>
                        {channel.description && channel.description !== '[Archived]' && (
                          <p className="text-xs text-muted-foreground truncate">
                            {channel.description}
                          </p>
                        )}
                        <div className="flex items-center gap-1 mt-0.5">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">
                            {channel.participant_count} members
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => openEdit(channel)}
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {!channel.is_default && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => setArchiveTarget(channel)}
                            title="Archive"
                          >
                            <Archive className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create channel dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Create Channel</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Channel Name
              </label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., Acquisitions Pipeline"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Description (optional)
              </label>
              <Textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="What's this channel about?"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={handleCreate}
              disabled={creating || !newName.trim()}
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit channel dialog */}
      <Dialog open={!!editChannel} onOpenChange={(v) => { if (!v) setEditChannel(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Channel</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Channel Name
              </label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Description
              </label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditChannel(null)}>
              Cancel
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={handleEdit}
              disabled={saving || !editName.trim()}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive confirmation */}
      <AlertDialog open={!!archiveTarget} onOpenChange={(v) => { if (!v) setArchiveTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Channel</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive <strong>#{archiveTarget?.name}</strong>?
              Messages will be preserved but the channel will be hidden from the list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchive}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
