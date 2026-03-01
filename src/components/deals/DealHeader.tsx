import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  Trash2,
  Loader2,
  User,
  Users,
  Building2,
  MessageSquare,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type {
  DealWithDetails,
  DealStatus,
  DealType,
  DealEmployeeWithUser,
  DealVendorWithDetails,
} from '@/types/deal.types'
import {
  DEAL_STATUS_LABELS,
  DEAL_TYPE_LABELS,
} from '@/types/deal.types'
import * as commsService from '@/lib/commsService'
import { useAuth } from '@/hooks/useAuth'
import { useTeamContext } from '@/hooks/useTeamContext'
import { toast } from 'sonner'

// Status badge color map (Space Force themed)
const STATUS_COLORS: Record<DealStatus, string> = {
  active:
    'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400 border border-teal-300 dark:border-teal-700',
  for_sale:
    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-300 dark:border-blue-700',
  pending_sale:
    'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-300 dark:border-amber-700',
  closed:
    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-300 dark:border-green-700',
  funded:
    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-300 dark:border-green-700',
  on_hold:
    'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border border-gray-300 dark:border-gray-700',
  canceled:
    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-300 dark:border-red-700',
}

// Deal type badge colors
const DEAL_TYPE_COLORS: Record<DealType, string> = {
  wholesale:
    'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-300 dark:border-purple-700',
  listing:
    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-300 dark:border-blue-700',
  novation:
    'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-300 dark:border-amber-700',
  purchase:
    'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400 border border-teal-300 dark:border-teal-700',
}

// Statuses that need confirmation before changing to
const CONFIRM_STATUSES: DealStatus[] = ['canceled', 'closed']

interface TeamMember {
  id: string
  full_name: string | null
  email: string
}

