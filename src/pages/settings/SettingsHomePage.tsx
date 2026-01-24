import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { SettingsCard } from '@/components/settings/SettingsCard'
import { ViewOnlyBanner } from '@/components/shared/ViewOnlyBanner'
import { usePermissions } from '@/hooks/usePermissions'
import { SETTINGS_CATEGORIES, ALL_SETTINGS_ITEMS } from '@/config/settingsConfig'

export function SettingsHomePage() {
  const { isViewOnly } = usePermissions('settings')
  const [searchQuery, setSearchQuery] = useState('')

  // Filter items based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return SETTINGS_CATEGORIES
    }

    const query = searchQuery.toLowerCase()
    return SETTINGS_CATEGORIES.map((category) => ({
      ...category,
      items: category.items.filter(
        (item) =>
          item.label.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query)
      ),
    })).filter((category) => category.items.length > 0)
  }, [searchQuery])

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings Home</h1>
        <p className="text-muted-foreground mt-1">
          Configure your team workspace
        </p>
      </div>

      {/* View Only Banner */}
      {isViewOnly && <ViewOnlyBanner className="mb-6" />}

      {/* Search */}
      <div className="relative mb-8 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search settings..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Categories */}
      <div className="space-y-8">
        {filteredCategories.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No settings found matching "{searchQuery}"
          </p>
        ) : (
          filteredCategories.map((category) => (
            <section key={category.id}>
              <h2 className="text-lg font-semibold mb-4">{category.label}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.items.map((item) => (
                  <SettingsCard
                    key={item.id}
                    icon={item.icon}
                    label={item.label}
                    description={item.description}
                    route={item.route}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  )
}
