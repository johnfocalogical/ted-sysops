import { useState } from 'react'
import { format, parse } from 'date-fns'
import { CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface DatePickerFieldProps {
  value: string // YYYY-MM-DD or empty
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function DatePickerField({
  value,
  onChange,
  placeholder = 'Pick a date',
  disabled = false,
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false)

  // Convert YYYY-MM-DD string to Date object for the calendar
  const selectedDate = value
    ? parse(value, 'yyyy-MM-dd', new Date())
    : undefined

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(format(date, 'yyyy-MM-dd'))
    } else {
      onChange('')
    }
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground'
          )}
        >
          <CalendarDays className="mr-2 h-4 w-4" />
          {value ? format(selectedDate!, 'MMM d, yyyy') : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          defaultMonth={selectedDate}
        />
      </PopoverContent>
    </Popover>
  )
}
