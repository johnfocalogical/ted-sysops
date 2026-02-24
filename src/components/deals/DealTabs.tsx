import {
  FileText,
  PlayCircle,
  Users,
  Megaphone,
  DollarSign,
  ClipboardList,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DealInfoTab } from './DealInfoTab'
import { EmployeeTab } from './tabs/EmployeeTab'
import { DispoTab } from './tabs/DispoTab'
import { FinancialTab } from './tabs/FinancialTab'
import type { DealWithDetails } from '@/types/deal.types'

interface DealTabsProps {
  deal?: DealWithDetails
  activeTab: string
  onTabChange: (tab: string) => void
  onDealUpdated?: (deal: DealWithDetails) => void
  onAssignmentChange?: () => void
  onBuyerChange?: (contactId: string | null) => void
}

function PlaceholderTab({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 text-muted-foreground/30">
        <ClipboardList className="h-12 w-12" />
      </div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md">{description}</p>
    </div>
  )
}

export function DealTabs({ deal, activeTab, onTabChange, onDealUpdated, onAssignmentChange, onBuyerChange }: DealTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="flex-1 flex flex-col min-h-0">
      <TabsList className="w-full justify-start shrink-0 bg-muted/50 border-b rounded-none h-auto p-0">
        <TabsTrigger
          value="deal-info"
          className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5"
        >
          <FileText className="h-4 w-4" />
          Deal Info
        </TabsTrigger>
        <TabsTrigger
          value="action"
          className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5"
        >
          <PlayCircle className="h-4 w-4" />
          Action
        </TabsTrigger>
        <TabsTrigger
          value="employee"
          className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5"
        >
          <Users className="h-4 w-4" />
          Employee
        </TabsTrigger>
        <TabsTrigger
          value="dispo"
          className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5"
        >
          <Megaphone className="h-4 w-4" />
          Dispo
        </TabsTrigger>
        <TabsTrigger
          value="financial"
          className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5"
        >
          <DollarSign className="h-4 w-4" />
          Financial
        </TabsTrigger>
        <TabsTrigger
          value="intake"
          className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5"
        >
          <ClipboardList className="h-4 w-4" />
          Intake
        </TabsTrigger>
      </TabsList>

      <div className="flex-1 overflow-y-auto p-4">
        <TabsContent value="deal-info" className="mt-0">
          {deal && onDealUpdated ? (
            <DealInfoTab deal={deal} onDealUpdated={onDealUpdated} />
          ) : (
            <PlaceholderTab
              title="Deal Info"
              description="Loading deal data..."
            />
          )}
        </TabsContent>
        <TabsContent value="action" className="mt-0">
          <PlaceholderTab
            title="Action"
            description="Automator execution, deal actions, and process management coming in Epic 4."
          />
        </TabsContent>
        <TabsContent value="employee" className="mt-0">
          {deal ? (
            <EmployeeTab dealId={deal.id} onAssignmentChange={onAssignmentChange} />
          ) : (
            <PlaceholderTab
              title="Employee"
              description="Loading deal data..."
            />
          )}
        </TabsContent>
        <TabsContent value="dispo" className="mt-0">
          {deal && onBuyerChange ? (
            <DispoTab deal={deal} onBuyerChange={onBuyerChange} />
          ) : (
            <PlaceholderTab
              title="Disposition"
              description="Loading deal data..."
            />
          )}
        </TabsContent>
        <TabsContent value="financial" className="mt-0">
          {deal ? (
            <FinancialTab deal={deal} />
          ) : (
            <PlaceholderTab
              title="Financial"
              description="Loading deal data..."
            />
          )}
        </TabsContent>
        <TabsContent value="intake" className="mt-0">
          <PlaceholderTab
            title="Intake"
            description="Lead intake form and initial deal data capture coming in a future epic."
          />
        </TabsContent>
      </div>
    </Tabs>
  )
}
