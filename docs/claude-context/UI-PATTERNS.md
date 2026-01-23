# UI Patterns Guide

## Overview
This guide covers UI/UX patterns using shadcn/ui and Tailwind CSS. Specific component requirements are in GitHub issues.

---

## Design Principles

### 1. Data-Dense
Real estate professionals expect lots of info on screen:
- Use tables for list views
- Multi-tab layouts for detail views
- Compact spacing (but not cramped)

### 2. Fast Navigation
Power users need speed:
- Keyboard shortcuts
- Quick actions (right-click menus)
- Master-detail layouts
- Command palette (Cmd/Ctrl+K)

### 3. Consistent Components
Reuse shadcn/ui components:
- Same button styles everywhere
- Consistent form inputs
- Standard dialogs/modals
- Unified color scheme

---

## Component Library (shadcn/ui)

### Install Components As Needed
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add form
npx shadcn-ui@latest add table
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add select
npx shadcn-ui@latest add badge
```

**Pattern:** Only install what you need, keeps bundle small.

---

## Layout Patterns

### Multi-Tab Detail View
Common for deal pages with lots of sections:

```jsx
<Tabs defaultValue="overview">
  <TabsList className="w-full justify-start">
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="contract">Contract</TabsTrigger>
    <TabsTrigger value="financials">Financials</TabsTrigger>
    <TabsTrigger value="checklist">Checklist</TabsTrigger>
  </TabsList>
  
  <TabsContent value="overview">
    <OverviewTab deal={deal} />
  </TabsContent>
  {/* Other tabs */}
</Tabs>
```

**Pattern:** Organize related info into tabs, don't overwhelm.

### Master-Detail (List + Sidebar)
```jsx
<div className="flex h-screen">
  {/* List */}
  <div className="w-1/3 border-r overflow-y-auto p-4">
    <DealsList deals={deals} onSelect={setSelected} />
  </div>
  
  {/* Detail */}
  <div className="flex-1 overflow-y-auto p-6">
    {selected ? (
      <DealDetail deal={selected} />
    ) : (
      <EmptyState />
    )}
  </div>
</div>
```

**Pattern:** Browse list, see details instantly.

### Page Header with Actions
```jsx
<div className="flex items-center justify-between mb-6">
  <div>
    <h1 className="text-3xl font-bold">Deals</h1>
    <p className="text-muted-foreground">Manage your active deals</p>
  </div>
  <div className="flex gap-2">
    <Button variant="outline">
      <Filter className="mr-2 h-4 w-4" />
      Filters
    </Button>
    <Button>
      <Plus className="mr-2 h-4 w-4" />
      New Deal
    </Button>
  </div>
</div>
```

**Pattern:** Title + description on left, actions on right.

---

## Form Patterns

### Standard Form (React Hook Form + Zod)
```jsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const formSchema = z.object({
  address: z.string().min(1, "Required"),
  contract_price: z.number().positive(),
  deal_type: z.enum(["wholesale", "listing", "novation", "purchase"])
})

function DealForm({ onSubmit, defaultValues }) {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues
  })
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input placeholder="123 Main St" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving..." : "Save"}
        </Button>
      </form>
    </Form>
  )
}
```

**Pattern:** Validation with Zod, loading states, error display.

### Inline Editing
For quick edits without opening full form:

```jsx
function EditableField({ value, onSave }) {
  const [isEditing, setIsEditing] = useState(false)
  const [tempValue, setTempValue] = useState(value)
  
  const handleSave = async () => {
    await onSave(tempValue)
    setIsEditing(false)
  }
  
  if (!isEditing) {
    return (
      <div onClick={() => setIsEditing(true)} className="cursor-pointer hover:bg-muted p-2 rounded">
        {value || <span className="text-muted-foreground">Click to edit</span>}
      </div>
    )
  }
  
  return (
    <div className="flex gap-2">
      <Input value={tempValue} onChange={(e) => setTempValue(e.target.value)} />
      <Button size="sm" onClick={handleSave}>Save</Button>
      <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
    </div>
  )
}
```

**Pattern:** Click to edit, inline save/cancel.

---

## Table Patterns

### Data Table with Sorting
```jsx
import { DataTable } from "@/components/ui/data-table"

