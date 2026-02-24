import { useState } from 'react'
import { ChevronDown, ChevronRight, Flag } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { CurrencyField, DateField } from './DealFormFields'

interface CloseSectionProps {
  actualClosingDate: string | null
  actualClosingPrice: number | null
  dealStatus: string
  onClosingDateChange: (val: string | null) => void
  onClosingPriceChange: (val: number | null) => void
  onRequestClose: () => void
  defaultExpanded?: boolean
  readOnly?: boolean
}

export function CloseSection({
  actualClosingDate,
  actualClosingPrice,
  dealStatus,
  onClosingDateChange,
  onClosingPriceChange,
  onRequestClose,
  defaultExpanded = false,
  readOnly,
}: CloseSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [showClosePrompt, setShowClosePrompt] = useState(false)

  const isClosed = dealStatus === 'closed' || dealStatus === 'funded'
  const bothFilled = actualClosingDate != null && actualClosingPrice != null

  const handleDateChange = (val: string | null) => {
    onClosingDateChange(val)
    // Check if both fields are now filled and deal isn't already closed
    if (val != null && actualClosingPrice != null && !isClosed) {
      setShowClosePrompt(true)
    }
  }

  const handlePriceChange = (val: number | null) => {
    onClosingPriceChange(val)
    // Check if both fields are now filled and deal isn't already closed
    if (val != null && actualClosingDate != null && !isClosed) {
      setShowClosePrompt(true)
    }
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors bg-muted/30 hover:bg-muted/50"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <Flag className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Close</span>
          {bothFilled && isClosed && (
            <span className="ml-2 text-xs text-green-600 dark:text-green-400 font-medium">
              Closed
            </span>
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 space-y-4 bg-background">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DateField
              label="Actual Closing Date"
              value={actualClosingDate}
              onChange={handleDateChange}
              readOnly={readOnly}
            />
            <CurrencyField
              label="Actual Closing Price"
              value={actualClosingPrice}
              onChange={handlePriceChange}
              readOnly={readOnly}
            />
          </div>
          {bothFilled && !isClosed && (
            <p className="text-xs text-muted-foreground">
              Save the deal to apply these closing values. You'll be prompted to update the deal status.
            </p>
          )}
        </div>
      )}

      {/* Prompt to close the deal */}
      <AlertDialog open={showClosePrompt} onOpenChange={setShowClosePrompt}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark deal as Closed?</AlertDialogTitle>
            <AlertDialogDescription>
              Both the actual closing date and closing price have been entered.
              Would you like to set the deal status to "Closed"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Not Yet</AlertDialogCancel>
            <AlertDialogAction onClick={onRequestClose}>
              Yes, Close Deal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
