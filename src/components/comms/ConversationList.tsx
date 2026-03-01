import { useState, useEffect, useMemo } from 'react'
import { Plus, Search, MessageSquare, Loader2, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConversationListItem } from './ConversationListItem'
import { MessageSearch } from './MessageSearch'
import { ChannelManagement } from './ChannelManagement'
import { useCommsStore } from '@/hooks/useCommsStore'
import { useTeamContext } from '@/hooks/useTeamContext'
import type { ConversationType } from '@/types/comms.types'

interface ConversationListProps {
  teamId: string
  userId: string
  onNewConversation: () => void
}

export function ConversationList({
  teamId,
  userId,
  onNewConversation,
}: ConversationListProps) {
  const {
    conversations,
    conversationsLoading,
    selectedConversationId,
    conversationTypeFilter,
    searchQuery,
    setTeamId,
    loadConversations,
    selectConversation,
    setConversationTypeFilter,
    setSearchQuery,
    loadUnreadCount,
  } = useCommsStore()

  // Initialize store with team context and load data
  useEffect(() => {
    setTeamId(teamId)
    loadConversations()
    loadUnreadCount()
  }, [teamId, userId])

  const [showSearch, setShowSearch] = useState(false)
  const [showChannelMgmt, setShowChannelMgmt] = useState(false)
  const { hasFullAccess } = useTeamContext()
  const isAdmin = hasFullAccess('comms')

  // Group conversations: channels vs DMs/groups
  const { channelConversations, otherConversations } = useMemo(() => {
    const channels = conversations.filter((c) => c.type === 'channel')
    const others = conversations.filter((c) => c.type !== 'channel')
    return { channelConversations: channels, otherConversations: others }
  }, [conversations])

  const showGrouped = conversationTypeFilter === null // "All" tab

  const handleFilterChange = (value: string) => {
    setConversationTypeFilter(
      value === 'all' ? null : (value as ConversationType)
    )
  }

  // When in search mode, render the search panel instead
  if (showSearch) {
    return (
      <div className="flex flex-col h-full border-r border-border">
        <MessageSearch
          teamId={teamId}
          onClose={() => setShowSearch(false)}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Messages</h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSearch(true)}
              className="h-8 w-8 p-0"
              title="Search messages"
            >
              <Search className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              onClick={onNewConversation}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        {/* Type filter tabs */}
        <Tabs
          value={conversationTypeFilter ?? 'all'}
          onValueChange={handleFilterChange}
        >
          <TabsList className="w-full grid grid-cols-4 h-8">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="dm" className="text-xs">DMs</TabsTrigger>
            <TabsTrigger value="group" className="text-xs">Groups</TabsTrigger>
            <TabsTrigger value="channel" className="text-xs">Channels</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Conversation list */}
      <ScrollArea className="flex-1">
        {conversationsLoading && conversations.length === 0 ? (
          <div className="p-3 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium mb-1">No conversations yet</p>
            <p className="text-xs text-muted-foreground mb-4">
              Start a new conversation!
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={onNewConversation}
            >
              <Plus className="h-4 w-4 mr-1" />
              New Conversation
            </Button>
          </div>
        ) : showGrouped && channelConversations.length > 0 ? (
          <div className="p-1">
            {/* Channels section */}
            <div className="flex items-center justify-between px-3 pt-2 pb-1">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Channels
              </span>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0"
                  onClick={() => setShowChannelMgmt(true)}
                  title="Manage channels"
                >
                  <Settings className="h-3 w-3 text-muted-foreground" />
                </Button>
              )}
            </div>
            {channelConversations.map((conversation) => (
              <ConversationListItem
                key={conversation.id}
                conversation={conversation}
                isSelected={conversation.id === selectedConversationId}
                currentUserId={userId}
                onClick={() => selectConversation(conversation.id)}
              />
            ))}

            {/* DMs & Groups section */}
            {otherConversations.length > 0 && (
              <>
                <div className="px-3 pt-3 pb-1">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Direct Messages
                  </span>
                </div>
                {otherConversations.map((conversation) => (
                  <ConversationListItem
                    key={conversation.id}
                    conversation={conversation}
                    isSelected={conversation.id === selectedConversationId}
                    currentUserId={userId}
                    onClick={() => selectConversation(conversation.id)}
                  />
                ))}
              </>
            )}
          </div>
        ) : (
          <div className="p-1">
            {conversations.map((conversation) => (
              <ConversationListItem
                key={conversation.id}
                conversation={conversation}
                isSelected={conversation.id === selectedConversationId}
                currentUserId={userId}
                onClick={() => selectConversation(conversation.id)}
              />
            ))}
          </div>
        )}

        {conversationsLoading && conversations.length > 0 && (
          <div className="flex justify-center py-3">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
      </ScrollArea>

      {/* Channel management dialog */}
      <ChannelManagement
        teamId={teamId}
        userId={userId}
        open={showChannelMgmt}
        onClose={() => {
          setShowChannelMgmt(false)
          loadConversations()
        }}
      />
    </div>
  )
}
