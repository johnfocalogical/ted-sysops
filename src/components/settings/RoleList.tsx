import { MoreHorizontal, Pencil, Trash2, Users } from 'lucide-react'
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { RoleWithMemberCount } from '@/lib/roleService'
import { cn } from '@/lib/utils'

interface RoleListProps {
  roles: RoleWithMemberCount[]
  onEdit: (role: RoleWithMemberCount) => void
  onDelete: (role: RoleWithMemberCount) => void
}

export function RoleList({ roles, onEdit, onDelete }: RoleListProps) {
  if (roles.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No roles found. Create a custom role to get started.
      </div>
    )
  }

  // Separate default and custom roles
  const defaultRoles = roles.filter((r) => r.is_default)
  const customRoles = roles.filter((r) => !r.is_default)

  return (
    <TooltipProvider>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Role Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Members</TableHead>
            <TableHead className="w-[70px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Default roles first */}
          {defaultRoles.map((role) => (
            <RoleRow
              key={role.id}
              role={role}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}

          {/* Custom roles */}
          {customRoles.map((role) => (
            <RoleRow
              key={role.id}
              role={role}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </TableBody>
      </Table>
    </TooltipProvider>
  )
}

interface RoleRowProps {
  role: RoleWithMemberCount
  onEdit: (role: RoleWithMemberCount) => void
  onDelete: (role: RoleWithMemberCount) => void
}

function RoleRow({ role, onEdit, onDelete }: RoleRowProps) {
  const canEdit = true
  const canDelete = role.member_count === 0

  return (
    <TableRow>
      {/* Name & Description */}
      <TableCell>
        <div>
          <div className="font-medium">{role.name}</div>
          {role.description && (
            <div className="text-sm text-muted-foreground line-clamp-1">
              {role.description}
            </div>
          )}
        </div>
      </TableCell>

      {/* Type Badge */}
      <TableCell>
        <Badge
          variant="outline"
          className={cn(
            role.is_default
              ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
              : 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800'
          )}
        >
          {role.is_default ? 'Default' : 'Custom'}
        </Badge>
      </TableCell>

      {/* Member Count */}
      <TableCell>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{role.member_count}</span>
        </div>
      </TableCell>

      {/* Actions */}
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(role)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>

            {canDelete ? (
              <DropdownMenuItem
                onClick={() => onDelete(role)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuItem disabled className="text-muted-foreground">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Reassign {role.member_count} member{role.member_count > 1 ? 's' : ''} first</p>
                </TooltipContent>
              </Tooltip>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}