const columns = [
  {
    accessorKey: "address",
    header: "Address",
  },
  {
    accessorKey: "contract_price",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Price
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("contract_price"))
      return <div>${amount.toLocaleString()}</div>
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.getValue("status")} />
  }
]

function DealTable({ deals }) {
  return <DataTable columns={columns} data={deals} />
}
```

**Pattern:** Column definitions separate from rendering.

### Row Actions
```jsx
{
  id: "actions",
  cell: ({ row }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => view(row.original)}>
          View
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => edit(row.original)}>
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => deleteFn(row.original)}
          className="text-red-600"
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

**Pattern:** Three-dot menu for row actions.

---

## Status & Badge Patterns

### Status Badge Component
```jsx
function StatusBadge({ status }) {
  const variants = {
    active: "default",
    pending_sale: "secondary",
    closed: "outline",
    funded: "default",
    canceled: "destructive",
    on_hold: "secondary"
  }
  
  const colors = {
    active: "bg-blue-100 text-blue-800",
    pending_sale: "bg-yellow-100 text-yellow-800",
    closed: "bg-green-100 text-green-800",
    funded: "bg-green-100 text-green-800",
    canceled: "bg-red-100 text-red-800",
    on_hold: "bg-gray-100 text-gray-800"
  }
  
  return (
    <Badge className={colors[status]}>
      {status.replace('_', ' ').toUpperCase()}
    </Badge>
  )
}
```

**Pattern:** Consistent badge styling for statuses.

---

## Loading States

### Skeleton Loaders
```jsx
import { Skeleton } from "@/components/ui/skeleton"

function DealCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-4 w-[150px]" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-20 w-full" />
      </CardContent>
    </Card>
  )
}
```

**Pattern:** Show skeleton while loading, matches final layout.

### Button Loading State
```jsx
<Button disabled={isLoading}>
  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  {isLoading ? "Loading..." : "Submit"}
</Button>
```

**Pattern:** Spinner + disabled state + text change.

---

## Empty States

### Empty State Component
```jsx
function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 text-muted-foreground">
        {icon || <FileX className="h-12 w-12" />}
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="mb-4 text-sm text-muted-foreground max-w-sm">
        {description}
      </p>
      {action}
    </div>
  )
}

// Usage
<EmptyState
  icon={<Building className="h-12 w-12" />}
  title="No deals yet"
  description="Get started by creating your first deal."
  action={
    <Button onClick={openCreateDialog}>
      <Plus className="mr-2 h-4 w-4" />
      Create Deal
    </Button>
  }
/>
```

**Pattern:** Friendly, actionable empty states.

---

## Modal/Dialog Patterns

### Standard Dialog
```jsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>Create New Deal</DialogTitle>
      <DialogDescription>
        Enter the deal details to get started.
      </DialogDescription>
    </DialogHeader>
    
    <DealForm onSuccess={() => setIsOpen(false)} />
    
    <DialogFooter>
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Pattern:** Header + content + footer, controlled open state.

### Confirmation Dialog
```jsx
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Delete</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone. This will permanently delete the deal.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Pattern:** Use AlertDialog for destructive actions.

---

## Notification Patterns (Toast)

### Success/Error Notifications
```jsx
import { toast } from "sonner"

// Success
toast.success("Deal created successfully!")

// Error
toast.error("Failed to create deal", {
  description: error.message
})

// Loading (auto-dismiss when complete)
const toastId = toast.loading("Creating deal...")
// Later...
toast.success("Deal created!", { id: toastId })

// With action
toast("Deal updated", {
  description: "Contract price changed to $105,000",
  action: {
    label: "Undo",
    onClick: () => undoChange()
  }
})
```

**Pattern:** Use toast for all user feedback.

---

## Financial Display Patterns

### Currency Formatting
```jsx
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// Usage
<span>{formatCurrency(150000)}</span> // $150,000
```

