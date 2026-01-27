import { useState, useEffect } from 'react'
import { Building2, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getTeamDepartments } from '@/lib/departmentService'
import type { DepartmentWithUsage } from '@/types/employee.types'

interface DepartmentBreakdownProps {
  teamId: string
  totalEmployees: number
  selectedDepartmentId?: string | null
}

export function DepartmentBreakdown({
  teamId,
  totalEmployees,
  selectedDepartmentId,
}: DepartmentBreakdownProps) {
  const [departments, setDepartments] = useState<DepartmentWithUsage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const data = await getTeamDepartments(teamId)
        setDepartments(data)
      } catch (err) {
        console.error('Error loading department breakdown:', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [teamId])

  const assignedCount = departments.reduce((sum, d) => sum + d.usage_count, 0)
  const unassignedCount = Math.max(0, totalEmployees - assignedCount)

  // Filter if a department is selected
  const displayDepts = selectedDepartmentId
    ? departments.filter((d) => d.id === selectedDepartmentId)
    : departments

  const maxCount = Math.max(...departments.map((d) => d.usage_count), unassignedCount, 1)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Department Metrics
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : departments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No departments configured
          </p>
        ) : (
          <div className="space-y-3">
            {displayDepts.map((dept) => {
              const pct = totalEmployees > 0
                ? Math.round((dept.usage_count / totalEmployees) * 100)
                : 0
              const barWidth = maxCount > 0
                ? Math.round((dept.usage_count / maxCount) * 100)
                : 0

              return (
                <div key={dept.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block w-2 h-2 rounded-full"
                        style={{ backgroundColor: dept.color || 'hsl(var(--primary))' }}
                      />
                      <span className="font-medium">{dept.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span>{dept.usage_count} employees</span>
                      <span className="w-10 text-right">{pct}%</span>
                      <span className="w-16 text-right text-xs italic">—</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-primary/10">
                    <div
                      className="h-2 rounded-full bg-primary transition-all"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              )
            })}

            {/* Unassigned row */}
            {!selectedDepartmentId && unassignedCount > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-muted-foreground/40" />
                    <span className="font-medium text-muted-foreground">Unassigned</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span>{unassignedCount} employees</span>
                    <span className="w-10 text-right">
                      {totalEmployees > 0 ? Math.round((unassignedCount / totalEmployees) * 100) : 0}%
                    </span>
                    <span className="w-16 text-right text-xs italic">—</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-muted-foreground/10">
                  <div
                    className="h-2 rounded-full bg-muted-foreground/40 transition-all"
                    style={{ width: `${maxCount > 0 ? Math.round((unassignedCount / maxCount) * 100) : 0}%` }}
                  />
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground italic pt-2">
              Revenue and commission data available after deal integration
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
