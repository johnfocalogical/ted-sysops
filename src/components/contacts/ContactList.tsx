import { useEffect, useState, useMemo } from 'react'
import { Search, Loader2, Users } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useContactStore } from '@/hooks/useContactStore'
import { ContactTypeBadge } from './ContactTypeBadge'
import { ContactTypeFilter } from './ContactTypeFilter'
import type { ContactListItem } from '@/types/contact.types'

interface ContactListProps {
  onContactClick: (contactId: string) => void
}

export function ContactList({ onContactClick }: ContactListProps) {
  const {
    contacts,
    loading,
    page,
    pageSize,
    totalPages,
    total,
    search,
    typeFilter,
    contactTypes,
    setPage,
    setSearch,
    setTypeFilter,
    loadContacts,
    loadContactTypes,
  } = useContactStore()

  const [searchInput, setSearchInput] = useState(search)

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) {
        setSearch(searchInput)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput, search, setSearch])

  // Load contact types on mount
  useEffect(() => {
    loadContactTypes()
  }, [loadContactTypes])

  // Format display name
  const formatName = (contact: ContactListItem) => {
    return contact.last_name
      ? `${contact.first_name} ${contact.last_name}`
      : contact.first_name
  }

  // Loading state
  if (loading && contacts.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <ContactTypeFilter
          types={contactTypes}
          selectedTypeIds={typeFilter}
          onSelectionChange={setTypeFilter}
        />
      </div>

      {/* Empty State */}
      {contacts.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          {searchInput || typeFilter.length > 0 ? (
            <>
              <h3 className="font-medium">No contacts found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your search or filters
              </p>
            </>
          ) : (
            <>
              <h3 className="font-medium">No contacts yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Add your first contact to start building your network
              </p>
            </>
          )}
        </div>
      )}

      {/* Contacts Table */}
      {contacts.length > 0 && (
        <>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Types</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Companies</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow
                    key={contact.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onContactClick(contact.id)}
                  >
                    <TableCell className="font-medium">
                      {formatName(contact)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {contact.types.slice(0, 2).map((type) => (
                          <ContactTypeBadge key={type.id} type={type} size="sm" />
                        ))}
                        {contact.types.length > 2 && (
                          <span className="text-xs text-muted-foreground">
                            +{contact.types.length - 2}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {contact.primary_phone || '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {contact.primary_email || '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {contact.company_names.length > 0 ? (
                        <span className="truncate max-w-[200px] block">
                          {contact.company_names.slice(0, 2).join(', ')}
                          {contact.company_names.length > 2 && ` +${contact.company_names.length - 2}`}
                        </span>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * pageSize + 1} to{' '}
                {Math.min(page * pageSize, total)} of {total} contacts
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1 || loading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
