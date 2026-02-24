import { useState, useEffect, useCallback, useRef } from 'react'
import { Loader2, Trash2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
import { useParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { getDealComments, createDealComment, deleteDealComment } from '@/lib/dealService'
import { createActivityLog } from '@/lib/activityLogService'
import { getTeamMembersForMentions } from '@/lib/activityLogService'
import type { DealCommentWithUser } from '@/types/deal.types'

interface DealCommentsProps {
  dealId: string
}

interface TeamMember {
  id: string
  full_name: string | null
  email: string
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(' ')
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase()
  }
  return email[0].toUpperCase()
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

/**
 * Render comment content with @mentions highlighted
 */
function renderContent(content: string, taggedIds: string[] | null, members: TeamMember[]) {
  if (!taggedIds || taggedIds.length === 0) return content

  // Build a map of member names
  const nameMap = new Map<string, string>()
  for (const m of members) {
    nameMap.set(m.id, m.full_name || m.email)
  }

  // Replace @Name patterns with highlighted spans
  let result = content
  for (const id of taggedIds) {
    const name = nameMap.get(id)
    if (name) {
      result = result.replace(
        new RegExp(`@${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'),
        `@@MENTION_${id}@@`
      )
    }
  }

  // Split on mention markers and render
  const parts = result.split(/(@@MENTION_[^@]+@@)/)
  return parts.map((part, i) => {
    const mentionMatch = part.match(/^@@MENTION_(.+)@@$/)
    if (mentionMatch) {
      const name = nameMap.get(mentionMatch[1])
      return (
        <span key={i} className="text-primary font-medium">
          @{name}
        </span>
      )
    }
    return part
  })
}

export function DealComments({ dealId }: DealCommentsProps) {
  const { teamId } = useParams<{ teamId: string }>()
  const { user } = useAuth()

  const [comments, setComments] = useState<DealCommentWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [taggedUserIds, setTaggedUserIds] = useState<string[]>([])

  // Mention autocomplete
  const [showMentions, setShowMentions] = useState(false)
  const [mentionFilter, setMentionFilter] = useState('')
  const [mentionIndex, setMentionIndex] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const feedEndRef = useRef<HTMLDivElement>(null)

  const loadComments = useCallback(async () => {
    try {
      const data = await getDealComments(dealId)
      setComments(data)
    } catch (err) {
      console.error('Error loading comments:', err)
    }
  }, [dealId])

  // Load comments + team members
  useEffect(() => {
    let cancelled = false
    Promise.all([
      loadComments(),
      teamId ? getTeamMembersForMentions(teamId) : Promise.resolve([]),
    ]).then(([, members]) => {
      if (!cancelled && members) {
        setTeamMembers(
          members.map((m) => ({
            id: m.id,
            full_name: m.full_name,
            email: m.email,
          }))
        )
      }
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [loadComments, teamId])

  // Scroll to bottom when new comments arrive
  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments.length])

  // Handle text input with @ detection
  const handleInput = (value: string) => {
    setContent(value)

    // Check if user is typing a mention
    const textarea = textareaRef.current
    if (!textarea) return

    const cursorPos = textarea.selectionStart
    const textBeforeCursor = value.substring(0, cursorPos)
    const atMatch = textBeforeCursor.match(/@(\w*)$/)

    if (atMatch) {
      setShowMentions(true)
      setMentionFilter(atMatch[1].toLowerCase())
      setMentionIndex(0)
    } else {
      setShowMentions(false)
    }
  }

  const filteredMembers = teamMembers.filter((m) => {
    const name = (m.full_name || m.email).toLowerCase()
    return name.includes(mentionFilter)
  })

  const insertMention = (member: TeamMember) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const cursorPos = textarea.selectionStart
    const textBeforeCursor = content.substring(0, cursorPos)
    const atIndex = textBeforeCursor.lastIndexOf('@')
    const name = member.full_name || member.email

    const newContent =
      content.substring(0, atIndex) +
      `@${name} ` +
      content.substring(cursorPos)

    setContent(newContent)
    setShowMentions(false)

    // Track tagged user
    if (!taggedUserIds.includes(member.id)) {
      setTaggedUserIds((prev) => [...prev, member.id])
    }

    // Focus back to textarea
    setTimeout(() => {
      textarea.focus()
      const newPos = atIndex + name.length + 2
      textarea.setSelectionRange(newPos, newPos)
    }, 0)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showMentions && filteredMembers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setMentionIndex((prev) => Math.min(prev + 1, filteredMembers.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setMentionIndex((prev) => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        insertMention(filteredMembers[mentionIndex])
        return
      } else if (e.key === 'Escape') {
        setShowMentions(false)
      }
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handlePost()
    }
  }

  const handlePost = async () => {
    if (!content.trim() || !user?.id || !teamId) return

    setIsSubmitting(true)
    try {
      await createDealComment(
        {
          deal_id: dealId,
          content: content.trim(),
          tagged_user_ids: taggedUserIds.length > 0 ? taggedUserIds : undefined,
        },
        user.id
      )

      await createActivityLog(
        {
          team_id: teamId,
          deal_id: dealId,
          entity_type: 'deal',
          activity_type: 'comment',
          content: `Posted a comment${taggedUserIds.length > 0 ? ` mentioning ${taggedUserIds.length} user(s)` : ''}`,
        },
        user.id
      )

      setContent('')
      setTaggedUserIds([])
      await loadComments()
    } catch (err) {
      console.error('Error posting comment:', err)
      toast.error('Failed to post comment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    try {
      await deleteDealComment(commentId)
      setComments((prev) => prev.filter((c) => c.id !== commentId))
      toast.success('Comment deleted')
    } catch (err) {
      console.error('Error deleting comment:', err)
      toast.error('Failed to delete comment')
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
      {/* Comments feed (chronological, oldest first) */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {comments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-muted-foreground">
              No comments yet. Start the conversation below.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-2 group">
                <Avatar className="h-6 w-6 shrink-0 mt-0.5">
                  <AvatarFallback className="text-[10px] bg-muted">
                    {getInitials(comment.user.full_name, comment.user.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs font-medium">
                        {comment.user.full_name || comment.user.email}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {relativeTime(comment.created_at)}
                      </span>
                    </div>
                    {user?.id === comment.user_id && (
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
                            <AlertDialogTitle>Delete comment?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(comment.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                  <p className="text-xs text-foreground/90 mt-0.5 whitespace-pre-wrap leading-relaxed">
                    {renderContent(comment.content, comment.tagged_user_ids, teamMembers)}
                  </p>
                </div>
              </div>
            ))}
            <div ref={feedEndRef} />
          </div>
        )}
      </div>

      {/* Comment input with @mention */}
      <div className="shrink-0 border-t p-3 space-y-2 relative">
        {/* Mention autocomplete dropdown */}
        {showMentions && filteredMembers.length > 0 && (
          <div className="absolute bottom-full left-3 right-3 mb-1 bg-popover border rounded-md shadow-md max-h-32 overflow-y-auto z-10">
            {filteredMembers.map((member, i) => (
              <button
                key={member.id}
                type="button"
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted ${
                  i === mentionIndex ? 'bg-muted' : ''
                }`}
                onMouseDown={(e) => {
                  e.preventDefault()
                  insertMention(member)
                }}
              >
                <span className="font-medium">{member.full_name || member.email}</span>
                {member.full_name && (
                  <span className="text-muted-foreground ml-1">{member.email}</span>
                )}
              </button>
            ))}
          </div>
        )}

        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => handleInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a comment... Use @ to mention"
          rows={2}
          className="resize-none text-xs"
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handlePost}
            disabled={!content.trim() || isSubmitting}
            className="text-xs h-7 gap-1"
          >
            {isSubmitting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Send className="h-3 w-3" />
            )}
            Post
          </Button>
        </div>
      </div>
    </div>
  )
}
