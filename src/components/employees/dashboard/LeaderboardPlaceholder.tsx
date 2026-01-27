import { Trophy } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function LeaderboardPlaceholder() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="h-4 w-4" />
          Employee Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8">
          <Trophy className="h-16 w-16 text-muted-foreground/20 mb-4" />
          <h4 className="text-lg font-semibold text-muted-foreground mb-2">
            Leaderboard Coming Soon
          </h4>
          <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
            Once deals are tracked in the system, employee rankings will appear here
            based on deal count, revenue generated, and commissions earned.
          </p>

          {/* Skeleton rows suggesting future layout */}
          <div className="w-full max-w-sm space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-6 text-sm font-bold text-muted-foreground/40">1</span>
              <div className="h-3 rounded bg-muted flex-1" style={{ width: '90%' }} />
            </div>
            <div className="flex items-center gap-3">
              <span className="w-6 text-sm font-bold text-muted-foreground/40">2</span>
              <div className="h-3 rounded bg-muted flex-1" style={{ width: '70%' }} />
            </div>
            <div className="flex items-center gap-3">
              <span className="w-6 text-sm font-bold text-muted-foreground/40">3</span>
              <div className="h-3 rounded bg-muted flex-1" style={{ width: '50%' }} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
