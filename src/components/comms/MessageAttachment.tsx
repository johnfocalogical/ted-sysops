import { useState } from 'react'
import { FileText, Download, Image, FileSpreadsheet, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { isImageFile, formatFileSize, getAttachmentUrl } from '@/lib/commsStorageService'
import type { MessageAttachment as AttachmentType } from '@/types/comms.types'

interface MessageAttachmentProps {
  attachment: AttachmentType
}

function getFileIcon(mimeType: string | null) {
  if (mimeType?.includes('pdf')) return FileText
  if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel')) return FileSpreadsheet
  if (isImageFile(mimeType)) return Image
  return FileText
}

function SingleAttachment({ attachment }: MessageAttachmentProps) {
  const [downloading, setDownloading] = useState(false)
  const [imageError, setImageError] = useState(false)

  const isImage = isImageFile(attachment.mime_type) && !imageError
  const FileIcon = getFileIcon(attachment.mime_type)

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const url = await getAttachmentUrl(attachment.storage_path)
      window.open(url, '_blank')
    } catch (err) {
      console.error('Failed to get download URL:', err)
    } finally {
      setDownloading(false)
    }
  }

  if (isImage) {
    return (
      <button
        onClick={handleDownload}
        className="block rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors max-w-[300px]"
      >
        <img
          src={attachment.storage_path}
          alt={attachment.file_name}
          className="max-w-full h-auto max-h-[200px] object-cover"
          onError={() => setImageError(true)}
        />
        <div className="flex items-center justify-between px-2 py-1 bg-muted/30">
          <span className="text-[10px] text-muted-foreground truncate">
            {attachment.file_name}
          </span>
          <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">
            {formatFileSize(attachment.file_size)}
          </span>
        </div>
      </button>
    )
  }

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border hover:bg-muted/50 transition-colors max-w-[280px] group"
    >
      <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
        <FileIcon className="h-4.5 w-4.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-medium truncate">{attachment.file_name}</p>
        <p className="text-[10px] text-muted-foreground">
          {formatFileSize(attachment.file_size)}
        </p>
      </div>
      {downloading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground flex-shrink-0" />
      ) : (
        <Download className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      )}
    </button>
  )
}

interface MessageAttachmentsProps {
  attachments: AttachmentType[]
}

export function MessageAttachments({ attachments }: MessageAttachmentsProps) {
  if (attachments.length === 0) return null

  const images = attachments.filter((a) => isImageFile(a.mime_type))
  const files = attachments.filter((a) => !isImageFile(a.mime_type))

  return (
    <div className="mt-2 space-y-2">
      {/* Image grid */}
      {images.length > 0 && (
        <div className={cn('grid gap-2', images.length > 1 ? 'grid-cols-2' : 'grid-cols-1')}>
          {images.map((img) => (
            <SingleAttachment key={img.id} attachment={img} />
          ))}
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-1">
          {files.map((file) => (
            <SingleAttachment key={file.id} attachment={file} />
          ))}
        </div>
      )}
    </div>
  )
}
