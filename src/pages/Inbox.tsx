import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Inbox as InboxIcon } from 'lucide-react'

export function Inbox() {
  return (
    <div>
      <PageHeader
        title="Inbox"
        subtitle="Manage your messages and notifications"
      />
      <Card>
        <CardContent className="py-12 text-center">
          <InboxIcon className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium mb-2">No Messages Yet</h3>
          <p className="text-muted-foreground">Your inbox is empty</p>
        </CardContent>
      </Card>
    </div>
  )
}