interface DealHeaderProps {
  deal: DealWithDetails
  teamMembers: TeamMember[]
  isDirty: boolean
  isSaving: boolean
  tptProgress?: number
  employees?: DealEmployeeWithUser[]
  vendors?: DealVendorWithDetails[]
  onStatusChange: (status: DealStatus) => void
  onOwnerChange: (ownerId: string) => void
  onSave: () => void
  onDelete: () => void
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

function getVendorDisplayName(vendor: DealVendorWithDetails): string {
  if (vendor.contact) {
    return `${vendor.contact.first_name} ${vendor.contact.last_name || ''}`.trim()
  }
  return vendor.company?.name ?? 'Unknown'
}

export function DealHeader({
  deal,
  teamMembers,
  isDirty,
  isSaving,
  tptProgress = 0,
  employees = [],
  vendors = [],
  onStatusChange,
  onOwnerChange,
  onSave,
  onDelete,
}: DealHeaderProps) {
  const { orgId, teamId } = useParams<{ orgId: string; teamId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { hasFullAccess } = useTeamContext()
  const [pendingStatus, setPendingStatus] = useState<DealStatus | null>(null)
  const [openingChat, setOpeningChat] = useState(false)
  const canComms = hasFullAccess('comms')

  const handleOpenChat = async () => {
    if (!teamId || !user?.id) return
    setOpeningChat(true)
    try {
      const conv = await commsService.getDealChatConversation(deal.id, teamId, user.id)
      navigate(`/org/${orgId}/team/${teamId}/comms/${conv.id}`)
    } catch (err) {
      console.error('Failed to open deal chat:', err)
      toast.error('Failed to open conversation')
    } finally {
      setOpeningChat(false)
    }
  }

  const handleStatusChange = (value: string) => {
    const newStatus = value as DealStatus
    if (CONFIRM_STATUSES.includes(newStatus)) {
      setPendingStatus(newStatus)
    } else {
      onStatusChange(newStatus)
    }
  }

  const confirmStatusChange = () => {
    if (pendingStatus) {
      onStatusChange(pendingStatus)
      setPendingStatus(null)
    }
  }

  // Seller display name
  const sellerName = deal.seller_contact
    ? `${deal.seller_contact.first_name}${deal.seller_contact.last_name ? ` ${deal.seller_contact.last_name}` : ''}`
    : null

  return (
    <TooltipProvider>
      <div className="shrink-0 border-b bg-background">
        {/* Top row: Back button + address + actions */}
        <div className="flex items-center gap-4 px-6 py-3">
          {/* Back button */}
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/org/${orgId}/team/${teamId}/whiteboard`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Whiteboard
            </Link>
          </Button>

          {/* Address (large text) */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">
              {deal.address}
              {deal.city && (
                <span className="text-muted-foreground font-normal text-base ml-2">
                  {deal.city}
                  {deal.state && `, ${deal.state}`}
                  {deal.zip && ` ${deal.zip}`}
                </span>
              )}
            </h1>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              className="bg-primary hover:bg-primary/90"
              size="sm"
              onClick={onSave}
              disabled={!isDirty || isSaving}
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {isSaving ? 'Saving...' : 'Save'}
              {isDirty && !isSaving && (
                <span className="ml-1.5 h-2 w-2 rounded-full bg-amber-400 inline-block" />
              )}
            </Button>

            {canComms && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenChat}
                    disabled={openingChat}
                  >
                    {openingChat ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MessageSquare className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Open Deal Chat</TooltipContent>
              </Tooltip>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Deal</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this deal? This action cannot be undone.
                    The deal at <strong>{deal.address}</strong> will be permanently removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Deal
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Bottom row: Status, Owner, Type, Seller, Badges, TPT */}
        <div className="flex items-center gap-4 px-6 pb-3 flex-wrap">
          {/* Status Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Status
            </span>
            <Select value={deal.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="h-8 w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(DEAL_STATUS_LABELS) as [DealStatus, string][]).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center gap-2">
                        <Badge className={`${STATUS_COLORS[value]} text-xs px-1.5 py-0`}>
                          {label}
                        </Badge>
                      </div>
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Owner Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Owner
            </span>
            <Select value={deal.owner_id} onValueChange={onOwnerChange}>
              <SelectTrigger className="h-8 w-[180px]">
                <SelectValue placeholder="Select owner" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.full_name || member.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Deal Type Badge */}
          <Badge className={DEAL_TYPE_COLORS[deal.deal_type]}>
            {DEAL_TYPE_LABELS[deal.deal_type]}
          </Badge>

          {/* TPT Progress Bar */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              TPT
            </span>
            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${tptProgress}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">{Math.round(tptProgress)}%</span>
          </div>

          {/* Separator */}
          <div className="h-5 w-px bg-border" />

          {/* Seller Name (clickable) */}
          {sellerName ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to={`/org/${orgId}/team/${teamId}/contacts/${deal.seller_contact_id}`}
                  className="flex items-center gap-1.5 text-sm hover:text-primary transition-colors"
                >
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{sellerName}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent>View seller contact</TooltipContent>
            </Tooltip>
          ) : (
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              No seller
            </span>
          )}

          {/* Employees */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                {employees.length > 0 ? (
                  <>
                    <div className="flex -space-x-1.5">
                      {employees.slice(0, 3).map((emp) => (
                        <Avatar key={emp.id} className="h-5 w-5 border-2 border-background">
                          <AvatarFallback className="text-[8px] bg-muted">
                            {getInitials(emp.user.full_name, emp.user.email)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    {employees.length > 3 && (
                      <span className="text-xs">+{employees.length - 3}</span>
                    )}
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4" />
                    <span>0 employees</span>
                  </>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {employees.length > 0 ? (
                <div className="space-y-0.5">
                  {employees.map((emp) => (
                    <div key={emp.id} className="text-xs">
                      {emp.user.full_name || emp.user.email}
                      {emp.role && <span className="text-muted-foreground"> — {emp.role}</span>}
                    </div>
                  ))}
                </div>
              ) : (
                'No employees assigned'
              )}
            </TooltipContent>
          </Tooltip>

          {/* Vendors */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>{vendors.length} vendor{vendors.length !== 1 ? 's' : ''}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {vendors.length > 0 ? (
                <div className="space-y-0.5">
                  {vendors.map((v) => (
                    <div key={v.id} className="text-xs">
                      {getVendorDisplayName(v)}
                      {v.role && <span className="text-muted-foreground"> — {v.role}</span>}
                    </div>
                  ))}
                </div>
              ) : (
                'No vendors assigned'
              )}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Status confirmation dialog */}
        <AlertDialog
          open={pendingStatus !== null}
          onOpenChange={(open) => {
            if (!open) setPendingStatus(null)
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Change Deal Status</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to change this deal's status to{' '}
                <strong>
                  {pendingStatus ? DEAL_STATUS_LABELS[pendingStatus] : ''}
                </strong>
                ? This is a significant status change.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmStatusChange}>
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  )
}
