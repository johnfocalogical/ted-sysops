import { useState, useRef, useEffect } from 'react'
import { Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface CommentInputProps {
  onSubmit: (content: string) => Promise<void>
  placeholder?: string
  compact?: boolean
  disabled?: boolean
}

export function CommentInput({
  onSubmit,
  placeholder = 'Add a comment...',
  compact = false,
  disabled = false,
}: CommentInputProps) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, compact ? 80 : 150)}px`
    }
  }, [content, compact])

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      await onSubmit(content.trim())
      setContent('')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Cmd/Ctrl + Enter
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  if (compact) {
    return (
      <div className="flex gap-2">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
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
    )
  }

  return (
    <div className="space-y-2">
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || isSubmitting}
        className="min-h-[60px] max-h-[150px] resize-none"
        rows={2}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
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
