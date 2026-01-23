import { useState } from 'react'
import { Check } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { TYPE_COLORS, type TypeColor } from '@/types/type-system.types'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  disabled?: boolean
}

// Color preview classes for the trigger button
const colorPreviewClasses: Record<TypeColor, string> = {
  gray: 'bg-gray-400',
  slate: 'bg-slate-400',
  blue: 'bg-blue-400',
  teal: 'bg-teal-400',
  green: 'bg-green-400',
  purple: 'bg-purple-400',
  amber: 'bg-amber-400',
  orange: 'bg-orange-400',
  red: 'bg-red-400',
  pink: 'bg-pink-400',
  indigo: 'bg-indigo-400',
  cyan: 'bg-cyan-400',
}

// Color swatch classes for the grid
const colorSwatchClasses: Record<TypeColor, string> = {
  gray: 'bg-gray-100 hover:bg-gray-200 border-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-600',
  slate: 'bg-slate-100 hover:bg-slate-200 border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-600',
  blue: 'bg-blue-100 hover:bg-blue-200 border-blue-300 dark:bg-blue-800 dark:hover:bg-blue-700 dark:border-blue-600',
  teal: 'bg-teal-100 hover:bg-teal-200 border-teal-300 dark:bg-teal-800 dark:hover:bg-teal-700 dark:border-teal-600',
  green: 'bg-green-100 hover:bg-green-200 border-green-300 dark:bg-green-800 dark:hover:bg-green-700 dark:border-green-600',
  purple: 'bg-purple-100 hover:bg-purple-200 border-purple-300 dark:bg-purple-800 dark:hover:bg-purple-700 dark:border-purple-600',
  amber: 'bg-amber-100 hover:bg-amber-200 border-amber-300 dark:bg-amber-800 dark:hover:bg-amber-700 dark:border-amber-600',
  orange: 'bg-orange-100 hover:bg-orange-200 border-orange-300 dark:bg-orange-800 dark:hover:bg-orange-700 dark:border-orange-600',
  red: 'bg-red-100 hover:bg-red-200 border-red-300 dark:bg-red-800 dark:hover:bg-red-700 dark:border-red-600',
  pink: 'bg-pink-100 hover:bg-pink-200 border-pink-300 dark:bg-pink-800 dark:hover:bg-pink-700 dark:border-pink-600',
  indigo: 'bg-indigo-100 hover:bg-indigo-200 border-indigo-300 dark:bg-indigo-800 dark:hover:bg-indigo-700 dark:border-indigo-600',
  cyan: 'bg-cyan-100 hover:bg-cyan-200 border-cyan-300 dark:bg-cyan-800 dark:hover:bg-cyan-700 dark:border-cyan-600',
}

// Check mark colors
const checkColors: Record<TypeColor, string> = {
  gray: 'text-gray-600 dark:text-gray-200',
  slate: 'text-slate-600 dark:text-slate-200',
  blue: 'text-blue-600 dark:text-blue-200',
  teal: 'text-teal-600 dark:text-teal-200',
  green: 'text-green-600 dark:text-green-200',
  purple: 'text-purple-600 dark:text-purple-200',
  amber: 'text-amber-600 dark:text-amber-200',
  orange: 'text-orange-600 dark:text-orange-200',
  red: 'text-red-600 dark:text-red-200',
  pink: 'text-pink-600 dark:text-pink-200',
  indigo: 'text-indigo-600 dark:text-indigo-200',
  cyan: 'text-cyan-600 dark:text-cyan-200',
}

const COLOR_NAMES = Object.keys(TYPE_COLORS) as TypeColor[]

export function ColorPicker({ value, onChange, disabled = false }: ColorPickerProps) {
  const [open, setOpen] = useState(false)

  const handleSelect = (color: TypeColor) => {
    onChange(color)
    setOpen(false)
  }

  const currentColor = (value as TypeColor) || 'gray'

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-[100px] justify-between"
        >
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'h-4 w-4 rounded-full',
                colorPreviewClasses[currentColor] || colorPreviewClasses.gray
              )}
            />
            <span className="text-xs capitalize">{value || 'gray'}</span>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-3" align="start">
        <div className="grid grid-cols-4 gap-2">
          {COLOR_NAMES.map((color) => (
            <button
              key={color}
              type="button"
              className={cn(
                'h-8 w-8 rounded-md border-2 flex items-center justify-center transition-all',
                colorSwatchClasses[color],
                value === color && 'ring-2 ring-offset-2 ring-primary'
              )}
              onClick={() => handleSelect(color)}
              title={color}
            >
              {value === color && (
                <Check className={cn('h-4 w-4', checkColors[color])} />
              )}
            </button>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs text-muted-foreground text-center capitalize">
            {value || 'gray'}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  )
}
