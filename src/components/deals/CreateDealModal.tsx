import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Check, ChevronsUpDown, X, Plus } from 'lucide-react'
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Separator } from '@/components/ui/separator'
import { DatePickerField } from '@/components/shared/DatePickerField'
import { toast } from 'sonner'
import { createDeal } from '@/lib/dealService'
import { searchContacts, createContact } from '@/lib/contactService'
import { DEAL_TYPE_LABELS } from '@/types/deal.types'
import type { DealType } from '@/types/deal.types'
import { cn } from '@/lib/utils'

const createDealSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  deal_type: z.enum(['wholesale', 'listing', 'novation', 'purchase']),
  contract_price: z.string().optional(),
  contract_date: z.string().optional(),
  closing_date: z.string().optional(),
  seller_contact_id: z.string().optional(),
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

// Format a number as currency display string
function formatCurrencyDisplay(value: string): string {
  const cleaned = value.replace(/[^0-9.-]/g, '')
  const num = parseFloat(cleaned)
  if (isNaN(num)) return ''
  return num.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
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

  // Currency field state
  const [priceFocused, setPriceFocused] = useState(false)

  // Seller picker state
  const [sellerOpen, setSellerOpen] = useState(false)
  const [sellerSearch, setSellerSearch] = useState('')
  const [sellerResults, setSellerResults] = useState<{ id: string; first_name: string; last_name: string | null }[]>([])
  const [sellerName, setSellerName] = useState('')
  const sellerDebounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Inline contact creation state
  const [creatingContact, setCreatingContact] = useState(false)
  const [newFirstName, setNewFirstName] = useState('')
  const [newLastName, setNewLastName] = useState('')
  const [savingContact, setSavingContact] = useState(false)

  const form = useForm<CreateDealFormData>({
    resolver: zodResolver(createDealSchema) as any,
    defaultValues: {
      address: '',
      city: '',
      state: '',
      zip: '',
      deal_type: 'wholesale',
      contract_price: '',
      contract_date: '',
      closing_date: '',
      seller_contact_id: '',
      notes: '',
    },
  })

  // Reset seller state when modal closes
  useEffect(() => {
    if (!open) {
      setSellerName('')
      setSellerSearch('')
      setSellerResults([])
      setCreatingContact(false)
      setNewFirstName('')
      setNewLastName('')
    }
  }, [open])

  // Search contacts as user types
  useEffect(() => {
    if (sellerDebounceRef.current) clearTimeout(sellerDebounceRef.current)

    if (!sellerSearch.trim()) {
      // Load initial results when opening (show all)
      if (sellerOpen) {
        searchContacts(teamId, '', 20)
          .then(setSellerResults)
          .catch(() => setSellerResults([]))
      }
      return
    }

    sellerDebounceRef.current = setTimeout(() => {
      searchContacts(teamId, sellerSearch, 20)
        .then(setSellerResults)
        .catch(() => setSellerResults([]))
    }, 200)

    return () => {
      if (sellerDebounceRef.current) clearTimeout(sellerDebounceRef.current)
    }
  }, [sellerSearch, sellerOpen, teamId])

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
          seller_contact_id: data.seller_contact_id || undefined,
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

              {/* Seller Contact Picker */}
              <FormField
                control={form.control}
                name="seller_contact_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seller</FormLabel>
                    <Popover open={sellerOpen} onOpenChange={setSellerOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              'w-full justify-between font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? sellerName : 'Select seller...'}
                            {field.value ? (
                              <X
                                className="ml-2 h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  field.onChange('')
                                  setSellerName('')
                                }}
                              />
                            ) : (
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        {creatingContact ? (
                          <div className="p-3 space-y-3">
                            <p className="text-sm font-medium">New Contact</p>
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                placeholder="First name *"
                                value={newFirstName}
                                onChange={(e) => setNewFirstName(e.target.value)}
                                autoFocus
                              />
                              <Input
                                placeholder="Last name"
                                value={newLastName}
                                onChange={(e) => setNewLastName(e.target.value)}
                              />
                            </div>
                            <div className="flex gap-2 justify-end">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setCreatingContact(false)
                                  setNewFirstName('')
                                  setNewLastName('')
                                }}
                                disabled={savingContact}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                className="bg-primary hover:bg-primary/90"
                                disabled={!newFirstName.trim() || savingContact}
                                onClick={async () => {
                                  setSavingContact(true)
                                  try {
                                    const contact = await createContact(
                                      {
                                        team_id: teamId,
                                        first_name: newFirstName.trim(),
                                        last_name: newLastName.trim() || undefined,
                                      },
                                      userId
                                    )
                                    const name = [contact.first_name, contact.last_name].filter(Boolean).join(' ')
                                    field.onChange(contact.id)
                                    setSellerName(name)
                                    setSellerOpen(false)
                                    setCreatingContact(false)
                                    setNewFirstName('')
                                    setNewLastName('')
                                    toast.success('Contact created')
                                  } catch {
                                    toast.error('Failed to create contact')
                                  } finally {
                                    setSavingContact(false)
                                  }
                                }}
                              >
                                {savingContact && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                                Create
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Command shouldFilter={false}>
                            <CommandInput
                              placeholder="Search contacts..."
                              value={sellerSearch}
                              onValueChange={setSellerSearch}
                            />
                            <CommandList>
                              <CommandEmpty>No contacts found.</CommandEmpty>
                              <CommandGroup>
                                {sellerResults.map((contact) => {
                                  const name = [contact.first_name, contact.last_name].filter(Boolean).join(' ')
                                  return (
                                    <CommandItem
                                      key={contact.id}
                                      value={contact.id}
                                      onSelect={() => {
                                        field.onChange(contact.id)
                                        setSellerName(name)
                                        setSellerOpen(false)
                                        setSellerSearch('')
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          'mr-2 h-4 w-4',
                                          field.value === contact.id ? 'opacity-100' : 'opacity-0'
                                        )}
                                      />
                                      {name}
                                    </CommandItem>
                                  )
                                })}
                              </CommandGroup>
                            </CommandList>
                            <div className="border-t p-1">
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                onClick={() => setCreatingContact(true)}
                              >
                                <Plus className="h-4 w-4" />
                                Create new contact
                              </button>
                            </div>
                          </Command>
                        )}
                      </PopoverContent>
                    </Popover>
                  </FormItem>
                )}
              />

              {/* Contract Price with format-on-blur */}
              <FormField
                control={form.control}
                name="contract_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract Price</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="$0"
                        className="tabular-nums"
                        value={priceFocused ? field.value : (field.value ? formatCurrencyDisplay(field.value) : '')}
                        onFocus={() => setPriceFocused(true)}
                        onChange={(e) => field.onChange(e.target.value)}
                        onBlur={() => {
                          setPriceFocused(false)
                          field.onBlur()
                        }}
                      />
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
                        <DatePickerField
                          value={field.value ?? ''}
                          onChange={field.onChange}
                        />
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
                        <DatePickerField
                          value={field.value ?? ''}
                          onChange={field.onChange}
                        />
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
