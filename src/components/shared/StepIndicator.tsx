import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StepIndicatorProps {
  steps: string[]
  currentStep: number
  onStepClick?: (step: number) => void
}

export function StepIndicator({ steps, currentStep, onStepClick }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center w-full mb-8 px-2">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep
        const isCurrent = index === currentStep
        const isFuture = index > currentStep
        const isClickable = isCompleted && onStepClick

        return (
          <div key={step} className="flex items-center min-w-0">
            {/* Step circle */}
            <button
              type="button"
              onClick={() => isClickable && onStepClick(index)}
              disabled={!isClickable}
              className={cn(
                'flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all',
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

            {/* Step label - only show for current step */}
            {isCurrent && (
              <span className="ml-2 text-sm font-medium text-foreground">
                {step}
              </span>
            )}

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'w-6 sm:w-12 h-0.5 mx-1 sm:mx-2 flex-shrink',
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
