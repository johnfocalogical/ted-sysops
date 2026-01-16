import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StepIndicatorProps {
  steps: string[]
  currentStep: number
  onStepClick?: (step: number) => void
}

export function StepIndicator({ steps, currentStep, onStepClick }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center w-full mb-8">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep
        const isCurrent = index === currentStep
        const isFuture = index > currentStep
        const isClickable = isCompleted && onStepClick

        return (
          <div key={step} className="flex items-center">
            {/* Step circle */}
            <button
              type="button"
              onClick={() => isClickable && onStepClick(index)}
              disabled={!isClickable}
              className={cn(
                'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all',
                'text-sm font-semibold',
                isCompleted && 'bg-primary border-primary text-primary-foreground cursor-pointer hover:bg-primary/90',
                isCurrent && 'bg-primary border-primary text-primary-foreground',
                isFuture && 'bg-background border-muted-foreground/30 text-muted-foreground',
                !isClickable && 'cursor-default'
              )}
            >
              {isCompleted ? (
                <Check className="h-5 w-5" />
              ) : (
                index + 1
              )}
            </button>

            {/* Step label (below circle on mobile, beside on desktop) */}
            <span
              className={cn(
                'hidden sm:block ml-2 text-sm font-medium',
                (isCompleted || isCurrent) && 'text-foreground',
                isFuture && 'text-muted-foreground'
              )}
            >
              {step}
            </span>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'w-8 sm:w-16 h-0.5 mx-2 sm:mx-4',
                  index < currentStep ? 'bg-primary' : 'bg-muted-foreground/30'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
