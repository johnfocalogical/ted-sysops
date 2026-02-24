import { useState, useEffect, useCallback } from 'react'
import { Calendar, Clock, Loader2, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { useParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import {
  getDealShowings,
  createDealShowing,
  deleteDealShowing,
} from '@/lib/dealService'
import { searchContacts } from '@/lib/contactService'
import { createActivityLog } from '@/lib/activityLogService'
import type { DealShowingWithContacts } from '@/types/deal.types'

interface ShowingsListProps {
  dealId: string
}

function formatContactName(contact: { first_name: string; last_name: string | null } | null | undefined): string {
  if (!contact) return '—'
  return `${contact.first_name} ${contact.last_name || ''}`.trim()
}

function formatDateTime(datetime: string): { date: string; time: string } {
  const d = new Date(datetime)
  return {
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  }
}

// ============================================================================
// Main Component
// ============================================================================

export function ShowingsList({ dealId }: ShowingsListProps) {
  const { teamId } = useParams<{ teamId: string }>()
  const { user } = useAuth()

  const [showings, setShowings] = useState<DealShowingWithContacts[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    getDealShowings(dealId)
      .then((data) => {
        if (!cancelled) setShowings(data)
      })
      .catch((err) => console.error('Error loading showings:', err))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [dealId, refreshKey])

  const refreshShowings = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  const handleDelete = async (showing: DealShowingWithContacts) => {
    try {
      await deleteDealShowing(showing.id)

      if (teamId && user?.id) {
        const buyerName = formatContactName(showing.buyer_contact)
        await createActivityLog(
          {
            team_id: teamId,
            deal_id: dealId,
            entity_type: 'deal',
            activity_type: 'updated',
            content: `Deleted showing${buyerName !== '—' ? ` for ${buyerName}` : ''}`,
          },
          user.id
        )
      }

      refreshShowings()
      toast.success('Showing deleted')
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete showing')
    }
  }

  const handleAdded = () => {
    setAddOpen(false)
    refreshShowings()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium">Showings</h3>
          <span className="text-xs text-muted-foreground">({showings.length})</span>
        </div>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8 text-xs gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Add Showing
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Schedule Showing</DialogTitle>
            </DialogHeader>
            <AddShowingForm dealId={dealId} onAdded={handleAdded} />
          </DialogContent>
        </Dialog>
      </div>

      {showings.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          No showings scheduled yet.
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Date/Time</TableHead>
                <TableHead className="text-xs">Buyer</TableHead>
                <TableHead className="text-xs">Vendor/Runner</TableHead>
                <TableHead className="text-xs text-center">Buffer</TableHead>
                <TableHead className="text-xs">Notes</TableHead>
                <TableHead className="text-xs w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {showings.map((showing) => {
                const { date, time } = formatDateTime(showing.showing_datetime)
                return (
                  <TableRow key={showing.id}>
                    <TableCell className="text-sm">
                      <div className="font-medium">{date}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {time}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatContactName(showing.buyer_contact)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatContactName(showing.vendor_contact)}
                    </TableCell>
                    <TableCell className="text-sm text-center tabular-nums">
                      {showing.buffer_minutes > 0 ? `${showing.buffer_minutes}m` : '—'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                      {showing.notes || '—'}
                    </TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete showing?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove this showing.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => handleDelete(showing)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Add Showing Form (rendered inside Dialog)
// ============================================================================

function AddShowingForm({
  dealId,
  onAdded,
}: {
  dealId: string
  onAdded: () => void
}) {
  const { teamId } = useParams<{ teamId: string }>()
  const { user } = useAuth()

  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [bufferMinutes, setBufferMinutes] = useState('15')
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Buyer contact search
  const [buyerQuery, setBuyerQuery] = useState('')
  const [buyerResults, setBuyerResults] = useState<{ id: string; first_name: string; last_name: string | null }[]>([])
  const [buyerSearching, setBuyerSearching] = useState(false)
  const [selectedBuyer, setSelectedBuyer] = useState<{ id: string; name: string } | null>(null)

  // Vendor contact search
  const [vendorQuery, setVendorQuery] = useState('')
  const [vendorResults, setVendorResults] = useState<{ id: string; first_name: string; last_name: string | null }[]>([])
  const [vendorSearching, setVendorSearching] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<{ id: string; name: string } | null>(null)

  // Debounced buyer search
  useEffect(() => {
    if (!buyerQuery.trim() || !teamId) {
      setBuyerResults([])
      return
    }
    const timer = setTimeout(async () => {
      setBuyerSearching(true)
      try {
        const results = await searchContacts(teamId, buyerQuery.trim())
        setBuyerResults(results)
      } catch (err) {
        console.error(err)
      } finally {
        setBuyerSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [buyerQuery, teamId])

  // Debounced vendor search
  useEffect(() => {
    if (!vendorQuery.trim() || !teamId) {
      setVendorResults([])
      return
    }
    const timer = setTimeout(async () => {
      setVendorSearching(true)
      try {
        const results = await searchContacts(teamId, vendorQuery.trim())
        setVendorResults(results)
      } catch (err) {
        console.error(err)
      } finally {
        setVendorSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [vendorQuery, teamId])

  const handleSubmit = async () => {
    if (!date || !time || !teamId || !user?.id) return

    setIsSaving(true)
    try {
      const showingDatetime = new Date(`${date}T${time}`).toISOString()
      const buffer = parseInt(bufferMinutes, 10) || 0

      await createDealShowing(
        {
          deal_id: dealId,
          showing_datetime: showingDatetime,
          buffer_minutes: buffer,
          buyer_contact_id: selectedBuyer?.id,
          vendor_contact_id: selectedVendor?.id,
          notes: notes.trim() || undefined,
        },
        user.id
      )

      await createActivityLog(
        {
          team_id: teamId,
          deal_id: dealId,
          entity_type: 'deal',
          activity_type: 'created',
          content: `Scheduled showing on ${new Date(`${date}T${time}`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${new Date(`${date}T${time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}${selectedBuyer ? ` for ${selectedBuyer.name}` : ''}`,
        },
        user.id
      )

      toast.success('Showing scheduled')
      onAdded()
    } catch (err) {
      console.error(err)
      toast.error('Failed to schedule showing')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Date and Time */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Date *</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Time *</Label>
          <Input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="h-9"
          />
        </div>
      </div>

      {/* Buyer Contact Search */}
      <div className="space-y-1.5 relative">
        <Label className="text-xs text-muted-foreground">Buyer</Label>
        {selectedBuyer ? (
          <div className="flex items-center gap-2 h-9 px-3 rounded-md border bg-muted/30 text-sm">
            <span className="flex-1 truncate">{selectedBuyer.name}</span>
            <button
              type="button"
              onClick={() => setSelectedBuyer(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              &times;
            </button>
          </div>
        ) : (
          <>
            <Input
              value={buyerQuery}
              onChange={(e) => setBuyerQuery(e.target.value)}
              placeholder="Search buyer contacts..."
              className="h-9"
            />
            {(buyerResults.length > 0 || buyerSearching) && (
              <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-popover border rounded-md shadow-md max-h-32 overflow-y-auto">
                {buyerSearching ? (
                  <div className="px-3 py-2 text-xs text-muted-foreground">Searching...</div>
                ) : (
                  buyerResults.map((c) => {
                    const name = `${c.first_name} ${c.last_name || ''}`.trim()
                    return (
                      <button
                        key={c.id}
                        type="button"
                        className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted"
                        onClick={() => {
                          setSelectedBuyer({ id: c.id, name })
                          setBuyerQuery('')
                          setBuyerResults([])
                        }}
                      >
                        {name}
                      </button>
                    )
                  })
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Vendor/Runner Contact Search */}
      <div className="space-y-1.5 relative">
        <Label className="text-xs text-muted-foreground">Vendor / Runner</Label>
        {selectedVendor ? (
          <div className="flex items-center gap-2 h-9 px-3 rounded-md border bg-muted/30 text-sm">
            <span className="flex-1 truncate">{selectedVendor.name}</span>
            <button
              type="button"
              onClick={() => setSelectedVendor(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              &times;
            </button>
          </div>
        ) : (
          <>
            <Input
              value={vendorQuery}
              onChange={(e) => setVendorQuery(e.target.value)}
              placeholder="Search vendor contacts..."
              className="h-9"
            />
            {(vendorResults.length > 0 || vendorSearching) && (
              <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-popover border rounded-md shadow-md max-h-32 overflow-y-auto">
                {vendorSearching ? (
                  <div className="px-3 py-2 text-xs text-muted-foreground">Searching...</div>
                ) : (
                  vendorResults.map((c) => {
                    const name = `${c.first_name} ${c.last_name || ''}`.trim()
                    return (
                      <button
                        key={c.id}
                        type="button"
                        className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted"
                        onClick={() => {
                          setSelectedVendor({ id: c.id, name })
                          setVendorQuery('')
                          setVendorResults([])
                        }}
                      >
                        {name}
                      </button>
                    )
                  })
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Buffer Minutes */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Buffer (minutes)</Label>
        <Input
          type="number"
          min="0"
          value={bufferMinutes}
          onChange={(e) => setBufferMinutes(e.target.value)}
          placeholder="15"
          className="h-9 w-32"
        />
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Notes</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes about this showing..."
          className="min-h-[60px] resize-none"
        />
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={!date || !time || isSaving}
          className="bg-primary hover:bg-primary/90"
        >
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Calendar className="mr-2 h-4 w-4" />
          )}
          {isSaving ? 'Scheduling...' : 'Schedule Showing'}
        </Button>
      </div>
    </div>
  )
}
