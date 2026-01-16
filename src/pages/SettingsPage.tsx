import { User, TextCursor, Megaphone, ListChecks, Workflow, Plug } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/PageHeader'
import { TeamMembersSection } from '@/components/settings/TeamMembersSection'

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
    <div className="space-y-8">
      <PageHeader
        title="Settings"
        subtitle="Configure your workspace"
      />

      {/* Team Members Section */}
      <TeamMembersSection />

      {/* Other Settings (Coming Soon) */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Other Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {settingCategories.map((setting) => (
            <Card
              key={setting.title}
              className="hover:border-primary/30 transition-colors cursor-pointer opacity-60"
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
    </div>
  )
}
