import { useState, useEffect, useCallback } from 'react'
import { Loader2, Trash2, UserPlus, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { toast } from 'sonner'
import { useParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import {
  getDealEmployees,
  createDealEmployee,
  deleteDealEmployee,
  getDealVendors,
  createDealVendor,
  deleteDealVendor,
} from '@/lib/dealService'
import { searchContacts } from '@/lib/contactService'
import { getTeamMembersForMentions } from '@/lib/activityLogService'
import { createActivityLog } from '@/lib/activityLogService'
import type { DealEmployeeWithUser, DealVendorWithDetails } from '@/types/deal.types'

interface EmployeeTabProps {
  dealId: string
  onAssignmentChange?: () => void
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(' ')
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase()
  }
  return email[0].toUpperCase()
}

// ============================================================================
// Main Component
// ============================================================================

export function EmployeeTab({ dealId, onAssignmentChange }: EmployeeTabProps) {
  const { teamId } = useParams<{ teamId: string }>()
  const { user } = useAuth()

  const [employees, setEmployees] = useState<DealEmployeeWithUser[]>([])
  const [vendors, setVendors] = useState<DealVendorWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [teamMembers, setTeamMembers] = useState<
    { id: string; full_name: string | null; email: string }[]
  >([])

  // Load data
  useEffect(() => {
    let cancelled = false
    Promise.all([
      getDealEmployees(dealId),
      getDealVendors(dealId),
      teamId ? getTeamMembersForMentions(teamId) : Promise.resolve([]),
    ])
      .then(([emps, vends, members]) => {
        if (!cancelled) {
          setEmployees(emps)
          setVendors(vends)
          setTeamMembers(
            members.map((m) => ({
              id: m.id,
              full_name: m.full_name,
              email: m.email,
            }))
          )
          onAssignmentChange?.()
        }
      })
      .catch((err) => console.error('Error loading employee tab:', err))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [dealId, teamId, onAssignmentChange])

  const refreshEmployees = useCallback(async () => {
    const data = await getDealEmployees(dealId)
    setEmployees(data)
    onAssignmentChange?.()
  }, [dealId, onAssignmentChange])

  const refreshVendors = useCallback(async () => {
    const data = await getDealVendors(dealId)
    setVendors(data)
    onAssignmentChange?.()
  }, [dealId, onAssignmentChange])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Filter out already-assigned team members
  const availableMembers = teamMembers.filter(
    (m) => !employees.some((e) => e.user_id === m.id)
  )

  return (
    <div className="space-y-6">
      {/* Employees Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <UserPlus className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium">Assigned Employees</h3>
          <span className="text-xs text-muted-foreground">({employees.length})</span>
        </div>

        {/* Employee List */}
        {employees.length > 0 && (
          <div className="space-y-1 mb-3">
            {employees.map((emp) => (
              <div
                key={emp.id}
                className="flex items-center gap-3 px-3 py-2 rounded-lg border bg-background hover:bg-muted/30 transition-colors group"
              >
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarFallback className="text-[10px] bg-muted">
                    {getInitials(emp.user.full_name, emp.user.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {emp.user.full_name || emp.user.email}
                  </div>
                  {emp.role && (
                    <div className="text-[10px] text-muted-foreground">{emp.role}</div>
                  )}
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove employee?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Remove {emp.user.full_name || emp.user.email} from this deal.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={async () => {
                          try {
                            await deleteDealEmployee(emp.id)
                            if (teamId && user?.id) {
                              await createActivityLog(
                                {
                                  team_id: teamId,
                                  deal_id: dealId,
                                  entity_type: 'deal',
                                  activity_type: 'updated',
                                  content: `Removed employee: ${emp.user.full_name || emp.user.email}`,
                                },
                                user.id
                              )
                            }
                            await refreshEmployees()
                            toast.success('Employee removed')
                          } catch (err) {
                            console.error(err)
                            toast.error('Failed to remove employee')
                          }
                        }}
                      >
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        )}

        {/* Add Employee Form */}
        <AddEmployeeForm
          dealId={dealId}
          availableMembers={availableMembers}
          onAdded={refreshEmployees}
        />
      </div>

      {/* Separator */}
      <div className="border-t" />

      {/* Vendors Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium">Assigned Vendors</h3>
          <span className="text-xs text-muted-foreground">({vendors.length})</span>
        </div>

        {/* Vendor List */}
        {vendors.length > 0 && (
          <div className="space-y-1 mb-3">
            {vendors.map((vendor) => {
              const displayName = vendor.contact
                ? `${vendor.contact.first_name} ${vendor.contact.last_name || ''}`.trim()
                : vendor.company?.name ?? 'Unknown'

              return (
                <div
                  key={vendor.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg border bg-background hover:bg-muted/30 transition-colors group"
                >
                  <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{displayName}</div>
                    {vendor.role && (
                      <div className="text-[10px] text-muted-foreground">{vendor.role}</div>
                    )}
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove vendor?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Remove {displayName} from this deal.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={async () => {
                            try {
                              await deleteDealVendor(vendor.id)
                              if (teamId && user?.id) {
                                await createActivityLog(
                                  {
                                    team_id: teamId,
                                    deal_id: dealId,
                                    entity_type: 'deal',
                                    activity_type: 'updated',
                                    content: `Removed vendor: ${displayName}`,
                                  },
                                  user.id
                                )
                              }
                              await refreshVendors()
                              toast.success('Vendor removed')
                            } catch (err) {
                              console.error(err)
                              toast.error('Failed to remove vendor')
                            }
                          }}
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )
            })}
          </div>
        )}

        {/* Add Vendor Form */}
        <AddVendorForm
          dealId={dealId}
          onAdded={refreshVendors}
        />
      </div>
    </div>
  )
}

// ============================================================================
// Add Employee Form
// ============================================================================

function AddEmployeeForm({
  dealId,
  availableMembers,
  onAdded,
}: {
  dealId: string
  availableMembers: { id: string; full_name: string | null; email: string }[]
  onAdded: () => Promise<void>
}) {
  const { teamId } = useParams<{ teamId: string }>()
  const { user } = useAuth()

  const [selectedUserId, setSelectedUserId] = useState('')
  const [role, setRole] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const handleAdd = async () => {
    if (!selectedUserId || !teamId || !user?.id) return

    setIsAdding(true)
    try {
      await createDealEmployee({
        deal_id: dealId,
        user_id: selectedUserId,
        role: role.trim() || undefined,
      })

      const member = availableMembers.find((m) => m.id === selectedUserId)
      await createActivityLog(
        {
          team_id: teamId,
          deal_id: dealId,
          entity_type: 'deal',
          activity_type: 'updated',
          content: `Added employee: ${member?.full_name || member?.email || 'Unknown'}${role ? ` as ${role}` : ''}`,
        },
        user.id
      )

      setSelectedUserId('')
      setRole('')
      await onAdded()
      toast.success('Employee added')
    } catch (err) {
      console.error(err)
      toast.error('Failed to add employee')
    } finally {
      setIsAdding(false)
    }
  }

  if (availableMembers.length === 0) {
    return (
      <p className="text-xs text-muted-foreground px-1">
        All team members are already assigned.
      </p>
    )
  }

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1 space-y-1.5">
        <Label className="text-xs text-muted-foreground">Team Member</Label>
        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Select member..." />
          </SelectTrigger>
          <SelectContent>
            {availableMembers.map((m) => (
              <SelectItem key={m.id} value={m.id} className="text-xs">
                {m.full_name || m.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="w-28 space-y-1.5">
        <Label className="text-xs text-muted-foreground">Role</Label>
        <Input
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="Role..."
          className="h-8 text-xs"
        />
      </div>
      <Button
        size="sm"
        onClick={handleAdd}
        disabled={!selectedUserId || isAdding}
        className="h-8 text-xs"
      >
        {isAdding ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Add'}
      </Button>
    </div>
  )
}

// ============================================================================
// Add Vendor Form
// ============================================================================

function AddVendorForm({
  dealId,
  onAdded,
}: {
  dealId: string
  onAdded: () => Promise<void>
}) {
  const { teamId } = useParams<{ teamId: string }>()
  const { user } = useAuth()

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<
    { id: string; first_name: string; last_name: string | null }[]
  >([])
  const [selectedContactId, setSelectedContactId] = useState('')
  const [selectedName, setSelectedName] = useState('')
  const [role, setRole] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim() || !teamId) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const results = await searchContacts(teamId, searchQuery.trim())
        setSearchResults(results)
      } catch (err) {
        console.error(err)
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, teamId])

  const selectContact = (contact: { id: string; first_name: string; last_name: string | null }) => {
    setSelectedContactId(contact.id)
    setSelectedName(`${contact.first_name} ${contact.last_name || ''}`.trim())
    setSearchQuery('')
    setSearchResults([])
  }

  const handleAdd = async () => {
    if (!selectedContactId || !teamId || !user?.id) return

    setIsAdding(true)
    try {
      await createDealVendor({
        deal_id: dealId,
        contact_id: selectedContactId,
        role: role.trim() || undefined,
      })

      await createActivityLog(
        {
          team_id: teamId,
          deal_id: dealId,
          entity_type: 'deal',
          activity_type: 'updated',
          content: `Added vendor: ${selectedName}${role ? ` as ${role}` : ''}`,
        },
        user.id
      )

      setSelectedContactId('')
      setSelectedName('')
      setRole('')
      await onAdded()
      toast.success('Vendor added')
    } catch (err) {
      console.error(err)
      toast.error('Failed to add vendor')
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1.5 relative">
          <Label className="text-xs text-muted-foreground">Contact</Label>
          {selectedContactId ? (
            <div className="flex items-center gap-2 h-8 px-3 rounded-md border bg-muted/30 text-xs">
              <span className="flex-1 truncate">{selectedName}</span>
              <button
                type="button"
                onClick={() => {
                  setSelectedContactId('')
                  setSelectedName('')
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                &times;
              </button>
            </div>
          ) : (
            <>
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search contacts..."
                className="h-8 text-xs"
              />
              {/* Search results dropdown */}
              {(searchResults.length > 0 || isSearching) && (
                <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-popover border rounded-md shadow-md max-h-32 overflow-y-auto">
                  {isSearching ? (
                    <div className="px-3 py-2 text-xs text-muted-foreground">
                      Searching...
                    </div>
                  ) : (
                    searchResults.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted"
                        onClick={() => selectContact(c)}
                      >
                        {c.first_name} {c.last_name || ''}
                      </button>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
        <div className="w-28 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Role</Label>
          <Input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Role..."
            className="h-8 text-xs"
          />
        </div>
        <Button
          size="sm"
          onClick={handleAdd}
          disabled={!selectedContactId || isAdding}
          className="h-8 text-xs"
        >
          {isAdding ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Add'}
        </Button>
      </div>
    </div>
  )
}
