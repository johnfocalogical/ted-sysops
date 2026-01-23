import { useState, useMemo } from 'react'
import * as LucideIcons from 'lucide-react'
import { Check, Search } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { TYPE_ICONS, type TypeIcon } from '@/types/type-system.types'

interface IconPickerProps {
  value: string
  onChange: (icon: string) => void
  disabled?: boolean
}

// Create a mapping of icon names to components
const iconComponents: Record<string, LucideIcons.LucideIcon> = {}
for (const iconName of TYPE_ICONS) {
  const Icon = LucideIcons[iconName as keyof typeof LucideIcons] as LucideIcons.LucideIcon
  if (Icon) {
    iconComponents[iconName] = Icon
  }
}

export function IconPicker({ value, onChange, disabled = false }: IconPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filteredIcons = useMemo(() => {
    if (!search.trim()) return TYPE_ICONS
    const searchLower = search.toLowerCase()
    return TYPE_ICONS.filter((icon) => icon.toLowerCase().includes(searchLower))
  }, [search])

  const SelectedIcon = iconComponents[value] || LucideIcons.User

  const handleSelect = (iconName: TypeIcon) => {
    onChange(iconName)
    setOpen(false)
    setSearch('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-[120px] justify-between"
        >
          <div className="flex items-center gap-2">
            <SelectedIcon className="h-4 w-4" />
            <span className="text-xs text-muted-foreground truncate max-w-[60px]">
              {value}
            </span>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search icons..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
        </div>
        <div className="p-2 max-h-[240px] overflow-y-auto">
          <div className="grid grid-cols-6 gap-1">
            {filteredIcons.map((iconName) => {
              const Icon = iconComponents[iconName]
              if (!Icon) return null

              return (
                <Button
                  key={iconName}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'h-9 w-9 p-0 relative',
                    value === iconName && 'bg-primary/10 text-primary'
                  )}
                  onClick={() => handleSelect(iconName)}
                  title={iconName}
                >
                  <Icon className="h-4 w-4" />
                  {value === iconName && (
                    <Check className="absolute bottom-0 right-0 h-3 w-3 text-primary" />
                  )}
                </Button>
              )
            })}
          </div>
          {filteredIcons.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">
              No icons found
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
