import { PieChart } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function WorkloadPlaceholder() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <PieChart className="h-4 w-4" />
          Workload Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8">
          <PieChart className="h-16 w-16 text-muted-foreground/20 mb-4" />
          <h4 className="text-lg font-semibold text-muted-foreground mb-2">
            Workload View Coming Soon
          </h4>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Workload distribution shows how deals and tasks are allocated
            across team members. This visualization will be available once
            deal tracking is active.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
