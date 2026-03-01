import { useState, useEffect } from 'react'
import { Search, X, Loader2, Hash, User, Users } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import * as commsService from '@/lib/commsService'
import type { MessageSearchResult } from '@/lib/commsService'
import { useCommsStore } from '@/hooks/useCommsStore'

interface MessageSearchProps {
  teamId: string
  onClose: () => void
}

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  if (msgDate.getTime() === today.getTime()) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-primary/20 text-foreground rounded-sm px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  )
}

function ConversationIcon({ type }: { type: string }) {
  if (type === 'channel') return <Hash className="h-3 w-3 text-muted-foreground" />
  if (type === 'dm') return <User className="h-3 w-3 text-muted-foreground" />
  return <Users className="h-3 w-3 text-muted-foreground" />
}

export function MessageSearch({ teamId, onClose }: MessageSearchProps) {
  const { selectConversation } = useCommsStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MessageSearchResult[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setTotal(0)
      setSearched(false)
      return
    }

    const timeout = setTimeout(async () => {
      setLoading(true)
      setSearched(true)
      try {
        const { results: r, total: t } = await commsService.searchMessages(
          teamId,
          query.trim(),
          { limit: 30 }
        )
        setResults(r)
        setTotal(t)
      } catch (err) {
        console.error('Search failed:', err)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timeout)
  }, [query, teamId])

  const handleResultClick = (result: MessageSearchResult) => {
    selectConversation(result.conversation_id)
    onClose()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search header */}
      <div className="px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search messages..."
              className="pl-8 h-8 text-sm"
              autoFocus
            />
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
        {searched && !loading && (
          <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
            {total} result{total !== 1 ? 's' : ''} found
          </p>
        )}
      </div>

      {/* Results */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : results.length > 0 ? (
          <div className="py-1">
            {results.map((result) => (
              <button
                key={result.id}
                onClick={() => handleResultClick(result)}
                className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left"
              >
                {/* Sender avatar */}
                <Avatar className="h-7 w-7 flex-shrink-0 mt-0.5">
                  <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-medium">
                    {getInitials(result.sender?.full_name ?? null)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0 space-y-0.5">
                  {/* Sender name + conversation context + time */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="font-medium truncate">
                      {result.sender?.full_name ?? 'System'}
                    </span>
                    <span className="text-muted-foreground">in</span>
                    <ConversationIcon type={result.conversation_type} />
                    <span className="text-muted-foreground truncate">
                      {result.conversation_name ?? 'Direct Message'}
                    </span>
                    <span className="text-muted-foreground ml-auto flex-shrink-0">
                      {formatTime(result.created_at)}
                    </span>
                  </div>

                  {/* Message content with highlighting */}
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {highlightMatch(result.content, query)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : searched ? (
          <div className="text-center py-8">
            <Search className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">
              No messages found for &quot;{query}&quot;
            </p>
          </div>
        ) : (
          <div className="text-center py-8">
            <Search className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">
              Search across all your conversations
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
