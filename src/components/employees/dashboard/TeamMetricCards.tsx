import { Users, DollarSign, Clock, BarChart3, TrendingUp, Calculator } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface TeamMetricCardsProps {
  totalMembers: number
  activeMembers: number
  loading: boolean
}

export function TeamMetricCards({ totalMembers, activeMembers, loading }: TeamMetricCardsProps) {
  const metrics = [
    {
      label: 'Total Team Members',
      value: loading ? '—' : String(totalMembers),
      subtitle: loading ? 'Loading...' : `${activeMembers} active`,
      icon: Users,
      borderColor: 'border-l-primary',
      valueColor: 'text-foreground',
    },
    {
      label: 'Commissions Paid (YTD)',
      value: '$0',
      subtitle: 'Awaiting deal integration',
      icon: DollarSign,
      borderColor: 'border-l-green-500',
      valueColor: 'text-muted-foreground',
    },
    {
      label: 'Pending Commission Liability',
      value: '$0',
      subtitle: 'Awaiting deal integration',
      icon: Clock,
      borderColor: 'border-l-amber-500',
      valueColor: 'text-muted-foreground',
    },
    {
      label: 'Avg Deals per Employee',
      value: '0',
      subtitle: 'Awaiting deal integration',
      icon: BarChart3,
      borderColor: 'border-l-primary',
      valueColor: 'text-muted-foreground',
    },
    {
      label: 'Revenue Generated (YTD)',
      value: '$0',
      subtitle: 'Awaiting deal integration',
      icon: TrendingUp,
      borderColor: 'border-l-green-500',
      valueColor: 'text-muted-foreground',
    },
    {
      label: 'Avg Commission per Deal',
      value: '$0',
      subtitle: 'Awaiting deal integration',
      icon: Calculator,
      borderColor: 'border-l-purple-500',
      valueColor: 'text-muted-foreground',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {metrics.map((metric) => (
        <Card key={metric.label} className={`border-l-4 ${metric.borderColor}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {metric.label}
                </p>
                <p className={`text-3xl font-bold mt-1 ${metric.valueColor}`}>
                  {metric.value}
                </p>
                <p className="text-xs text-muted-foreground mt-1 italic">
                  {metric.subtitle}
                </p>
              </div>
              <metric.icon className={`h-8 w-8 ${metric.valueColor} opacity-20`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
