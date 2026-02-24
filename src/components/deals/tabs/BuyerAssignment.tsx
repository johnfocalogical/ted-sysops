import { useState, useEffect } from 'react'
import { UserCheck } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useParams } from 'react-router-dom'
import { searchCompanies, getCompanyContacts } from '@/lib/companyService'

interface BuyerAssignmentProps {
  currentBuyerContactId: string | null
  currentBuyerName: string | null
  onBuyerChange: (contactId: string | null) => void
}

interface CompanyResult {
  id: string
  name: string
  city: string | null
  state: string | null
}

interface CompanyContact {
  link_id: string
  contact_id: string
  first_name: string
  last_name: string | null
  role_title: string | null
  is_primary: boolean
  is_poc: boolean
}

export function BuyerAssignment({
  currentBuyerContactId,
  currentBuyerName,
  onBuyerChange,
}: BuyerAssignmentProps) {
  const { teamId } = useParams<{ teamId: string }>()

  // Company search
  const [companyQuery, setCompanyQuery] = useState('')
  const [companyResults, setCompanyResults] = useState<CompanyResult[]>([])
  const [companySearching, setCompanySearching] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<{ id: string; name: string } | null>(null)

  // Company contacts
  const [companyContacts, setCompanyContacts] = useState<CompanyContact[]>([])
  const [contactsLoading, setContactsLoading] = useState(false)

  // Debounced company search
  useEffect(() => {
    if (!companyQuery.trim() || !teamId) {
      setCompanyResults([])
      return
    }
    const timer = setTimeout(async () => {
      setCompanySearching(true)
      try {
        const results = await searchCompanies(teamId, companyQuery.trim())
        setCompanyResults(results)
      } catch (err) {
        console.error(err)
      } finally {
        setCompanySearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [companyQuery, teamId])

  // Load contacts when company is selected
  useEffect(() => {
    if (!selectedCompany) {
      setCompanyContacts([])
      return
    }
    let cancelled = false
    setContactsLoading(true)
    getCompanyContacts(selectedCompany.id)
      .then((data) => {
        if (!cancelled) setCompanyContacts(data)
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (!cancelled) setContactsLoading(false)
      })
    return () => { cancelled = true }
  }, [selectedCompany])

  const handleCompanySelect = (company: CompanyResult) => {
    setSelectedCompany({ id: company.id, name: company.name })
    setCompanyQuery('')
    setCompanyResults([])
  }

  const handleContactSelect = (contactId: string) => {
    if (contactId === '__clear__') {
      onBuyerChange(null)
    } else {
      onBuyerChange(contactId)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <UserCheck className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium">Buyer Information</h3>
      </div>

      {/* Current Buyer Display */}
      {currentBuyerContactId && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-primary/5 border-primary/20">
          <UserCheck className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">{currentBuyerName || 'Assigned buyer'}</span>
          <button
            type="button"
            onClick={() => onBuyerChange(null)}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground"
          >
            Remove
          </button>
        </div>
      )}

      {/* Company Search */}
      <div className="space-y-1.5 relative">
        <Label className="text-xs text-muted-foreground">Company</Label>
        {selectedCompany ? (
          <div className="flex items-center gap-2 h-9 px-3 rounded-md border bg-muted/30 text-sm">
            <span className="flex-1 truncate">{selectedCompany.name}</span>
            <button
              type="button"
              onClick={() => {
                setSelectedCompany(null)
                setCompanyContacts([])
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              &times;
            </button>
          </div>
        ) : (
          <>
            <Input
              value={companyQuery}
              onChange={(e) => setCompanyQuery(e.target.value)}
              placeholder="Search buyer company..."
              className="h-9"
            />
            {(companyResults.length > 0 || companySearching) && (
              <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-popover border rounded-md shadow-md max-h-40 overflow-y-auto">
                {companySearching ? (
                  <div className="px-3 py-2 text-xs text-muted-foreground">Searching...</div>
                ) : (
                  companyResults.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted"
                      onClick={() => handleCompanySelect(c)}
                    >
                      <div>{c.name}</div>
                      {(c.city || c.state) && (
                        <div className="text-xs text-muted-foreground">
                          {[c.city, c.state].filter(Boolean).join(', ')}
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Contact Dropdown (from selected company) */}
      {selectedCompany && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Buyer Contact</Label>
          {contactsLoading ? (
            <div className="text-xs text-muted-foreground py-2">Loading contacts...</div>
          ) : companyContacts.length === 0 ? (
            <div className="text-xs text-muted-foreground py-2">
              No contacts linked to this company.
            </div>
          ) : (
            <Select
              value={currentBuyerContactId || ''}
              onValueChange={handleContactSelect}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select buyer contact..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__clear__" className="text-muted-foreground">
                  No buyer
                </SelectItem>
                {companyContacts.map((c) => {
                  const name = `${c.first_name} ${c.last_name || ''}`.trim()
                  return (
                    <SelectItem key={c.contact_id} value={c.contact_id}>
                      <div className="flex items-center gap-2">
                        <span>{name}</span>
                        {c.role_title && (
                          <span className="text-xs text-muted-foreground">({c.role_title})</span>
                        )}
                        {c.is_poc && (
                          <span className="text-[10px] text-primary font-medium">POC</span>
                        )}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          )}
        </div>
      )}
    </div>
  )
}
