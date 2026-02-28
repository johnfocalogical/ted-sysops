import { useState, useEffect, useRef, useCallback } from 'react'
import { Check, Loader2, AlertCircle } from 'lucide-react'
import { RichTextEditor } from '@/components/shared/RichTextEditor'
import { updateDeal } from '@/lib/dealService'
import { createActivityLog } from '@/lib/activityLogService'
import { useAuth } from '@/hooks/useAuth'
import { useTeamContext } from '@/hooks/useTeamContext'

interface DealNotesProps {
  dealId: string
  initialNotes: string | null
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function DealNotes({ dealId, initialNotes }: DealNotesProps) {
  const { user } = useAuth()
  const { context } = useTeamContext()
  const teamId = context?.currentTeam?.id

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestHtmlRef = useRef<string>(initialNotes || '')
  const pendingSaveRef = useRef(false)

  // Keep mutable refs for values needed by the save function
  // so the save logic never goes stale
  const dealIdRef = useRef(dealId)
  const userIdRef = useRef(user?.id)
  const teamIdRef = useRef(teamId)
  dealIdRef.current = dealId
  userIdRef.current = user?.id
  teamIdRef.current = teamId

  const doSave = useCallback(async (html: string) => {
    const uid = userIdRef.current
    const tid = teamIdRef.current
    const did = dealIdRef.current
    if (!uid || !tid) return

    setSaveStatus('saving')
    try {
      await updateDeal(did, { notes: html })
      await createActivityLog(
        {
          team_id: tid,
          deal_id: did,
          entity_type: 'deal',
          activity_type: 'updated',
          content: 'Updated deal notes',
        },
        uid
      )
      setSaveStatus('saved')
    } catch (err) {
      console.error('Error saving notes:', err)
      setSaveStatus('error')
    }
  }, [])

  const handleUpdate = useCallback(
    (html: string) => {
      latestHtmlRef.current = html
      pendingSaveRef.current = true
      setSaveStatus('idle')

      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        pendingSaveRef.current = false
        doSave(html)
      }, 1500)
    },
    [doSave]
  )

  // Flush pending save on unmount only (empty deps = runs once)
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      if (pendingSaveRef.current) {
        doSave(latestHtmlRef.current)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <RichTextEditor
          content={initialNotes || ''}
          onUpdate={handleUpdate}
          placeholder="Add notes about this deal..."
        />
      </div>

      {/* Save status indicator */}
      <div className="shrink-0 border-t px-3 py-1.5 flex items-center justify-end">
        {saveStatus === 'saving' && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving...
          </span>
        )}
        {saveStatus === 'saved' && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Check className="h-3 w-3" />
            Saved
          </span>
        )}
        {saveStatus === 'error' && (
          <span className="flex items-center gap-1 text-xs text-destructive">
            <AlertCircle className="h-3 w-3" />
            Save failed
          </span>
        )}
      </div>
    </div>
  )
}
