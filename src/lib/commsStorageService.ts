import { supabase } from './supabase'

const BUCKET = 'comms-attachments'
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_FILES_PER_MESSAGE = 5
const SIGNED_URL_EXPIRY = 3600 // 1 hour

const ALLOWED_TYPES = new Set([
  // Images
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // Text
  'text/plain', 'text/csv',
])

export interface PendingAttachment {
  file: File
  previewUrl?: string // For images, created via URL.createObjectURL
}

export interface UploadedAttachment {
  path: string
  url: string
  fileName: string
  mimeType: string
  fileSize: number
}

/**
 * Validate a file before adding to pending list.
 */
export function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return `File too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return 'File type not supported'
  }
  return null
}

/**
 * Check if more files can be added.
 */
export function canAddMoreFiles(currentCount: number): boolean {
  return currentCount < MAX_FILES_PER_MESSAGE
}

/**
 * Upload a file to Supabase Storage.
 */
export async function uploadMessageAttachment(
  teamId: string,
  conversationId: string,
  file: File
): Promise<UploadedAttachment> {
  if (!supabase) throw new Error('Supabase not configured')

  // Create a unique path
  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${teamId}/${conversationId}/${timestamp}_${safeName}`

  const { error } = await supabase
    .storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) throw error

  // Get a signed URL
  const url = await getAttachmentUrl(path)

  return {
    path,
    url,
    fileName: file.name,
    mimeType: file.type,
    fileSize: file.size,
  }
}

/**
 * Get a signed download URL for an attachment.
 */
export async function getAttachmentUrl(
  storagePath: string
): Promise<string> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .storage
    .from(BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_EXPIRY)

  if (error) throw error
  return data.signedUrl
}

/**
 * Delete an attachment from storage.
 */
export async function deleteAttachment(
  storagePath: string
): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  const { error } = await supabase
    .storage
    .from(BUCKET)
    .remove([storagePath])

  if (error) throw error
}

/**
 * Check if a file is an image type.
 */
export function isImageFile(mimeType: string | null): boolean {
  return !!mimeType && mimeType.startsWith('image/')
}

/**
 * Format file size for display.
 */
export function formatFileSize(bytes: number | null): string {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export { MAX_FILE_SIZE, MAX_FILES_PER_MESSAGE }
