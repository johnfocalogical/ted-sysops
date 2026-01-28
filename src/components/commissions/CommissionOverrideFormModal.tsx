import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  createCommissionRule,
  updateCommissionRule,
  validateCommissionConfiguration,
} from '@/lib/commissionRuleService'
import { CALCULATION_TYPE_LABELS } from '@/types/commission.types'
import type {
  CommissionCalculationType,
  CommissionConfiguration,
  CommissionRule,
  TierBracket,
} from '@/types/commission.types'
import type { RoleCommissionRule } from '@/types/roleCommission.types'
import { toast } from 'sonner'

// ============================================================================
// Schema
// ============================================================================

const CALC_TYPES: CommissionCalculationType[] = [
  'flat_fee',
  'percentage_gross',
  'percentage_net',
  'tiered',
  'role_based',
]

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  calculation_type: z.enum(['flat_fee', 'percentage_gross', 'percentage_net', 'tiered', 'role_based']),
  effective_date: z.string().min(1, 'Effective date is required'),
  priority: z.coerce.number().int().min(0),
  notes: z.string().optional(),
  expires_at: z.string().optional(),
  config_amount: z.coerce.number().optional(),
  config_minimum_deal_profit: z.coerce.number().optional(),
  config_percentage: z.coerce.number().optional(),
  config_cap: z.coerce.number().optional(),
  config_profit_basis: z.enum(['gross', 'net']).optional(),
  config_base_type: z.enum(['percentage_gross', 'percentage_net']).optional(),
  config_base_percentage: z.coerce.number().optional(),
})

type FormValues = z.infer<typeof formSchema>

// ============================================================================
// Props
// ============================================================================

interface CommissionOverrideFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employeeProfileId: string
  teamId: string
  roleCommissionRule: RoleCommissionRule
  roleName: string
  existingOverride: CommissionRule | null
  userId: string
  onSaved: () => void
}

// ============================================================================
// Build configuration helper
// ============================================================================

function buildConfiguration(
  type: CommissionCalculationType,
  values: FormValues,
  tiers: TierBracket[],
  roleMultipliers: { role: string; multiplier: number }[]
): CommissionConfiguration {
  switch (type) {
    case 'flat_fee':
      return {
        amount: values.config_amount || 0,
        ...(values.config_minimum_deal_profit
          ? { minimum_deal_profit: values.config_minimum_deal_profit }
          : {}),
      }
    case 'percentage_gross':
    case 'percentage_net':
      return {
        percentage: values.config_percentage || 0,
        ...(values.config_cap ? { cap: values.config_cap } : {}),
      }
    case 'tiered':
      return {
        profit_basis: values.config_profit_basis || 'gross',
        tiers,
      }
    case 'role_based': {
      const multipliers: Record<string, number> = {}
      for (const rm of roleMultipliers) {
        if (rm.role.trim()) {
          multipliers[rm.role.trim()] = rm.multiplier
        }
      }
      return {
        base_calculation: {
          type: values.config_base_type || 'percentage_gross',
          percentage: values.config_base_percentage || 0,
        },
        role_multipliers: multipliers,
      }
    }
  }
}

// ============================================================================
// Expiration Presets
// ============================================================================

