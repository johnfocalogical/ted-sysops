import { User, TextCursor, Megaphone, ListChecks, Workflow, Plug } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/PageHeader'

export function SettingsPage() {
  const settingCategories = [
    {
      title: 'Profile',
      description: 'Update your personal information',
      icon: User,
    },
    {
      title: 'Custom Fields',
      description: 'Configure deal custom fields',
      icon: TextCursor,
    },
    {
      title: 'Lead Sources',
      description: 'Manage marketing channels',
      icon: Megaphone,
    },
    {
      title: 'Selling Reasons',
      description: 'Configure seller motivation options',
      icon: ListChecks,
    },
    {
      title: 'Automators',
      description: 'Build workflow automations',
      icon: Workflow,
    },
    {
      title: 'Integrations',
      description: 'Connect external services',
      icon: Plug,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Configure your workspace"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {settingCategories.map((setting) => (
          <Card
            key={setting.title}
            className="hover:border-primary/30 transition-colors cursor-pointer"
          >
            <CardContent className="pt-6">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <setting.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">{setting.title}</h3>
              <p className="text-sm text-muted-foreground">{setting.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
