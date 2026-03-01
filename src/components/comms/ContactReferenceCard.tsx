import { useNavigate, useParams } from 'react-router-dom'
import { User, Phone, Mail } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { ContactReference } from '@/types/comms.types'

interface ContactReferenceCardProps {
  reference: ContactReference
}

export function ContactReferenceCard({ reference }: ContactReferenceCardProps) {
  const navigate = useNavigate()
  const { orgId, teamId } = useParams<{ orgId: string; teamId: string }>()

  const handleClick = () => {
    if (orgId && teamId) {
      navigate(`/org/${orgId}/team/${teamId}/contacts/${reference.contact_id}`)
    }
  }

  // Determine icon for contact method
  const contactMethodIcon = reference.primary_contact?.includes('@') ? (
    <Mail className="h-3 w-3 text-muted-foreground" />
  ) : reference.primary_contact ? (
    <Phone className="h-3 w-3 text-muted-foreground" />
  ) : null

  return (
    <button
      onClick={handleClick}
      className="flex items-start gap-3 px-3 py-2.5 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors text-left max-w-[280px]"
    >
      <div className="flex-shrink-0 mt-0.5">
        <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
          <User className="h-4 w-4 text-primary" />
        </div>
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm font-medium truncate">{reference.name}</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0"
          >
            {reference.type}
          </Badge>
        </div>
        {reference.primary_contact && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {contactMethodIcon}
            <span className="truncate">{reference.primary_contact}</span>
          </div>
        )}
      </div>
    </button>
  )
}

interface ContactReferenceCardsProps {
  references: ContactReference[]
}

export function ContactReferenceCards({ references }: ContactReferenceCardsProps) {
  if (references.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {references.map((ref) => (
        <ContactReferenceCard key={ref.contact_id} reference={ref} />
      ))}
    </div>
  )
}