function addDays(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

// ============================================================================
// Component
// ============================================================================

export function CommissionOverrideFormModal({
  open,
  onOpenChange,
  employeeProfileId,
  teamId,
  roleCommissionRule,
  roleName,
  existingOverride,
  userId,
  onSaved,
}: CommissionOverrideFormModalProps) {
  const [saving, setSaving] = useState(false)
  const isEditing = !!existingOverride

  const [tiers, setTiers] = useState<TierBracket[]>([{ threshold: 0, percentage: 10 }])
  const [roleMultipliers, setRoleMultipliers] = useState<
    { role: string; multiplier: number }[]
  >([{ role: '', multiplier: 1 }])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      calculation_type: 'flat_fee',
      effective_date: new Date().toISOString().split('T')[0],
      priority: 0,
      notes: '',
      expires_at: '',
    },
  })

  const calculationType = form.watch('calculation_type')

  // Pre-fill from the role commission rule being overridden (or existing override)
  useEffect(() => {
    if (!open) return

    const source = existingOverride || roleCommissionRule
    const vals: Partial<FormValues> = {
      name: source.name + (existingOverride ? '' : ' (Override)'),
      calculation_type: source.calculation_type,
      effective_date: existingOverride?.effective_date || new Date().toISOString().split('T')[0],
      priority: source.priority,
      notes: existingOverride?.notes || '',
      expires_at: existingOverride?.expires_at
        ? new Date(existingOverride.expires_at).toISOString().split('T')[0]
        : '',
    }

    const config = source.configuration as Record<string, unknown>

    switch (source.calculation_type) {
      case 'flat_fee':
        vals.config_amount = config.amount as number
        vals.config_minimum_deal_profit = config.minimum_deal_profit as number | undefined
        break
      case 'percentage_gross':
      case 'percentage_net':
        vals.config_percentage = config.percentage as number
        vals.config_cap = config.cap as number | undefined
        break
      case 'tiered':
        vals.config_profit_basis = (config.profit_basis as 'gross' | 'net') || 'gross'
        setTiers((config.tiers as TierBracket[]) || [{ threshold: 0, percentage: 10 }])
        break
      case 'role_based': {
        const base = config.base_calculation as { type: string; percentage: number } | undefined
        vals.config_base_type = (base?.type as 'percentage_gross' | 'percentage_net') || 'percentage_gross'
        vals.config_base_percentage = base?.percentage
        const mults = config.role_multipliers as Record<string, number> | undefined
        if (mults && Object.keys(mults).length > 0) {
          setRoleMultipliers(Object.entries(mults).map(([role, multiplier]) => ({ role, multiplier })))
        } else {
          setRoleMultipliers([{ role: '', multiplier: 1 }])
        }
        break
      }
    }

    form.reset(vals as FormValues)
  }, [open, roleCommissionRule, existingOverride, form])

  // Tier handlers
  const addTier = () => setTiers((prev) => [...prev, { threshold: 0, percentage: 0 }])
  const removeTier = (index: number) => setTiers((prev) => prev.filter((_, i) => i !== index))
  const updateTier = (index: number, field: keyof TierBracket, value: number) =>
    setTiers((prev) => prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)))

  // Role multiplier handlers
  const addRoleMultiplier = () => setRoleMultipliers((prev) => [...prev, { role: '', multiplier: 1 }])
  const removeRoleMultiplier = (index: number) => setRoleMultipliers((prev) => prev.filter((_, i) => i !== index))
  const updateRoleMultiplier = (index: number, field: 'role' | 'multiplier', value: string | number) =>
    setRoleMultipliers((prev) => prev.map((rm, i) => (i === index ? { ...rm, [field]: value } : rm)))

  const onSubmit = async (values: FormValues) => {
    setSaving(true)
    try {
      const config = buildConfiguration(values.calculation_type, values, tiers, roleMultipliers)

      const validation = validateCommissionConfiguration(values.calculation_type, config)
      if (!validation.valid) {
        toast.error(validation.errors[0])
        setSaving(false)
        return
      }

      const expiresAt = values.expires_at
        ? new Date(values.expires_at + 'T23:59:59Z').toISOString()
        : null

      if (isEditing && existingOverride) {
        await updateCommissionRule(existingOverride.id, {
          name: values.name,
          calculation_type: values.calculation_type,
          configuration: config,
          effective_date: values.effective_date,
          priority: values.priority,
          notes: values.notes || null,
          expires_at: expiresAt,
        })
        toast.success('Override updated')
      } else {
        await createCommissionRule(
          {
            team_id: teamId,
            employee_profile_id: employeeProfileId,
            name: values.name,
            calculation_type: values.calculation_type,
            configuration: config,
            effective_date: values.effective_date,
            priority: values.priority,
            notes: values.notes || null,
            role_commission_rule_id: roleCommissionRule.id,
            expires_at: expiresAt,
          },
          userId
        )
        toast.success('Override created')
      }

      onSaved()
      onOpenChange(false)
    } catch (err) {
      console.error('Error saving override:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to save override')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Commission Override' : 'Override Commission Rule'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? `Update the override for "${roleCommissionRule.name}" from ${roleName}`
              : `Create an employee-specific override for "${roleCommissionRule.name}" from ${roleName}`}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Calculation Type */}
            <FormField
              control={form.control}
              name="calculation_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Calculation Type *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CALC_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {CALCULATION_TYPE_LABELS[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Dynamic config sections (same as CommissionRuleFormModal) */}
            {calculationType === 'flat_fee' && (
              <div className="space-y-4 rounded-lg border p-4">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Flat Fee Configuration</div>
                <FormField control={form.control} name="config_amount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                        <Input type="number" min={0} step="0.01" className="pl-7" placeholder="0" {...field} value={field.value ?? ''} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="config_minimum_deal_profit" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Deal Profit</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                        <Input type="number" min={0} step="0.01" className="pl-7" placeholder="0" {...field} value={field.value ?? ''} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            )}

            {(calculationType === 'percentage_gross' || calculationType === 'percentage_net') && (
              <div className="space-y-4 rounded-lg border p-4">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {calculationType === 'percentage_gross' ? 'Gross Profit Percentage' : 'Net Profit Percentage'}
                </div>
                <FormField control={form.control} name="config_percentage" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Percentage *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type="number" min={0} max={100} step="0.1" placeholder="0" {...field} value={field.value ?? ''} />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="config_cap" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cap</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                        <Input type="number" min={0} step="0.01" className="pl-7" placeholder="No cap" {...field} value={field.value ?? ''} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            )}

            {calculationType === 'tiered' && (
              <div className="space-y-4 rounded-lg border p-4">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tiered Configuration</div>
                <FormField control={form.control} name="config_profit_basis" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profit Basis *</FormLabel>
                    <Select value={field.value || 'gross'} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="gross">Gross Profit</SelectItem>
                        <SelectItem value="net">Net Profit</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="space-y-2">
                  <div className="text-sm font-medium">Tier Brackets</div>
                  {tiers.map((tier, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                        <Input type="number" min={0} step="1" className="pl-7" placeholder="Threshold" value={tier.threshold} onChange={(e) => updateTier(index, 'threshold', Number(e.target.value))} />
                      </div>
                      <div className="relative w-24">
                        <Input type="number" min={0} max={100} step="0.1" placeholder="%" value={tier.percentage} onChange={(e) => updateTier(index, 'percentage', Number(e.target.value))} />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                      </div>
                      {tiers.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => removeTier(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addTier}>
                    <Plus className="mr-1 h-4 w-4" />Add Tier
                  </Button>
                </div>
              </div>
            )}

            {calculationType === 'role_based' && (
              <div className="space-y-4 rounded-lg border p-4">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Role-Based Configuration</div>
                <FormField control={form.control} name="config_base_type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base Calculation *</FormLabel>
                    <Select value={field.value || 'percentage_gross'} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="percentage_gross">% of Gross Profit</SelectItem>
                        <SelectItem value="percentage_net">% of Net Profit</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="config_base_percentage" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base Percentage *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type="number" min={0} max={100} step="0.1" placeholder="0" {...field} value={field.value ?? ''} />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="space-y-2">
                  <div className="text-sm font-medium">Role Multipliers</div>
                  {roleMultipliers.map((rm, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input className="flex-1" placeholder="Role name" value={rm.role} onChange={(e) => updateRoleMultiplier(index, 'role', e.target.value)} />
                      <div className="relative w-24">
                        <Input type="number" min={0} step="0.1" placeholder="1.0" value={rm.multiplier} onChange={(e) => updateRoleMultiplier(index, 'multiplier', Number(e.target.value))} />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">&times;</span>
                      </div>
                      {roleMultipliers.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => removeRoleMultiplier(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addRoleMultiplier}>
                    <Plus className="mr-1 h-4 w-4" />Add Role
                  </Button>
                </div>
              </div>
            )}

            {/* Effective date and expiration */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="effective_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Effective Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expires_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expires On</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>Leave blank for permanent override</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Expiration presets */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Quick set:</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => form.setValue('expires_at', addDays(30))}
              >
                30 days
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => form.setValue('expires_at', addDays(60))}
              >
                60 days
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => form.setValue('expires_at', addDays(90))}
              >
                90 days
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => form.setValue('expires_at', '')}
              >
                Clear
              </Button>
            </div>

            {/* Priority and notes */}
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} value={field.value ?? 0} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Reduced commission for probation period" rows={2} className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Save Override' : 'Create Override'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
