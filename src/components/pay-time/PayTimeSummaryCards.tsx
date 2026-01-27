import { DollarSign, Clock, Target, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const metrics = [
  {
    label: 'Total Earned (YTD)',
    value: '$0.00',
    subtitle: 'No deals closed yet',
    icon: DollarSign,
    color: 'text-success',
  },
  {
    label: 'Pending Commissions',
    value: '$0.00',
    subtitle: 'No pending deals',
    icon: Clock,
    color: 'text-warning',
  },
  {
    label: 'Deals Closed (YTD)',
    value: '0',
    subtitle: 'No deals closed yet',
    icon: Target,
    color: 'text-primary',
  },
  {
    label: 'Average Commission',
    value: '$0.00',
    subtitle: 'No data yet',
    icon: TrendingUp,
    color: 'text-muted-foreground',
  },
]

export function PayTimeSummaryCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                <p className="text-xs text-muted-foreground mt-1">
                  {metric.subtitle}
                </p>
              </div>
              <metric.icon className={`h-8 w-8 ${metric.color} opacity-20`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
