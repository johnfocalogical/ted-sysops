import { useState, useCallback, useRef, useEffect } from 'react'
import { Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { ContractFactsSection } from './ContractFactsSection'
import { PropertyFactsSection } from './PropertyFactsSection'
import { DealFactsSection } from './DealFactsSection'
import { CloseSection } from './CloseSection'
import {
  upsertDealContractFacts,
  upsertDealPropertyFacts,
  upsertDealFacts,
  updateDeal,
} from '@/lib/dealService'
import { createActivityLog } from '@/lib/activityLogService'
import type {
  DealWithDetails,
  DealContractFacts,
  DealPropertyFacts,
  DealFacts,
  DealStatus,
} from '@/types/deal.types'

// ============================================================================
// Helpers
// ============================================================================

/**
 * Compare two objects and return the changed fields with old/new values.
 * Only compares fields present in `current` that differ from `original`.
 */
function diffFields(
  original: Record<string, unknown>,
  current: Record<string, unknown>
): { field: string; oldValue: unknown; newValue: unknown }[] {
  const changes: { field: string; oldValue: unknown; newValue: unknown }[] = []
  for (const key of Object.keys(current)) {
    if (key === 'deal_id' || key === 'created_at' || key === 'updated_at') continue
    const oldVal = original[key] ?? null
    const newVal = current[key] ?? null
    if (oldVal !== newVal) {
      changes.push({ field: key, oldValue: oldVal, newValue: newVal })
    }
  }
  return changes
}

/** Human-readable field label */
function fieldLabel(field: string): string {
  return field
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

// ============================================================================
// Component
// ============================================================================

interface DealInfoTabProps {
  deal: DealWithDetails
  onDealUpdated: (deal: DealWithDetails) => void
}

export function DealInfoTab({ deal, onDealUpdated }: DealInfoTabProps) {
  const { teamId } = useParams<{ teamId: string }>()
  const { user } = useAuth()

  // Local state for each fact table
  const [contractFacts, setContractFacts] = useState<Partial<DealContractFacts>>(
    deal.contract_facts ?? {}
  )
  const [propertyFacts, setPropertyFacts] = useState<Partial<DealPropertyFacts>>(
    deal.property_facts ?? {}
  )
  const [dealFacts, setDealFacts] = useState<Partial<DealFacts>>(
    deal.deal_facts ?? {}
  )

  // Close section uses deal-level fields
  const [closingDate, setClosingDate] = useState<string | null>(deal.closing_date)
  const [closingPrice, setClosingPrice] = useState<number | null>(
    deal.contract_facts?.actual_contract_price ?? null
  )

  // Track original values for diff
  const originalContractFacts = useRef(deal.contract_facts ?? {})
  const originalPropertyFacts = useRef(deal.property_facts ?? {})
  const originalDealFacts = useRef(deal.deal_facts ?? {})
  const originalClosingDate = useRef(deal.closing_date)
  const originalClosingPrice = useRef(deal.contract_facts?.actual_contract_price ?? null)

  const [isSaving, setIsSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  // Reset state when deal changes (e.g., after external refresh)
  useEffect(() => {
    setContractFacts(deal.contract_facts ?? {})
    setPropertyFacts(deal.property_facts ?? {})
    setDealFacts(deal.deal_facts ?? {})
    setClosingDate(deal.closing_date)
    setClosingPrice(deal.contract_facts?.actual_contract_price ?? null)
    originalContractFacts.current = deal.contract_facts ?? {}
    originalPropertyFacts.current = deal.property_facts ?? {}
    originalDealFacts.current = deal.deal_facts ?? {}
    originalClosingDate.current = deal.closing_date
    originalClosingPrice.current = deal.contract_facts?.actual_contract_price ?? null
    setIsDirty(false)
  }, [deal])

  // onChange handlers that mark dirty
  const handleContractFactsChange = useCallback((updates: Partial<DealContractFacts>) => {
    setContractFacts((prev) => ({ ...prev, ...updates }))
    setIsDirty(true)
  }, [])

  const handlePropertyFactsChange = useCallback((updates: Partial<DealPropertyFacts>) => {
    setPropertyFacts((prev) => ({ ...prev, ...updates }))
    setIsDirty(true)
  }, [])

  const handleDealFactsChange = useCallback((updates: Partial<DealFacts>) => {
    setDealFacts((prev) => ({ ...prev, ...updates }))
    setIsDirty(true)
  }, [])

  const handleClosingDateChange = useCallback((val: string | null) => {
    setClosingDate(val)
    setIsDirty(true)
  }, [])

  const handleClosingPriceChange = useCallback((val: number | null) => {
    setClosingPrice(val)
    // Also update contract facts so closing price is persisted there
    setContractFacts((prev) => ({ ...prev, actual_contract_price: val }))
    setIsDirty(true)
  }, [])

  const handleRequestClose = useCallback(() => {
    // This will be handled during save — set status to closed
    handleSave('closed')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Save all changed fact tables + log activity
  const handleSave = useCallback(
    async (newStatus?: DealStatus) => {
      if (!teamId || !user?.id) return

      setIsSaving(true)
      try {
        const promises: Promise<unknown>[] = []
        const allChanges: { section: string; field: string; oldValue: unknown; newValue: unknown }[] = []

        // Diff and save contract facts
        const contractDiff = diffFields(
          originalContractFacts.current as Record<string, unknown>,
          contractFacts as Record<string, unknown>
        )
        if (contractDiff.length > 0) {
          promises.push(
            upsertDealContractFacts({
              deal_id: deal.id,
              ...contractFacts,
            })
          )
          contractDiff.forEach((d) => allChanges.push({ section: 'Contract Facts', ...d }))
        }

        // Diff and save property facts
        const propertyDiff = diffFields(
          originalPropertyFacts.current as Record<string, unknown>,
          propertyFacts as Record<string, unknown>
        )
        if (propertyDiff.length > 0) {
          promises.push(
            upsertDealPropertyFacts({
              deal_id: deal.id,
              ...propertyFacts,
            })
          )
          propertyDiff.forEach((d) => allChanges.push({ section: 'Property Facts', ...d }))
        }

        // Diff and save deal facts
        const dealFactsDiff = diffFields(
          originalDealFacts.current as Record<string, unknown>,
          dealFacts as Record<string, unknown>
        )
        if (dealFactsDiff.length > 0) {
          promises.push(
            upsertDealFacts({
              deal_id: deal.id,
              ...dealFacts,
            })
          )
          dealFactsDiff.forEach((d) => allChanges.push({ section: 'Deal Facts', ...d }))
        }

        // Update deal-level fields if changed (closing date, status)
        const dealUpdates: Record<string, unknown> = {}
        if (closingDate !== originalClosingDate.current) {
          dealUpdates.closing_date = closingDate
          allChanges.push({
            section: 'Close',
            field: 'closing_date',
            oldValue: originalClosingDate.current,
            newValue: closingDate,
          })
        }
        if (newStatus) {
          dealUpdates.status = newStatus
          allChanges.push({
            section: 'Close',
            field: 'status',
            oldValue: deal.status,
            newValue: newStatus,
          })
        }
        if (Object.keys(dealUpdates).length > 0) {
          promises.push(updateDeal(deal.id, dealUpdates))
        }

        await Promise.all(promises)

        // Log activity for each changed field
        if (allChanges.length > 0) {
          const changesSummary = allChanges
            .map((c) => `${c.section}: ${fieldLabel(c.field)}`)
            .join(', ')

          await createActivityLog(
            {
              team_id: teamId,
              deal_id: deal.id,
              entity_type: 'deal',
              activity_type: 'updated',
              content: `Updated deal info: ${changesSummary}`,
              metadata: {
                changes: allChanges.map((c) => ({
                  section: c.section,
                  field: c.field,
                  old_value: c.oldValue,
                  new_value: c.newValue,
                })),
              },
            },
            user.id
          )
        }

        // Update originals to new values
        originalContractFacts.current = { ...contractFacts }
        originalPropertyFacts.current = { ...propertyFacts }
        originalDealFacts.current = { ...dealFacts }
        originalClosingDate.current = closingDate
        originalClosingPrice.current = closingPrice

        setIsDirty(false)
        toast.success('Deal info saved')

        // Notify parent to refresh deal data
        onDealUpdated({
          ...deal,
          closing_date: closingDate,
          status: newStatus ?? deal.status,
          contract_facts: contractFacts as DealContractFacts,
          property_facts: propertyFacts as DealPropertyFacts,
          deal_facts: dealFacts as DealFacts,
        })
      } catch (err) {
        console.error('Error saving deal info:', err)
        toast.error('Failed to save deal info', {
          description: err instanceof Error ? err.message : undefined,
        })
      } finally {
        setIsSaving(false)
      }
    },
    [
      teamId,
      user,
      deal,
      contractFacts,
      propertyFacts,
      dealFacts,
      closingDate,
      closingPrice,
      onDealUpdated,
    ]
  )

  return (
    <div className="space-y-4">
      {/* Save bar */}
      {isDirty && (
        <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-4 py-2">
          <span className="text-sm text-muted-foreground">
            You have unsaved changes
          </span>
          <Button
            size="sm"
            onClick={() => handleSave()}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      )}

      {/* Sections */}
      <ContractFactsSection
        data={contractFacts}
        onChange={handleContractFactsChange}
      />

      <PropertyFactsSection
        data={propertyFacts}
        onChange={handlePropertyFactsChange}
        defaultExpanded={false}
      />

      <DealFactsSection
        data={dealFacts}
        onChange={handleDealFactsChange}
      />

      <CloseSection
        actualClosingDate={closingDate}
        actualClosingPrice={closingPrice}
        dealStatus={deal.status}
        onClosingDateChange={handleClosingDateChange}
        onClosingPriceChange={handleClosingPriceChange}
        onRequestClose={handleRequestClose}
      />
    </div>
  )
}
