import { LayoutDashboard, TrendingUp, Clock, CheckSquare } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/PageHeader'

export function MyDashboard() {
  const metrics = [
    { label: 'Active Deals', value: '0', icon: LayoutDashboard, color: 'text-primary' },
    { label: 'Total Profit', value: '$0', icon: TrendingUp, color: 'text-success' },
    { label: 'Pending Actions', value: '0', icon: Clock, color: 'text-warning' },
    { label: 'Completed', value: '0', icon: CheckSquare, color: 'text-muted-foreground' },
  ]

  return (
    <div>
      <PageHeader
        title="My Dashboard"
        subtitle="Your personal overview and metrics"
      />

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map((metric) => (
          <Card key={metric.label} className="border-l-4 border-l-primary">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {metric.label}
                  </p>
                  <p className={`text-3xl font-bold mt-1 ${metric.color}`}>
                    {metric.value}
                  </p>
                </div>
                <metric.icon className={`h-8 w-8 ${metric.color} opacity-20`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activity Section */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="text-center py-8 text-muted-foreground">
            <p>No recent activity to display.</p>
            <p className="text-sm mt-1">Start by adding a deal on the Whiteboard.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
