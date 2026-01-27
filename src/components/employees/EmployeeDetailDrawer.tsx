import { Loader2, User } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { EmployeeSummaryPanel } from './EmployeeSummaryPanel'
import { useEmployeeStore } from '@/hooks/useEmployeeStore'

interface EmployeeDetailDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EmployeeDetailDrawer({
  open,
  onOpenChange,
}: EmployeeDetailDrawerProps) {
  const {
    selectedEmployee,
    loadingSelected,
    selectEmployee,
  } = useEmployeeStore()

  const handleClose = () => {
    onOpenChange(false)
    selectEmployee(null)
  }

  const displayName = selectedEmployee
    ? selectedEmployee.user.full_name || selectedEmployee.user.email
    : 'Employee'

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-md flex flex-col overflow-hidden">
        <SheetHeader className="sr-only">
          <SheetTitle>{displayName}</SheetTitle>
        </SheetHeader>

        {loadingSelected ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !selectedEmployee ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Employee not found</p>
          </div>
        ) : (
          <div className="flex-1 min-h-0">
            <EmployeeSummaryPanel
              employee={selectedEmployee}
              onClose={handleClose}
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