### Profit Display with Color
```jsx
function ProfitDisplay({ profit }) {
  const isPositive = profit >= 0
  
  return (
    <div className="flex items-center gap-2">
      <span className={cn(
        "text-xl font-bold",
        isPositive ? "text-green-600" : "text-red-600"
      )}>
        {isPositive && '+'}{formatCurrency(profit)}
      </span>
      {isPositive ? (
        <TrendingUp className="h-5 w-5 text-green-600" />
      ) : (
        <TrendingDown className="h-5 w-5 text-red-600" />
      )}
    </div>
  )
}
```

**Pattern:** Visual indicators for positive/negative.

---

## Responsive Design

### Grid Layouts
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {deals.map(deal => <DealCard key={deal.id} deal={deal} />)}
</div>
```

**Pattern:** Stack on mobile, grid on desktop.

### Hide on Mobile
```jsx
<div className="hidden md:block">
  {/* Desktop-only sidebar */}
</div>

<div className="md:hidden">
  {/* Mobile-only menu */}
</div>
```

**Pattern:** Conditional rendering for different screens.

---

## Keyboard Shortcuts

### Global Shortcuts
```jsx
import { useHotkeys } from 'react-hotkeys-hook'

function App() {
  // Cmd/Ctrl + N: New deal
  useHotkeys('mod+n', () => setCreateDialogOpen(true))
  
  // Cmd/Ctrl + K: Quick search
  useHotkeys('mod+k', (e) => {
    e.preventDefault()
    setSearchOpen(true)
  })
  
  // Escape: Close modals
  useHotkeys('escape', () => {
    setCreateDialogOpen(false)
    setSearchOpen(false)
  })
}
```

**Pattern:** Power user shortcuts for common actions.

---

## Common Pitfalls

### ❌ Too Many Dialogs
```jsx
// Opening dialog inside dialog inside dialog
<Dialog> <Dialog> <Dialog> </Dialog> </Dialog> </Dialog>
```

### ✅ Use Sheets or Navigate
```jsx
// Use Sheet for secondary actions
<Sheet>
  <SheetContent>
    {/* Side panel content */}
  </SheetContent>
</Sheet>

// Or navigate to new page
navigate(`/deals/${dealId}`)
```

---

### ❌ Not Showing Loading States
```jsx
// User clicks, nothing happens for 2 seconds
<Button onClick={handleSubmit}>Submit</Button>
```

### ✅ Always Show Feedback
```jsx
<Button onClick={handleSubmit} disabled={isLoading}>
  {isLoading ? "Saving..." : "Submit"}
</Button>
```

---

### ❌ Unclear Error Messages
```jsx
toast.error("Error") // What error?
```

### ✅ Specific, Actionable Errors
```jsx
toast.error("Failed to create deal", {
  description: "The address field is required"
})
```

---

## Accessibility Patterns

### Keyboard Navigation
- All interactive elements should be keyboard accessible
- Use proper semantic HTML (`<button>`, not `<div onClick>`)
- Focus states visible

### ARIA Labels
```jsx
<Button aria-label="Delete deal">
  <Trash className="h-4 w-4" />
</Button>
```

### Color Contrast
- Use Tailwind's text colors that meet WCAG AA
- Don't rely on color alone (use icons too)

---

## Component Organization

```
src/components/
├── ui/              # shadcn/ui components
│   ├── button.tsx
│   ├── card.tsx
│   └── ...
├── deals/           # Deal-specific components
│   ├── DealCard.tsx
│   ├── DealForm.tsx
│   └── DealTable.tsx
├── shared/          # Reusable app components
│   ├── StatusBadge.tsx
│   ├── EmptyState.tsx
│   └── ProfitDisplay.tsx
└── layouts/         # Page layouts
    ├── DashboardLayout.tsx
    └── AuthLayout.tsx
```

**Pattern:** Organize by feature and reusability.

---

## Summary

**Key Takeaways:**
1. Use shadcn/ui for all components (consistent design)
2. Data-dense layouts with tabs and tables
3. Show loading states and errors
4. Use toast notifications for feedback
5. Keyboard shortcuts for power users
6. Empty states guide users
7. Financial data gets special formatting (currency, colors)

**Specific component requirements and designs are in GitHub issues.**
