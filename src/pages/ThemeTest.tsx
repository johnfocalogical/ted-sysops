import { Link } from 'react-router-dom'
import { ArrowLeft, Zap, TrendingUp, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/shared/ThemeToggle'

export function ThemeTest() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="icon">
              <Link to="/">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <span className="text-xl font-bold">Theme Test</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Page Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* Typography */}
        <section>
          <h2 className="text-2xl font-bold mb-6 border-b border-border pb-2">Typography</h2>
          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-gradient-space">Gradient Title (text-5xl)</h1>
            <h1 className="text-4xl font-bold">Hero Display (text-4xl font-bold)</h1>
            <h2 className="text-3xl font-bold">Page Title (text-3xl font-bold)</h2>
            <h3 className="text-2xl font-bold">Section Heading (text-2xl font-bold)</h3>
            <h4 className="text-xl font-semibold">Card Title (text-xl font-semibold)</h4>
            <p className="text-base">Body text (text-base) - The quick brown fox jumps over the lazy dog.</p>
            <p className="text-sm text-muted-foreground">Small muted text (text-sm text-muted-foreground)</p>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Caption / Label (text-xs font-medium uppercase)
            </p>
          </div>
        </section>

        {/* Color Swatches */}
        <section>
          <h2 className="text-2xl font-bold mb-6 border-b border-border pb-2">Color Palette</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <div className="h-20 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-medium">Primary</span>
              </div>
              <p className="text-sm text-center">Teal #00D2AF</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-lg bg-accent flex items-center justify-center">
                <span className="text-accent-foreground font-medium">Accent</span>
              </div>
              <p className="text-sm text-center">Purple #7C3AED</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-lg bg-success flex items-center justify-center">
                <span className="text-white font-medium">Success</span>
              </div>
              <p className="text-sm text-center">Green #22C55E</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-lg bg-warning flex items-center justify-center">
                <span className="text-white font-medium">Warning</span>
              </div>
              <p className="text-sm text-center">Amber #F59E0B</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-lg bg-destructive flex items-center justify-center">
                <span className="text-destructive-foreground font-medium">Destructive</span>
              </div>
              <p className="text-sm text-center">Red #EF4444</p>
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section>
          <h2 className="text-2xl font-bold mb-6 border-b border-border pb-2">Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <Button>Primary (Teal)</Button>
            <Button className="bg-accent hover:bg-accent/90">
              <Zap className="mr-2 h-4 w-4" />
              Accent (Purple)
            </Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button className="glow-teal">With Glow</Button>
          </div>
        </section>

        {/* Status Badges */}
        <section>
          <h2 className="text-2xl font-bold mb-6 border-b border-border pb-2">Status Badges</h2>
          <div className="flex flex-wrap gap-4">
            <Badge className="bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400 border border-teal-300 dark:border-teal-700">
              Active Mission
            </Badge>
            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-300 dark:border-amber-700">
              Standby
            </Badge>
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-300 dark:border-green-700">
              Complete
            </Badge>
            <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-300 dark:border-red-700">
              Aborted
            </Badge>
            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-300 dark:border-purple-700">
              Automated
            </Badge>
          </div>
        </section>

        {/* Cards */}
        <section>
          <h2 className="text-2xl font-bold mb-6 border-b border-border pb-2">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Standard Card */}
            <Card className="border border-border">
              <CardHeader>
                <CardTitle>Standard Card</CardTitle>
                <CardDescription>123 Main St, Austin TX</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-success">+$15,000</p>
              </CardContent>
            </Card>

            {/* Gradient Card */}
            <Card className="gradient-space text-white border-0">
              <CardHeader>
                <CardTitle className="text-white">Gradient Card</CardTitle>
                <CardDescription className="text-white/80">Featured Mission</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">Special Feature</p>
              </CardContent>
            </Card>

            {/* Metric Card */}
            <Card className="border-l-4 border-l-primary border border-border">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Active Missions
                  </p>
                  <p className="text-4xl font-bold tabular-nums">24</p>
                  <p className="text-sm text-success flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    +12% this month
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Financial Display */}
        <section>
          <h2 className="text-2xl font-bold mb-6 border-b border-border pb-2">Financial Displays</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border border-border">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">
                  Projected Yield
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-success">$15,000</span>
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">
                  Pending Amount
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-warning">$8,500</span>
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">
                  Loss Amount
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-destructive">-$2,000</span>
                  <XCircle className="h-5 w-5 text-destructive" />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Gradients */}
        <section>
          <h2 className="text-2xl font-bold mb-6 border-b border-border pb-2">Gradients</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="gradient-space p-8 rounded-xl text-white">
              <h3 className="text-2xl font-bold mb-2">Space Gradient</h3>
              <p>Teal to Purple - for hero sections and featured content</p>
            </div>
            <div className="gradient-tactical p-8 rounded-xl text-white">
              <h3 className="text-2xl font-bold mb-2">Tactical Gradient</h3>
              <p>Teal to Amber - for action-oriented sections</p>
            </div>
          </div>
        </section>

        {/* Special Effects */}
        <section>
          <h2 className="text-2xl font-bold mb-6 border-b border-border pb-2">Special Effects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-8 rounded-xl border border-border glow-teal">
              <h3 className="text-xl font-bold mb-2 text-primary">Teal Glow Effect</h3>
              <p className="text-muted-foreground">Use sparingly for emphasis</p>
            </div>
            <div className="p-8 rounded-xl border border-border glow-purple">
              <h3 className="text-xl font-bold mb-2 text-accent">Purple Glow Effect</h3>
              <p className="text-muted-foreground">For advanced features</p>
            </div>
          </div>
        </section>

        {/* Status Icons */}
        <section>
          <h2 className="text-2xl font-bold mb-6 border-b border-border pb-2">Status Icons</h2>
          <div className="flex flex-wrap gap-8">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-success" />
              <span>Success</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-warning" />
              <span>Warning</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-6 w-6 text-destructive" />
              <span>Error</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-accent" />
              <span>Automator</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
