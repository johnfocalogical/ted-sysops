import { useState } from 'react'
import { Plus, List, Kanban, Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/PageHeader'

export function Whiteboard() {
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban')

  const metrics = [
    { label: 'For Sale', count: 0, profit: '$0' },
    { label: 'Pending Sale', count: 0, profit: '$0' },
    { label: 'Closed', count: 0, profit: '$0' },
    { label: 'On Hold', count: 0, profit: '$0' },
    { label: 'Canceled', count: 0, profit: '$0' },
  ]

  return (
    <div>
      <PageHeader
        title="Whiteboard"
        subtitle="Manage your deal pipeline"
        actions={
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            New Deal
          </Button>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="pt-4 pb-4">
              <div className="text-sm font-medium text-muted-foreground">{metric.label}</div>
              <div className="mt-1 text-2xl font-bold">{metric.count}</div>
              <div className="text-sm text-success">{metric.profit}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant={viewMode === 'list' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('list')}
        >
          <List className="h-4 w-4 mr-2" />
          List
        </Button>
        <Button
          variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('kanban')}
        >
          <Kanban className="h-4 w-4 mr-2" />
          Kanban
        </Button>
      </div>

      {/* Empty State */}
      <Card>
        <CardContent className="py-12 text-center">
          <Inbox className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium mb-2">No Deals Yet</h3>
          <p className="text-muted-foreground mb-4">Create your first deal to get started</p>
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Create Deal
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
