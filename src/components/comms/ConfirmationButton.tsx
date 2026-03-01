import { useState } from 'react'
import { Check, Loader2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

interface ConfirmationMetadata {
  instance_id: string
  node_id: string
  assignee: 'specific_user' | 'deal_owner' | 'any_participant'
  assignee_user_id?: string
  status: 'pending' | 'confirmed' | 'timed_out'
  confirmed_by?: string
  confirmed_by_name?: string
  confirmed_at?: string
}

interface ConfirmationButtonProps {
  metadata: ConfirmationMetadata
  currentUserId: string
}

export function ConfirmationButton({ metadata, currentUserId }: ConfirmationButtonProps) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'pending' | 'confirmed' | 'timed_out'>(metadata.status)

  const isConfirmed = status === 'confirmed'
  const isTimedOut = status === 'timed_out'

  // Determine if the current user is allowed to confirm
  const canConfirm =
    !isConfirmed &&
    !isTimedOut &&
    (metadata.assignee === 'any_participant' ||
      (metadata.assignee === 'specific_user' && metadata.assignee_user_id === currentUserId) ||
      metadata.assignee === 'deal_owner') // deal_owner resolved at execution time

  const handleConfirm = async () => {
    if (!supabase || loading || !canConfirm) return
    setLoading(true)

    try {
      // Call the execute_automator_step RPC to advance the workflow
      const { error } = await supabase.rpc('execute_automator_step', {
        p_instance_id: metadata.instance_id,
        p_node_id: metadata.node_id,
        p_user_id: currentUserId,
        p_response: { confirmed: true },
        p_branch_taken: null,
      })

      if (error) throw error
      setStatus('confirmed')
    } catch (err) {
      console.error('Failed to confirm:', err)
    } finally {
      setLoading(false)
    }
  }

  if (isConfirmed) {
    return (
      <div className="mt-2 flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
        <Check className="h-3.5 w-3.5" />
        <span>
          Confirmed by {metadata.confirmed_by_name ?? 'team member'}
          {metadata.confirmed_at && (
            <> at {new Date(metadata.confirmed_at).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })}</>
          )}
        </span>
      </div>
    )
  }

  if (isTimedOut) {
    return (
      <div className="mt-2 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
        <Clock className="h-3.5 w-3.5" />
        <span>Confirmation timed out</span>
      </div>
    )
  }

  return (
    <Button
      size="sm"
      className={cn(
        'mt-2 bg-primary hover:bg-primary/90',
        !canConfirm && 'opacity-50 cursor-not-allowed'
      )}
      disabled={!canConfirm || loading}
      onClick={handleConfirm}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
      ) : (
        <Check className="h-3.5 w-3.5 mr-1.5" />
      )}
      Confirm
    </Button>
  )
}
