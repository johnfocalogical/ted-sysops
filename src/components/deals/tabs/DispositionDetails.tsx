import { useState, useEffect, useRef, useCallback } from 'react'
import { Loader2, Save, Megaphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { getDealDisposition, upsertDealDisposition } from '@/lib/dealService'
import { createActivityLog } from '@/lib/activityLogService'
import { CurrencyField, SwitchField } from '../DealFormFields'
import { JVDealConfig } from './JVDealConfig'
import type { DealDisposition, JVType } from '@/types/deal.types'

interface DispositionDetailsProps {
  dealId: string
}

interface DispoState {
  original_projected_sale_price: number | null
  updated_projected_sale_price: number | null
  is_jv_deal: boolean
  jv_type: JVType | null
  jv_fixed_amount: number | null
  jv_percentage: number | null
  jv_partner_contact_id: string | null
}

function stateFromDispo(dispo: DealDisposition | null): DispoState {
  return {
    original_projected_sale_price: dispo?.original_projected_sale_price ?? null,
    updated_projected_sale_price: dispo?.updated_projected_sale_price ?? null,
    is_jv_deal: dispo?.is_jv_deal ?? false,
    jv_type: dispo?.jv_type ?? null,
    jv_fixed_amount: dispo?.jv_fixed_amount ?? null,
    jv_percentage: dispo?.jv_percentage ?? null,
    jv_partner_contact_id: dispo?.jv_partner_contact_id ?? null,
  }
}

export function DispositionDetails({ dealId }: DispositionDetailsProps) {
  const { teamId } = useParams<{ teamId: string }>()
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [state, setState] = useState<DispoState>(stateFromDispo(null))
  const originalRef = useRef<DispoState>(stateFromDispo(null))
  const [originalPriceLocked, setOriginalPriceLocked] = useState(false)

  useEffect(() => {
    let cancelled = false
    getDealDisposition(dealId)
      .then((data) => {
        if (!cancelled) {
          const s = stateFromDispo(data)
          setState(s)
          originalRef.current = { ...s }
          if (data?.original_projected_sale_price != null) {
            setOriginalPriceLocked(true)
          }
        }
      })
      .catch((err) => console.error('Error loading disposition:', err))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [dealId])

  const update = useCallback((updates: Partial<DispoState>) => {
    setState((prev) => ({ ...prev, ...updates }))
  }, [])

  // Check if data has changed
  const isDirty =
    JSON.stringify(state) !== JSON.stringify(originalRef.current)

  // Diff for activity log
  const diffFields = useCallback(() => {
    const changes: Record<string, { from: unknown; to: unknown }> = {}
    const orig = originalRef.current
    const keys = Object.keys(state) as (keyof DispoState)[]
    for (const key of keys) {
      if (state[key] !== orig[key]) {
        changes[key] = { from: orig[key], to: state[key] }
      }
    }
    return changes
  }, [state])

  const handleSave = async () => {
    if (!teamId || !user?.id) return

    setSaving(true)
    try {
      await upsertDealDisposition({
        deal_id: dealId,
        original_projected_sale_price: state.original_projected_sale_price,
        updated_projected_sale_price: state.updated_projected_sale_price,
        is_jv_deal: state.is_jv_deal,
        jv_type: state.is_jv_deal ? state.jv_type : null,
        jv_fixed_amount: state.is_jv_deal && state.jv_type === 'fixed' ? state.jv_fixed_amount : null,
        jv_percentage: state.is_jv_deal && state.jv_type === 'percentage' ? state.jv_percentage : null,
        jv_partner_contact_id: state.is_jv_deal ? state.jv_partner_contact_id : null,
      })

      const changes = diffFields()
      if (Object.keys(changes).length > 0) {
        const changeDescriptions: string[] = []
        if (changes.original_projected_sale_price) {
          changeDescriptions.push(`Original projected price: $${(state.original_projected_sale_price ?? 0).toLocaleString()}`)
        }
        if (changes.updated_projected_sale_price) {
          changeDescriptions.push(`Updated projected price: $${(state.updated_projected_sale_price ?? 0).toLocaleString()}`)
        }
        if (changes.is_jv_deal) {
          changeDescriptions.push(state.is_jv_deal ? 'Enabled JV deal' : 'Disabled JV deal')
        }
        if (changes.jv_type || changes.jv_fixed_amount || changes.jv_percentage) {
          if (state.is_jv_deal && state.jv_type === 'fixed') {
            changeDescriptions.push(`JV fixed amount: $${(state.jv_fixed_amount ?? 0).toLocaleString()}`)
          } else if (state.is_jv_deal && state.jv_type === 'percentage') {
            changeDescriptions.push(`JV percentage: ${state.jv_percentage ?? 0}%`)
          }
        }

        await createActivityLog(
          {
            team_id: teamId,
            deal_id: dealId,
            entity_type: 'deal',
            activity_type: 'updated',
            content: `Updated disposition: ${changeDescriptions.join(', ')}`,
            metadata: changes,
          },
          user.id
        )
      }

      // Lock original price after first save
      if (state.original_projected_sale_price != null) {
        setOriginalPriceLocked(true)
      }

      originalRef.current = { ...state }
      toast.success('Disposition saved')
    } catch (err) {
      console.error(err)
      toast.error('Failed to save disposition')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Calculate JV amount from percentage for display
  const jvCalculatedAmount =
    state.jv_type === 'percentage' &&
    state.jv_percentage != null &&
    state.updated_projected_sale_price != null
      ? (state.updated_projected_sale_price * state.jv_percentage) / 100
      : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium">Disposition Details</h3>
        </div>

        {isDirty && (
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="bg-primary hover:bg-primary/90 h-8 text-xs gap-1.5"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </div>

      {/* Projected Sales Prices */}
      <div className="grid grid-cols-2 gap-4">
        <CurrencyField
          label="Original Projected Sales Price"
          value={state.original_projected_sale_price}
          onChange={(v) => update({ original_projected_sale_price: v })}
          readOnly={originalPriceLocked}
        />
        <CurrencyField
          label="Updated Projected Sales Price"
          value={state.updated_projected_sale_price}
          onChange={(v) => update({ updated_projected_sale_price: v })}
        />
      </div>

      {/* JV Deal Toggle */}
      <div className="border-t pt-4">
        <SwitchField
          label="JV Deal"
          value={state.is_jv_deal}
          onChange={(v) => update({ is_jv_deal: v })}
        />
      </div>

      {/* JV Configuration (shown when JV is enabled) */}
      {state.is_jv_deal && (
        <JVDealConfig
          jvType={state.jv_type}
          jvFixedAmount={state.jv_fixed_amount}
          jvPercentage={state.jv_percentage}
          jvPartnerContactId={state.jv_partner_contact_id}
          jvCalculatedAmount={jvCalculatedAmount}
          onJvTypeChange={(v) => update({ jv_type: v })}
          onJvFixedAmountChange={(v) => update({ jv_fixed_amount: v })}
          onJvPercentageChange={(v) => update({ jv_percentage: v })}
          onJvPartnerChange={(v) => update({ jv_partner_contact_id: v })}
        />
      )}
    </div>
  )
}
