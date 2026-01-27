import { GitCompareArrows } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function EmployeeComparisonPlaceholder() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <GitCompareArrows className="h-4 w-4" />
          Employee Comparison
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8">
          <GitCompareArrows className="h-16 w-16 text-muted-foreground/20 mb-4" />
          <h4 className="text-lg font-semibold text-muted-foreground mb-2">
            Comparison Coming Soon
          </h4>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Compare employee performance metrics side-by-side.
            This feature requires deal data to generate meaningful comparisons.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
