import { Building2, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ContactMethodsInput } from '@/components/shared/ContactMethodsInput'
import type { CompanyType } from '@/types/company.types'
import type { ContactMethodInput } from '@/types/contact.types'

export interface CompanyTypeSection {
  type_id: string
  type_name: string
  company_name: string
  contact_methods: ContactMethodInput[]
}

interface CompanyTypeSectionsInputProps {
  value: CompanyTypeSection[]
  onChange: (value: CompanyTypeSection[]) => void
  companyTypes: CompanyType[]
  disabled?: boolean
}

export function CompanyTypeSectionsInput({
  value,
  onChange,
  companyTypes,
  disabled = false,
}: CompanyTypeSectionsInputProps) {
  const selectedTypeIds = value.map((s) => s.type_id)

  const toggleType = (type: CompanyType) => {
    if (selectedTypeIds.includes(type.id)) {
      // Remove this type section
      onChange(value.filter((s) => s.type_id !== type.id))
    } else {
      // Add new section for this type
      onChange([
        ...value,
        {
          type_id: type.id,
          type_name: type.name,
          company_name: '',
          contact_methods: [],
        },
      ])
    }
  }

  const updateSection = (typeId: string, updates: Partial<CompanyTypeSection>) => {
    onChange(
      value.map((s) =>
        s.type_id === typeId ? { ...s, ...updates } : s
      )
    )
  }

  const removeSection = (typeId: string) => {
    onChange(value.filter((s) => s.type_id !== typeId))
  }

  return (
    <div className="space-y-4">
      {/* Company Type Selection */}
      <div className="border rounded-md p-3">
        <Label className="text-sm font-medium mb-2 block">Select Company Types</Label>
        <div className="grid grid-cols-2 gap-2">
          {companyTypes.map((type) => (
            <div key={type.id} className="flex items-center gap-2">
              <Checkbox
                id={`company-type-${type.id}`}
                checked={selectedTypeIds.includes(type.id)}
                onCheckedChange={() => toggleType(type)}
                disabled={disabled}
              />
              <label
                htmlFor={`company-type-${type.id}`}
                className="text-sm cursor-pointer"
              >
                {type.name}
              </label>
            </div>
          ))}
        </div>
        {companyTypes.length === 0 && (
          <p className="text-sm text-muted-foreground italic">
            No company types available
          </p>
        )}
      </div>

      {/* Sections for each selected type */}
      {value.map((section) => (
        <div
          key={section.type_id}
          className="border rounded-lg p-4 bg-muted/30 space-y-4"
        >
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <h4 className="font-medium text-sm">{section.type_name}</h4>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeSection(section.type_id)}
              disabled={disabled}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Company Name Input */}
          <div className="space-y-2">
            <Label htmlFor={`company-name-${section.type_id}`}>
              Company Name *
            </Label>
            <Input
              id={`company-name-${section.type_id}`}
              value={section.company_name}
              onChange={(e) =>
                updateSection(section.type_id, { company_name: e.target.value })
              }
              placeholder={`Enter ${section.type_name.toLowerCase()} company name`}
              disabled={disabled}
            />
          </div>

          {/* Contact Methods for this relationship */}
          <div className="space-y-2">
            <Label>Work Contact Methods</Label>
            <p className="text-xs text-muted-foreground">
              Contact info for this person at this company
            </p>
            <ContactMethodsInput
              value={section.contact_methods}
              onChange={(methods) =>
                updateSection(section.type_id, { contact_methods: methods })
              }
              disabled={disabled}
            />
          </div>
        </div>
      ))}

      {/* Empty state hint */}
      {value.length === 0 && companyTypes.length > 0 && (
        <p className="text-sm text-muted-foreground text-center py-2">
          Select company types above to add company details
        </p>
      )}
    </div>
  )
}
