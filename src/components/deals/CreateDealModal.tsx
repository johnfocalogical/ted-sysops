import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { createDeal } from '@/lib/dealService'
import { DEAL_TYPE_LABELS } from '@/types/deal.types'
import type { DealType } from '@/types/deal.types'

const createDealSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  deal_type: z.enum(['wholesale', 'listing', 'novation', 'purchase'], {
    required_error: 'Deal type is required',
  }),
  contract_price: z.string().optional(),
  contract_date: z.string().optional(),
  closing_date: z.string().optional(),
  notes: z.string().optional(),
})

type CreateDealFormData = z.infer<typeof createDealSchema>

interface CreateDealModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teamId: string
  orgId: string
  userId: string
  onDealCreated: () => void
}

export function CreateDealModal({
  open,
  onOpenChange,
  teamId,
  orgId,
  userId,
  onDealCreated,
}: CreateDealModalProps) {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CreateDealFormData>({
    resolver: zodResolver(createDealSchema),
    defaultValues: {
      address: '',
      city: '',
      state: '',
      zip: '',
      deal_type: 'wholesale',
      contract_price: '',
      contract_date: '',
      closing_date: '',
      notes: '',
    },
  })

  async function onSubmit(data: CreateDealFormData) {
    setIsSubmitting(true)
    try {
      const contractPrice = data.contract_price
        ? parseFloat(data.contract_price.replace(/[^0-9.-]/g, ''))
        : undefined

      const deal = await createDeal(
        {
          team_id: teamId,
          address: data.address,
          city: data.city || undefined,
          state: data.state || undefined,
          zip: data.zip || undefined,
          deal_type: data.deal_type as DealType,
          owner_id: userId,
          contract_price: contractPrice && !isNaN(contractPrice) ? contractPrice : undefined,
          contract_date: data.contract_date || undefined,
          closing_date: data.closing_date || undefined,
          notes: data.notes || undefined,
        },
        userId
      )

      toast.success('Deal created successfully')
      form.reset()
      onOpenChange(false)
      onDealCreated()
      navigate(`/org/${orgId}/team/${teamId}/deals/${deal.id}`)
    } catch (err) {
      console.error('Error creating deal:', err)
      toast.error('Failed to create deal')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Deal</DialogTitle>
          <DialogDescription>
            Create a new deal in your pipeline
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Property Section */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Property
              </h4>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address *</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-3">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="City" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input placeholder="TX" maxLength={2} {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="zip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP</FormLabel>
                      <FormControl>
                        <Input placeholder="75001" maxLength={10} {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Deal Terms */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Deal Terms
              </h4>

              <FormField
                control={form.control}
                name="deal_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deal Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select deal type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(Object.entries(DEAL_TYPE_LABELS) as [DealType, string][]).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contract_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract Price</FormLabel>
                    <FormControl>
                      <Input placeholder="$0" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Dates */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Key Dates
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="contract_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contract Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="closing_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Closing Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional notes about this deal..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Creating...' : 'Create Deal'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
