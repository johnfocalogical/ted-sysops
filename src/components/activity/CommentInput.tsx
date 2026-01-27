import { useState, useRef, useEffect, useCallback } from 'react'
import { Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { MentionedUser } from '@/types/activity.types'

interface CommentInputProps {
  onSubmit: (content: string, mentionedUserIds: string[]) => Promise<void>
  teamMembers?: MentionedUser[]
  placeholder?: string
  compact?: boolean
  disabled?: boolean
}

export function CommentInput({
  onSubmit,
  teamMembers = [],
  placeholder = 'Add a comment...',
  compact = false,
  disabled = false,
}: CommentInputProps) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mentionedIds, setMentionedIds] = useState<string[]>([])

  // Mention popover state
  const [showMentionList, setShowMentionList] = useState(false)
  const [mentionFilter, setMentionFilter] = useState('')
  const [mentionIndex, setMentionIndex] = useState(0)
  const [mentionStartPos, setMentionStartPos] = useState<number | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const mentionListRef = useRef<HTMLDivElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, compact ? 80 : 150)}px`
    }
  }, [content, compact])

  // Filter team members based on mention query
  const filteredMembers = teamMembers.filter((m) => {
    const name = (m.full_name || m.email).toLowerCase()
    return name.includes(mentionFilter.toLowerCase())
  }).slice(0, 5)

  // Reset mention index when filter changes
  useEffect(() => {
    setMentionIndex(0)
  }, [mentionFilter])

  const insertMention = useCallback((member: MentionedUser) => {
    if (mentionStartPos === null) return

    const before = content.slice(0, mentionStartPos)
    const after = content.slice(textareaRef.current?.selectionStart || content.length)
    const mentionText = `@${member.full_name || member.email} `
    const newContent = before + mentionText + after

    setContent(newContent)
    setMentionedIds((prev) => prev.includes(member.id) ? prev : [...prev, member.id])
    setShowMentionList(false)
    setMentionFilter('')
    setMentionStartPos(null)

    // Focus back on textarea
    requestAnimationFrame(() => {
      const textarea = textareaRef.current
      if (textarea) {
        const cursorPos = before.length + mentionText.length
        textarea.focus()
        textarea.setSelectionRange(cursorPos, cursorPos)
      }
    })
  }, [content, mentionStartPos])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    const cursorPos = e.target.selectionStart

    setContent(value)

    // Check for @ trigger
    if (teamMembers.length > 0) {
      // Look backwards from cursor for an @ that starts a mention
      const textBeforeCursor = value.slice(0, cursorPos)
      const lastAtIndex = textBeforeCursor.lastIndexOf('@')

      if (lastAtIndex >= 0) {
        // Check that @ is at start of text or preceded by whitespace
        const charBefore = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : ' '
        const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1)
        // Don't show if there's a space and then more text (means mention is complete)
        const hasCompletedMention = textAfterAt.includes('  ')

        if ((charBefore === ' ' || charBefore === '\n' || lastAtIndex === 0) && !hasCompletedMention) {
          setShowMentionList(true)
          setMentionFilter(textAfterAt)
          setMentionStartPos(lastAtIndex)
          return
        }
      }
    }

    setShowMentionList(false)
    setMentionFilter('')
    setMentionStartPos(null)
  }

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      await onSubmit(content.trim(), mentionedIds)
      setContent('')
      setMentionedIds([])
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle mention list navigation
    if (showMentionList && filteredMembers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setMentionIndex((prev) => (prev + 1) % filteredMembers.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setMentionIndex((prev) => (prev - 1 + filteredMembers.length) % filteredMembers.length)
        return
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        insertMention(filteredMembers[mentionIndex])
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setShowMentionList(false)
        return
      }
    }

    // Submit on Cmd/Ctrl + Enter
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const mentionPopover = showMentionList && filteredMembers.length > 0 && (
    <div
      ref={mentionListRef}
      className="absolute bottom-full left-0 right-0 mb-1 bg-popover border rounded-md shadow-md z-50 max-h-[200px] overflow-y-auto"
    >
      {filteredMembers.map((member, i) => (
        <button
          key={member.id}
          className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent ${
            i === mentionIndex ? 'bg-accent' : ''
          }`}
          onMouseDown={(e) => {
            e.preventDefault()
            insertMention(member)
          }}
        >
          <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium shrink-0">
            {(member.full_name || member.email).slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            {member.full_name && (
              <div className="font-medium truncate">{member.full_name}</div>
            )}
            <div className="text-xs text-muted-foreground truncate">{member.email}</div>
          </div>
        </button>
      ))}
    </div>
  )

  if (compact) {
    return (
      <div className="relative">
        {mentionPopover}
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isSubmitting}
            className="min-h-[36px] max-h-[80px] resize-none text-sm py-2"
            rows={1}
          />
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting || disabled}
            className="shrink-0 h-9 w-9"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2 relative">
      {mentionPopover}
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || isSubmitting}
        className="min-h-[60px] max-h-[150px] resize-none"
        rows={2}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {teamMembers.length > 0 ? 'Type @ to mention. ' : ''}
          Press Cmd/Ctrl + Enter to submit
        </span>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!content.trim() || isSubmitting || disabled}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Posting...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Post Comment
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
