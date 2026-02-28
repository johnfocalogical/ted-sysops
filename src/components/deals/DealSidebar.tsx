import {
  CheckSquare,
  Activity,
  MessageSquare,
  MessagesSquare,
  StickyNote,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DealChecklist } from './sidebar/DealChecklist'
import { DealActivityFeed } from './sidebar/DealActivityFeed'
import { DealComments } from './sidebar/DealComments'
import { DealNotes } from './sidebar/DealNotes'
import { DealChat } from './sidebar/DealChat'

interface DealSidebarProps {
  dealId: string
  dealNotes: string | null
  activeTab: string
  onTabChange: (tab: string) => void
  onTptChange?: (tpt: number) => void
}

export function DealSidebar({ dealId, dealNotes, activeTab, onTabChange, onTptChange }: DealSidebarProps) {
  return (
    <div className="flex flex-col h-full border-l bg-background">
      <Tabs value={activeTab} onValueChange={onTabChange} className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-full justify-start shrink-0 bg-muted/50 border-b rounded-none h-auto p-0">
          <TabsTrigger
            value="checklist"
            className="gap-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 py-2.5 text-xs"
          >
            <CheckSquare className="h-3.5 w-3.5" />
            Checklist
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            className="gap-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 py-2.5 text-xs"
          >
            <Activity className="h-3.5 w-3.5" />
            Activity
          </TabsTrigger>
          <TabsTrigger
            value="comments"
            className="gap-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 py-2.5 text-xs"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Comments
          </TabsTrigger>
          <TabsTrigger
            value="notes"
            className="gap-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 py-2.5 text-xs"
          >
            <StickyNote className="h-3.5 w-3.5" />
            Notes
          </TabsTrigger>
          <TabsTrigger
            value="chat"
            className="gap-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 py-2.5 text-xs"
          >
            <MessagesSquare className="h-3.5 w-3.5" />
            Chat
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto min-h-0">
          <TabsContent value="checklist" className="mt-0 h-full">
            <DealChecklist dealId={dealId} onTptChange={onTptChange} />
          </TabsContent>
          <TabsContent value="activity" className="mt-0 h-full">
            <DealActivityFeed dealId={dealId} isVisible={activeTab === 'activity'} />
          </TabsContent>
          <TabsContent value="comments" className="mt-0 h-full">
            <DealComments dealId={dealId} />
          </TabsContent>
          <TabsContent value="notes" forceMount className="mt-0 h-full data-[state=inactive]:hidden">
            <DealNotes dealId={dealId} initialNotes={dealNotes} />
          </TabsContent>
          <TabsContent value="chat" className="mt-0 h-full">
            <DealChat dealId={dealId} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
