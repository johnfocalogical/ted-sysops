import { useState } from 'react'
import { Check } from 'lucide-react'
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
import { cn } from '@/lib/utils'
import type { TitleStatus } from '@/types/deal.types'

// Map the 6-value TitleStatus enum to 3 visual steps
const STEPS: { key: TitleStatus; label: string; values: TitleStatus[] }[] = [
  { key: 'not_ordered', label: 'Open', values: ['not_ordered'] },
  { key: 'ordered', label: 'Ordered', values: ['ordered', 'in_progress', 'clear', 'issues'] },
  { key: 'ready_to_close', label: 'Ready', values: ['ready_to_close'] },
]

function getStepIndex(status: TitleStatus): number {
  for (let i = 0; i < STEPS.length; i++) {
    if (STEPS[i].values.includes(status)) return i
  }
  return 0
}

interface TitleStatusStepperProps {
  value: TitleStatus
  onChange: (val: TitleStatus) => void
  readOnly?: boolean
}

export function TitleStatusStepper({ value, onChange, readOnly }: TitleStatusStepperProps) {
  const [confirmStep, setConfirmStep] = useState<number | null>(null)
  const currentIndex = getStepIndex(value)

  const handleStepClick = (stepIndex: number) => {
    if (readOnly || stepIndex === currentIndex) return

    // Going backward requires confirmation
    if (stepIndex < currentIndex) {
      setConfirmStep(stepIndex)
    } else {
      onChange(STEPS[stepIndex].key)
    }
  }

  const confirmBackward = () => {
    if (confirmStep != null) {
      onChange(STEPS[confirmStep].key)
      setConfirmStep(null)
    }
  }

  return (
    <div className="space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">Title Status</span>
      <div className="flex items-center gap-0">
        {STEPS.map((step, i) => {
          const isComplete = i < currentIndex
          const isActive = i === currentIndex
          const isPast = i < currentIndex

          return (
            <div key={step.key} className="flex items-center">
              {/* Connector line before (except first) */}
              {i > 0 && (
                <div
                  className={cn(
                    'h-0.5 w-8',
                    isPast ? 'bg-primary' : 'bg-border'
                  )}
                />
              )}

              {/* Step circle + label */}
              <button
                type="button"
                onClick={() => handleStepClick(i)}
                disabled={readOnly}
                className={cn(
                  'flex flex-col items-center gap-1 group',
                  !readOnly && 'cursor-pointer'
                )}
              >
                <div
                  className={cn(
                    'h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2',
                    isComplete && 'bg-primary border-primary text-primary-foreground',
                    isActive && 'border-primary bg-primary/10 text-primary',
                    !isComplete && !isActive && 'border-muted-foreground/30 text-muted-foreground/50',
                    !readOnly && !isActive && !isComplete && 'group-hover:border-muted-foreground/60'
                  )}
                >
                  {isComplete ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span
                  className={cn(
                    'text-[10px] font-medium',
                    isActive ? 'text-primary' : isComplete ? 'text-foreground' : 'text-muted-foreground/60'
                  )}
                >
                  {step.label}
                </span>
              </button>
            </div>
          )
        })}
      </div>

      {/* Confirmation dialog for going backward */}
      <AlertDialog open={confirmStep != null} onOpenChange={() => setConfirmStep(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move title status backward?</AlertDialogTitle>
            <AlertDialogDescription>
              This will change the title status from{' '}
              <strong>{STEPS[currentIndex]?.label}</strong> back to{' '}
              <strong>{confirmStep != null ? STEPS[confirmStep]?.label : ''}</strong>.
              Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBackward}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
