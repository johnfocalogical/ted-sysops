import { ShowingsList } from './ShowingsList'
import { DispositionDetails } from './DispositionDetails'
import { BuyerAssignment } from './BuyerAssignment'
import type { DealWithDetails } from '@/types/deal.types'

interface DispoTabProps {
  deal: DealWithDetails
  onBuyerChange: (contactId: string | null) => void
}

export function DispoTab({ deal, onBuyerChange }: DispoTabProps) {
  const buyerName = deal.buyer_contact
    ? `${deal.buyer_contact.first_name}${deal.buyer_contact.last_name ? ` ${deal.buyer_contact.last_name}` : ''}`
    : null

  return (
    <div className="space-y-8">
      {/* Showings Section */}
      <ShowingsList dealId={deal.id} />

      {/* Separator */}
      <div className="border-t" />

      {/* Disposition Details Section */}
      <DispositionDetails dealId={deal.id} />

      {/* Separator */}
      <div className="border-t" />

      {/* Buyer Assignment Section */}
      <BuyerAssignment
        currentBuyerContactId={deal.buyer_contact_id}
        currentBuyerName={buyerName}
        onBuyerChange={onBuyerChange}
      />
    </div>
  )
}
