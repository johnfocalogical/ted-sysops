import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { CurrencyField, PercentageField } from '../DealFormFields'
import { searchContacts } from '@/lib/contactService'
import { useParams } from 'react-router-dom'
import type { JVType } from '@/types/deal.types'

interface JVDealConfigProps {
  jvType: JVType | null
  jvFixedAmount: number | null
  jvPercentage: number | null
  jvPartnerContactId: string | null
  jvCalculatedAmount: number | null
  onJvTypeChange: (v: JVType) => void
  onJvFixedAmountChange: (v: number | null) => void
  onJvPercentageChange: (v: number | null) => void
  onJvPartnerChange: (v: string | null) => void
}

export function JVDealConfig({
  jvType,
  jvFixedAmount,
  jvPercentage,
  jvPartnerContactId,
  jvCalculatedAmount,
  onJvTypeChange,
  onJvFixedAmountChange,
  onJvPercentageChange,
  onJvPartnerChange,
}: JVDealConfigProps) {
  const { teamId } = useParams<{ teamId: string }>()

  // Partner contact search state
  const [partnerQuery, setPartnerQuery] = useState('')
  const [partnerResults, setPartnerResults] = useState<{ id: string; first_name: string; last_name: string | null }[]>([])
  const [partnerSearching, setPartnerSearching] = useState(false)
  const [partnerName, setPartnerName] = useState<string | null>(null)

  // If we have a partner contact ID but no name, try to show it
  // (On initial load, the name isn't available, so we'll show the ID hint)
  useEffect(() => {
    if (!jvPartnerContactId) {
      setPartnerName(null)
    }
  }, [jvPartnerContactId])

  // Debounced search
  useEffect(() => {
    if (!partnerQuery.trim() || !teamId) {
      setPartnerResults([])
      return
    }
    const timer = setTimeout(async () => {
      setPartnerSearching(true)
      try {
        const results = await searchContacts(teamId, partnerQuery.trim())
        setPartnerResults(results)
      } catch (err) {
        console.error(err)
      } finally {
        setPartnerSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [partnerQuery, teamId])

  const selectPartner = (contact: { id: string; first_name: string; last_name: string | null }) => {
    const name = `${contact.first_name} ${contact.last_name || ''}`.trim()
    setPartnerName(name)
    onJvPartnerChange(contact.id)
    setPartnerQuery('')
    setPartnerResults([])
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Joint Venture Configuration
      </h4>

      {/* JV Type Radio */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">JV Type</Label>
        <RadioGroup
          value={jvType || ''}
          onValueChange={(v) => onJvTypeChange(v as JVType)}
          className="flex gap-4"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="fixed" id="jv-fixed" />
            <Label htmlFor="jv-fixed" className="text-sm cursor-pointer">
              Fixed Amount
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="percentage" id="jv-percentage" />
            <Label htmlFor="jv-percentage" className="text-sm cursor-pointer">
              Percentage
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* JV Amount Fields */}
      {jvType === 'fixed' && (
        <CurrencyField
          label="JV Fixed Amount"
          value={jvFixedAmount}
          onChange={onJvFixedAmountChange}
        />
      )}

      {jvType === 'percentage' && (
        <div className="space-y-3">
          <PercentageField
            label="JV Percentage"
            value={jvPercentage}
            onChange={onJvPercentageChange}
          />
          {jvCalculatedAmount != null && (
            <div className="text-sm text-muted-foreground">
              Calculated JV amount:{' '}
              <span className="font-semibold text-foreground tabular-nums">
                ${jvCalculatedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>
      )}

      {/* JV Partner Contact Search */}
      <div className="space-y-1.5 relative">
        <Label className="text-xs text-muted-foreground">JV Partner</Label>
        {jvPartnerContactId ? (
          <div className="flex items-center gap-2 h-9 px-3 rounded-md border bg-muted/30 text-sm">
            <span className="flex-1 truncate">
              {partnerName || 'Selected partner'}
            </span>
            <button
              type="button"
              onClick={() => {
                onJvPartnerChange(null)
                setPartnerName(null)
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              &times;
            </button>
          </div>
        ) : (
          <>
            <Input
              value={partnerQuery}
              onChange={(e) => setPartnerQuery(e.target.value)}
              placeholder="Search for JV partner..."
              className="h-9"
            />
            {(partnerResults.length > 0 || partnerSearching) && (
              <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-popover border rounded-md shadow-md max-h-32 overflow-y-auto">
                {partnerSearching ? (
                  <div className="px-3 py-2 text-xs text-muted-foreground">Searching...</div>
                ) : (
                  partnerResults.map((c) => {
                    const name = `${c.first_name} ${c.last_name || ''}`.trim()
                    return (
                      <button
                        key={c.id}
                        type="button"
                        className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted"
                        onClick={() => selectPartner(c)}
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
    </div>
  )
}
