import { useEffect, useState } from 'react'
import { Search, Loader2, Building2 } from 'lucide-react'
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
import { useCompanyStore } from '@/hooks/useCompanyStore'
import { CompanyTypeBadge } from './CompanyTypeBadge'
import { CompanyTypeFilter } from './CompanyTypeFilter'
import type { CompanyListItem } from '@/types/company.types'

interface CompanyListProps {
  onCompanyClick: (companyId: string) => void
}

export function CompanyList({ onCompanyClick }: CompanyListProps) {
  const {
    companies,
    loading,
    page,
    pageSize,
    totalPages,
    total,
    search,
    typeFilter,
    companyTypes,
    setPage,
    setSearch,
    setTypeFilter,
    loadCompanies,
    loadCompanyTypes,
  } = useCompanyStore()

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

  // Load company types on mount
  useEffect(() => {
    loadCompanyTypes()
  }, [loadCompanyTypes])

  // Format location
  const formatLocation = (company: CompanyListItem) => {
    if (company.city && company.state) {
      return `${company.city}, ${company.state}`
    }
    return company.city || company.state || '—'
  }

  // Loading state
  if (loading && companies.length === 0) {
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
            placeholder="Search companies..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <CompanyTypeFilter
          types={companyTypes}
          selectedTypeIds={typeFilter}
          onSelectionChange={setTypeFilter}
        />
      </div>

      {/* Empty State */}
      {companies.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
          {searchInput || typeFilter.length > 0 ? (
            <>
              <h3 className="font-medium">No companies found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your search or filters
              </p>
            </>
          ) : (
            <>
              <h3 className="font-medium">No companies yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Add your first company to track your vendors and partners
              </p>
            </>
          )}
        </div>
      )}

      {/* Companies Table */}
      {companies.length > 0 && (
        <>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Types</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>POC</TableHead>
                  <TableHead>Phone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow
                    key={company.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onCompanyClick(company.id)}
                  >
                    <TableCell className="font-medium">
                      {company.name}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {company.types.slice(0, 2).map((type) => (
                          <CompanyTypeBadge key={type.id} type={type} size="sm" />
                        ))}
                        {company.types.length > 2 && (
                          <span className="text-xs text-muted-foreground">
                            +{company.types.length - 2}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatLocation(company)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {company.poc_name || '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {company.primary_phone || '—'}
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
                {Math.min(page * pageSize, total)} of {total} companies
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
