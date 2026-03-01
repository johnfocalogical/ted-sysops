import { useNavigate, useParams } from 'react-router-dom'
import { DollarSign, TrendingUp, TrendingDown, Receipt, Coins } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FinancialReference } from '@/types/comms.types'

const TYPE_CONFIG: Record<string, { icon: typeof DollarSign; colorClass: string }> = {
  profit: { icon: TrendingUp, colorClass: 'text-green-600 dark:text-green-400' },
  revenue: { icon: Coins, colorClass: 'text-blue-600 dark:text-blue-400' },
  expense: { icon: TrendingDown, colorClass: 'text-red-600 dark:text-red-400' },
  commission: { icon: Receipt, colorClass: 'text-amber-600 dark:text-amber-400' },
}

interface FinancialReferenceCardProps {
  reference: FinancialReference
}

export function FinancialReferenceCard({ reference }: FinancialReferenceCardProps) {
  const navigate = useNavigate()
  const { orgId, teamId } = useParams<{ orgId: string; teamId: string }>()

  const config = TYPE_CONFIG[reference.type] ?? TYPE_CONFIG.profit
  const Icon = config.icon

  const handleClick = () => {
    if (orgId && teamId) {
      navigate(`/org/${orgId}/team/${teamId}/deals/${reference.deal_id}`)
    }
  }

  const prefix = reference.type === 'expense' ? '-' : '+'

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors text-left"
    >
      <Icon className={cn('h-4 w-4 flex-shrink-0', config.colorClass)} />
      <span className="text-xs text-muted-foreground">{reference.label}</span>
      <span className={cn('text-sm font-semibold tabular-nums', config.colorClass)}>
        {prefix}${Math.abs(reference.amount).toLocaleString()}
      </span>
    </button>
  )
}

interface FinancialReferenceCardsProps {
  references: FinancialReference[]
}

export function FinancialReferenceCards({ references }: FinancialReferenceCardsProps) {
  if (references.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {references.map((ref, i) => (
        <FinancialReferenceCard key={`${ref.deal_id}-${ref.label}-${i}`} reference={ref} />
      ))}
    </div>
  )
}
