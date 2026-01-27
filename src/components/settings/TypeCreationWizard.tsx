import { useState } from 'react'
import { User, Building2, UserCheck, ChevronLeft, ChevronRight, Loader2, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { IconPicker } from '@/components/shared/IconPicker'
import { ColorPicker } from '@/components/shared/ColorPicker'
import { TypeBadge } from '@/components/shared/TypeBadge'
import { useTeamContext } from '@/hooks/useTeamContext'
import {
  createTeamContactType,
  createTeamCompanyType,
  createTeamEmployeeType,
} from '@/lib/teamTypeService'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface TypeCreationWizardProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
  initialEntityType?: 'contact' | 'company' | 'employee'
}

type WizardStep = 'type' | 'details' | 'confirm'

export function TypeCreationWizard({
  open,
  onClose,
  onCreated,
  initialEntityType = 'contact',
}: TypeCreationWizardProps) {
  const { context } = useTeamContext()
  const [step, setStep] = useState<WizardStep>('type')
  const [entityType, setEntityType] = useState<'contact' | 'company' | 'employee'>(initialEntityType)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('User')
  const [color, setColor] = useState('blue')
  const [saving, setSaving] = useState(false)

  const resetForm = () => {
    setStep('type')
    setEntityType(initialEntityType)
    setName('')
    setDescription('')
    setIcon('User')
    setColor('blue')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleEntityTypeSelect = (type: 'contact' | 'company' | 'employee') => {
    setEntityType(type)
    setIcon(type === 'contact' ? 'User' : type === 'company' ? 'Building2' : 'UserCheck')
    setStep('details')
  }

  const handleBack = () => {
    if (step === 'details') setStep('type')
    else if (step === 'confirm') setStep('details')
  }

  const handleNext = () => {
    if (step === 'details') {
      if (!name.trim()) {
        toast.error('Name is required')
        return
      }
      setStep('confirm')
    }
  }

  const handleCreate = async () => {
    if (!context) return

    setSaving(true)
    try {
      const dto = {
        team_id: context.team.id,
        name,
        description: description || undefined,
        icon,
        color,
      }

      if (entityType === 'contact') {
        await createTeamContactType(dto)
      } else if (entityType === 'company') {
        await createTeamCompanyType(dto)
      } else {
        await createTeamEmployeeType(dto)
      }

      const label = entityType === 'contact' ? 'Contact' : entityType === 'company' ? 'Company' : 'Employee'
      toast.success(`${label} type created`)
      resetForm()
      onCreated()
    } catch (err) {
      console.error('Error creating type:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to create type')
    } finally {
      setSaving(false)
    }
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
          step === 'type' || step === 'details' || step === 'confirm'
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        )}
      >
        {step === 'details' || step === 'confirm' ? <Check className="h-4 w-4" /> : '1'}
      </div>
      <div className="w-8 h-0.5 bg-muted" />
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
          step === 'details' || step === 'confirm'
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        )}
      >
        {step === 'confirm' ? <Check className="h-4 w-4" /> : '2'}
      </div>
      <div className="w-8 h-0.5 bg-muted" />
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
          step === 'confirm'
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        )}
      >
        3
      </div>
    </div>
  )

  const renderTypeStep = () => (
    <div className="space-y-4">
      <p className="text-center text-muted-foreground">
        What type of category do you want to create?
      </p>

      <div className="grid grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => handleEntityTypeSelect('contact')}
          className={cn(
            'flex flex-col items-center gap-3 p-6 rounded-lg border-2 transition-all hover:border-primary/50',
            entityType === 'contact' && 'border-primary bg-primary/5'
          )}
        >
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-center">
            <p className="font-medium">Contact Type</p>
            <p className="text-xs text-muted-foreground">
              Categorize people
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleEntityTypeSelect('company')}
          className={cn(
            'flex flex-col items-center gap-3 p-6 rounded-lg border-2 transition-all hover:border-primary/50',
            entityType === 'company' && 'border-primary bg-primary/5'
          )}
        >
          <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center">
            <Building2 className="h-6 w-6 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="text-center">
            <p className="font-medium">Company Type</p>
            <p className="text-xs text-muted-foreground">
              Categorize businesses
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleEntityTypeSelect('employee')}
          className={cn(
            'flex flex-col items-center gap-3 p-6 rounded-lg border-2 transition-all hover:border-primary/50',
            entityType === 'employee' && 'border-primary bg-primary/5'
          )}
        >
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <UserCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div className="text-center">
            <p className="font-medium">Employee Type</p>
            <p className="text-xs text-muted-foreground">
              Categorize team members
            </p>
          </div>
        </button>
      </div>
    </div>
  )

  const renderDetailsStep = () => (
    <div className="space-y-4">
      {/* Preview */}
      <div className="flex items-center justify-center p-4 bg-muted/50 rounded-lg">
        <TypeBadge name={name || 'Type Name'} icon={icon} color={color} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={
            entityType === 'contact'
              ? 'e.g., Investor, Agent, Vendor'
              : 'e.g., Title Company, Lender'
          }
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe when to use this type..."
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Icon</Label>
          <IconPicker value={icon} onChange={setIcon} />
        </div>
        <div className="space-y-2">
          <Label>Color</Label>
          <ColorPicker value={color} onChange={setColor} />
        </div>
      </div>
    </div>
  )

  const renderConfirmStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-muted-foreground mb-4">
          Ready to create your new {entityType} type?
        </p>

        <div className="flex items-center justify-center p-6 bg-muted/50 rounded-lg">
          <TypeBadge name={name} icon={icon} color={color} />
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between py-2 border-b">
          <span className="text-muted-foreground">Type:</span>
          <span className="font-medium capitalize">{entityType}</span>
        </div>
        <div className="flex justify-between py-2 border-b">
          <span className="text-muted-foreground">Name:</span>
          <span className="font-medium">{name}</span>
        </div>
        {description && (
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Description:</span>
            <span className="font-medium truncate max-w-[200px]">{description}</span>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 'type' && 'Create New Type'}
            {step === 'details' && `New ${entityType === 'contact' ? 'Contact' : entityType === 'company' ? 'Company' : 'Employee'} Type`}
            {step === 'confirm' && 'Confirm Creation'}
          </DialogTitle>
          <DialogDescription>
            {step === 'type' && 'Choose whether to create a contact or company type.'}
            {step === 'details' && 'Configure the type details.'}
            {step === 'confirm' && 'Review and confirm your new type.'}
          </DialogDescription>
        </DialogHeader>

        {renderStepIndicator()}

        {step === 'type' && renderTypeStep()}
        {step === 'details' && renderDetailsStep()}
        {step === 'confirm' && renderConfirmStep()}

        <DialogFooter className="flex justify-between sm:justify-between">
          <div>
            {step !== 'type' && (
              <Button variant="ghost" onClick={handleBack}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            {step === 'details' && (
              <Button onClick={handleNext}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
            {step === 'confirm' && (
              <Button onClick={handleCreate} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Type'
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
