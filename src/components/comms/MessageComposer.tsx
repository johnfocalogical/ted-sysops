import { useState, useRef, useCallback, useEffect } from 'react'
import { Send, Paperclip, X, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { MAX_MESSAGE_LENGTH } from '@/lib/commsConstants'
import {
  validateFile,
  canAddMoreFiles,
  formatFileSize,
  isImageFile,
  type PendingAttachment,
} from '@/lib/commsStorageService'
import { toast } from 'sonner'

interface MessageComposerProps {
  onSend: (content: string, attachments?: File[]) => void
  disabled?: boolean
  placeholder?: string
}

export function MessageComposer({
  onSend,
  disabled = false,
  placeholder = 'Type a message...',
}: MessageComposerProps) {
  const [content, setContent] = useState('')
  const [pendingFiles, setPendingFiles] = useState<PendingAttachment[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isEmpty = content.trim().length === 0 && pendingFiles.length === 0
  const isOverLimit = content.length > MAX_MESSAGE_LENGTH
  const showCharCount = content.length > MAX_MESSAGE_LENGTH * 0.9

  const autoResize = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    const maxHeight = 120 // ~5 lines
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`
  }, [])

  useEffect(() => {
    autoResize()
  }, [content, autoResize])

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      pendingFiles.forEach((p) => {
        if (p.previewUrl) URL.revokeObjectURL(p.previewUrl)
      })
    }
  }, [])

  const addFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const newPending: PendingAttachment[] = []

    for (const file of fileArray) {
      if (!canAddMoreFiles(pendingFiles.length + newPending.length)) {
        toast.error('Maximum 5 files per message')
        break
      }

      const error = validateFile(file)
      if (error) {
        toast.error(`${file.name}: ${error}`)
        continue
      }

      const previewUrl = isImageFile(file.type)
        ? URL.createObjectURL(file)
        : undefined

      newPending.push({ file, previewUrl })
    }

    if (newPending.length > 0) {
      setPendingFiles((prev) => [...prev, ...newPending])
    }
  }

  const removeFile = (index: number) => {
    setPendingFiles((prev) => {
      const removed = prev[index]
      if (removed.previewUrl) URL.revokeObjectURL(removed.previewUrl)
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleSend = () => {
    if (isEmpty || isOverLimit || disabled) return

    const files = pendingFiles.map((p) => p.file)
    onSend(content.trim(), files.length > 0 ? files : undefined)

    // Cleanup
    pendingFiles.forEach((p) => {
      if (p.previewUrl) URL.revokeObjectURL(p.previewUrl)
    })
    setContent('')
    setPendingFiles([])

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (disabled) return
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  return (
    <div
      className="border-t border-border p-3"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Pending attachments */}
      {pendingFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {pendingFiles.map((pending, i) => (
            <div
              key={i}
              className="relative group flex items-center gap-2 px-2 py-1.5 rounded-md border border-border bg-muted/30 max-w-[180px]"
            >
              {pending.previewUrl ? (
                <img
                  src={pending.previewUrl}
                  alt={pending.file.name}
                  className="h-8 w-8 rounded object-cover flex-shrink-0"
                />
              ) : (
                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium truncate">{pending.file.name}</p>
                <p className="text-[9px] text-muted-foreground">
                  {formatFileSize(pending.file.size)}
                </p>
              </div>
              <button
                onClick={() => removeFile(i)}
                className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Attachment button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 flex-shrink-0 text-muted-foreground"
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
          title="Attach file"
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              addFiles(e.target.files)
              e.target.value = '' // Reset so same file can be selected again
            }
          }}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
        />

        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? 'Read-only' : placeholder}
            disabled={disabled}
            rows={1}
            className={cn(
              'w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm',
              'placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              isOverLimit && 'border-destructive focus:ring-destructive'
            )}
          />

          {/* Character count */}
          {showCharCount && (
            <span
              className={cn(
                'absolute right-2 bottom-1 text-[10px]',
                isOverLimit ? 'text-destructive' : 'text-muted-foreground'
              )}
            >
              {content.length}/{MAX_MESSAGE_LENGTH}
            </span>
          )}
        </div>

        {/* Send button */}
        <Button
          size="icon"
          onClick={handleSend}
          disabled={isEmpty || isOverLimit || disabled}
          className="h-9 w-9 flex-shrink-0 bg-primary hover:bg-primary/90"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      <p className="text-[10px] text-muted-foreground mt-1 ml-11">
        <kbd className="px-1 rounded bg-muted text-[10px]">Enter</kbd> to send,{' '}
        <kbd className="px-1 rounded bg-muted text-[10px]">Shift+Enter</kbd> for new line
      </p>
    </div>
  )
}
