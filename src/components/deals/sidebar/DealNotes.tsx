import { useState, useEffect, useCallback } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { getDealNotes, createDealNote, deleteDealNote } from '@/lib/dealService'
import type { DealNoteWithUser } from '@/types/deal.types'

interface DealNotesProps {
  dealId: string
}

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function DealNotes({ dealId }: DealNotesProps) {
  const { user } = useAuth()

  const [notes, setNotes] = useState<DealNoteWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadNotes = useCallback(async () => {
    try {
      const data = await getDealNotes(dealId)
      setNotes(data)
    } catch (err) {
      console.error('Error loading notes:', err)
    }
  }, [dealId])

  useEffect(() => {
    let cancelled = false
    loadNotes().finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [loadNotes])

  const handleAdd = async () => {
    if (!content.trim() || !user?.id) return

    setIsSubmitting(true)
    try {
      await createDealNote({ deal_id: dealId, content: content.trim() }, user.id)
      setContent('')
      await loadNotes()
    } catch (err) {
      console.error('Error adding note:', err)
      toast.error('Failed to add note')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (noteId: string) => {
    try {
      await deleteDealNote(noteId)
      setNotes((prev) => prev.filter((n) => n.id !== noteId))
      toast.success('Note deleted')
    } catch (err) {
      console.error('Error deleting note:', err)
      toast.error('Failed to delete note')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Notes list */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {notes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-muted-foreground">
              No notes yet. Add a note below.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note.id} className="group">
                <div className="flex items-baseline justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs font-medium">
                      {note.user.full_name || note.user.email}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {relativeTime(note.created_at)}
                    </span>
                  </div>
                  {user?.id === note.user_id && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete note?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(note.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap leading-relaxed">
                  {note.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add note area */}
      <div className="shrink-0 border-t p-3 space-y-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a note..."
          rows={2}
          className="resize-none text-xs"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              handleAdd()
            }
          }}
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={!content.trim() || isSubmitting}
            className="text-xs h-7"
          >
            {isSubmitting ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : null}
            Add Note
          </Button>
        </div>
      </div>
    </div>
  )
}
