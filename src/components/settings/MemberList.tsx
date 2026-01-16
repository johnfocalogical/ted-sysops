import { useState, useEffect } from 'react'
import { MoreHorizontal, Pencil, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { supabase } from '@/lib/supabase'
import { useTeamContext } from '@/hooks/useTeamContext'
import { useAuth } from '@/hooks/useAuth'
import type { PermissionLevel } from '@/types/team-member.types'
import { cn } from '@/lib/utils'

interface MemberWithDetails {
  id: string
  team_id: string
  user_id: string
  role_id: string | null
  permission_level: PermissionLevel
  created_at: string
  user: {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
  }
  role: {
    id: string
    name: string
  } | null
}

interface MemberListProps {
  onEdit: (member: MemberWithDetails) => void
  onRemove: (member: MemberWithDetails) => void
  refreshTrigger?: number
}

const permissionBadgeStyles: Record<PermissionLevel, string> = {
  admin: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800',
  member: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
  viewer: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
}

export function MemberList({ onEdit, onRemove, refreshTrigger }: MemberListProps) {
  const { context, isAdmin } = useTeamContext()
  const { user } = useAuth()
  const [members, setMembers] = useState<MemberWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  const loadMembers = async () => {
    if (!supabase || !context) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          id,
          team_id,
          user_id,
          role_id,
          permission_level,
          created_at,
          user:users!inner (
            id,
            email,
            full_name,
            avatar_url
          ),
          role:team_roles (
            id,
            name
          )
        `)
        .eq('team_id', context.team.id)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error loading members:', error)
        return
      }

      setMembers(data as unknown as MemberWithDetails[])
    } catch (err) {
      console.error('Error loading members:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMembers()
  }, [context?.team.id, refreshTrigger])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getUserInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  const isCurrentUser = (memberId: string) => {
    return user?.id === memberId
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (members.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No team members found.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Permission</TableHead>
          <TableHead>Joined</TableHead>
          {isAdmin() && <TableHead className="w-[70px]">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => (
          <TableRow
            key={member.id}
            className={cn(
              isCurrentUser(member.user_id) && 'bg-primary/5'
            )}
          >
            <TableCell>
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium text-xs">
                  {getUserInitials(member.user.full_name, member.user.email)}
                </div>
                {/* Name & Email */}
                <div>
                  <div className="font-medium">
                    {member.user.full_name || member.user.email.split('@')[0]}
                    {isCurrentUser(member.user_id) && (
                      <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {member.user.email}
                  </div>
                </div>
              </div>
            </TableCell>
            <TableCell>
              {member.role?.name || (
                <span className="text-muted-foreground">No role</span>
              )}
            </TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={cn('capitalize', permissionBadgeStyles[member.permission_level])}
              >
                {member.permission_level}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDate(member.created_at)}
            </TableCell>
            {isAdmin() && (
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={isCurrentUser(member.user_id)}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(member)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onRemove(member)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export type { MemberWithDetails }
