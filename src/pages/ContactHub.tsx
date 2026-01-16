import { useState } from 'react'
import { Plus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/PageHeader'

export function ContactHub() {
  const [activeTab, setActiveTab] = useState('all')

  const tabs = [
    { label: 'All Contacts', value: 'all' },
    { label: 'Sellers', value: 'sellers' },
    { label: 'Buyers', value: 'buyers' },
    { label: 'Vendors', value: 'vendors' },
  ]

  return (
    <div>
      <PageHeader
        title="Contact Hub"
        subtitle="Manage sellers, buyers, and vendors"
        actions={
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        }
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-4 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.value
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Empty State */}
      <Card>
        <CardContent className="py-12 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium mb-2">No Contacts Yet</h3>
          <p className="text-muted-foreground mb-4">Add your first contact to build your network</p>
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
