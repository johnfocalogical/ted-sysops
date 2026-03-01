import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConversationList } from '@/components/comms/ConversationList'
import { MessageView } from '@/components/comms/MessageView'
import { NewConversationModal } from '@/components/comms/NewConversationModal'
import { useCommsStore } from '@/hooks/useCommsStore'
import { useAuth } from '@/hooks/useAuth'
import { useTeamContext } from '@/hooks/useTeamContext'
import * as commsService from '@/lib/commsService'
import { cn } from '@/lib/utils'

export function CommsPage() {
  const { teamId, conversationId } = useParams<{
    teamId: string
    conversationId?: string
  }>()
  const { user } = useAuth()
  const { hasFullAccess } = useTeamContext()
  const { selectedConversationId, selectConversation } = useCommsStore()
  const [showNewConversation, setShowNewConversation] = useState(false)

  const userId = user?.id
  const canWrite = hasFullAccess('comms')

  // If conversationId is in the URL, select it
  useEffect(() => {
    if (conversationId) {
      selectConversation(conversationId)
    }
  }, [conversationId])

  // Ensure default channel exists on first Comms access
  useEffect(() => {
    if (!teamId || !userId) return
    commsService.ensureDefaultChannel(teamId, userId).catch((err) => {
      console.error('Failed to ensure default channel:', err)
    })
  }, [teamId, userId])

  // Setup conversation-level realtime subscription
  useEffect(() => {
    if (!teamId || !userId) return

    const unsubscribe = commsService.subscribeToConversations(
      teamId,
      userId,
      () => {
        useCommsStore.getState().loadConversations()
        useCommsStore.getState().loadUnreadCount()
      }
    )

    return unsubscribe
  }, [teamId, userId])

  if (!teamId || !userId) {
    return <div>Invalid team</div>
  }

  // Mobile: show message view when a conversation is selected, list otherwise
  const showingMessages = !!selectedConversationId

  return (
    <div className="-m-6 flex h-[calc(100vh-4rem)]">
      {/* Left panel: conversation list */}
      <div
        className={cn(
          'w-full md:w-80 flex-shrink-0 overflow-hidden',
          // On mobile, hide list when viewing messages
          showingMessages && 'hidden md:block'
        )}
      >
        <ConversationList
          teamId={teamId}
          userId={userId}
          onNewConversation={() => setShowNewConversation(true)}
        />
      </div>

      {/* Right panel: message view */}
      <div
        className={cn(
          'flex-1 flex flex-col min-w-0 overflow-hidden',
          // On mobile, hide message view when no conversation selected
          !showingMessages && 'hidden md:flex'
        )}
      >
        {/* Mobile back button */}
        <div className="md:hidden border-b border-border px-3 py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => selectConversation(null)}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </div>

        <MessageView
          userId={userId}
          teamId={teamId}
          readOnly={!canWrite}
        />
      </div>

      {/* New conversation modal */}
      <NewConversationModal
        open={showNewConversation}
        onClose={() => setShowNewConversation(false)}
        teamId={teamId}
      />
    </div>
  )
}
