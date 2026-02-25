import { useState, useEffect } from 'react'
import { Zap, Search, Loader2, Workflow } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { getPublishedAutomators } from '@/lib/automatorInstanceService'

interface PublishedAutomator {
  id: string
  name: string
  description: string | null
  node_count: number
}

interface StartAutomatorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teamId: string
  onStart: (automatorId: string) => void
  isStarting: boolean
}

export function StartAutomatorDialog({
  open,
  onOpenChange,
  teamId,
  onStart,
  isStarting,
}: StartAutomatorDialogProps) {
  const [automators, setAutomators] = useState<PublishedAutomator[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setSearch('')
      setSelectedId(null)
      return
    }

    const load = async () => {
      setLoading(true)
      try {
        const data = await getPublishedAutomators(teamId)
        setAutomators(data)
      } catch (err) {
        console.error('Error loading published automators:', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [open, teamId])

  const filtered = automators.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-accent" />
            Start Automator
          </DialogTitle>
          <DialogDescription>
            Select a published automator to run on this deal.
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        {automators.length > 5 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search automators..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        )}

        {/* Automator List */}
        <div className="max-h-[300px] overflow-y-auto space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              {automators.length === 0
                ? 'No published automators available.'
                : 'No automators match your search.'}
            </div>
          ) : (
            filtered.map((automator) => (
              <button
                key={automator.id}
                type="button"
                onClick={() => setSelectedId(automator.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedId === automator.id
                    ? 'border-accent bg-accent/10'
                    : 'border-border hover:border-accent/50 hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Workflow className="h-4 w-4 text-accent" />
                    <span className="font-medium text-sm">
                      {automator.name}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-xs"
                  >
                    {automator.node_count} steps
                  </Badge>
                </div>
                {automator.description && (
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2 pl-6">
                    {automator.description}
                  </p>
                )}
              </button>
            ))
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isStarting}
          >
            Cancel
          </Button>
          <Button
            className="bg-accent hover:bg-accent/90"
            onClick={() => selectedId && onStart(selectedId)}
            disabled={!selectedId || isStarting}
          >
            {isStarting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Start
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
