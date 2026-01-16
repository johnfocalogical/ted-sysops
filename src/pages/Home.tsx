import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Rocket, Building2, Users, Zap, DollarSign, MessageSquare, BarChart3,
  Menu, X, UserPlus, LogIn, CheckCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/shared/ThemeToggle'

const features = [
  {
    icon: Building2,
    title: 'Deal Pipeline',
    description: 'Visual kanban board to track every deal from acquisition to closing',
    items: ['Multi-stage pipeline view', 'Contract tracking', 'Financial projections']
  },
  {
    icon: Zap,
    title: 'Automated Workflows',
    description: 'Step-by-step automators guide your team through complex transactions',
    items: ['Step-by-step guidance', 'Auto-fill deal data', 'Checklist generation'],
    accent: true
  },
  {
    icon: DollarSign,
    title: 'Financial Tracking',
    description: 'Real-time profit calculations, expense tracking, and commission management',
    items: ['Profit projections', 'Expense tracking', 'Commission splits']
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Comments, notes, and activity logs keep everyone on the same page',
    items: ['Team assignments', 'Activity timeline', 'Role permissions']
  },
  {
    icon: MessageSquare,
    title: 'Contact Management',
    description: 'Centralized hub for sellers, buyers, and vendors',
    items: ['Role-based contacts', 'Communication history', 'Deal associations']
  },
  {
    icon: BarChart3,
    title: 'Custom Reports',
    description: 'Insights into pipeline health, lead sources, and team performance',
    items: ['Pipeline analytics', 'Lead source tracking', 'Performance metrics']
  }
]

const steps = [
  {
    number: '01',
    title: 'Sign Up',
    description: 'Create your free account in seconds. No credit card required.'
  },
  {
    number: '02',
    title: 'Add Deals',
    description: 'Import your existing deals or create new ones with our guided forms.'
  },
  {
    number: '03',
    title: 'Close More',
    description: 'Track progress, automate workflows, and maximize your profits.'
  }
]

export function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
    setMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <Rocket className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">TED SYSOPS</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <button
                onClick={() => scrollToSection('features')}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                How It Works
              </button>
            </nav>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <ThemeToggle />
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </Link>
              </Button>
              <Button asChild size="sm" className="bg-primary hover:bg-primary/90">
                <Link to="/signup">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Sign Up
                </Link>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center gap-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pt-4 pb-2 border-t border-border mt-4">
              <nav className="flex flex-col gap-2">
                <button
                  onClick={() => scrollToSection('features')}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground py-2 text-left"
                >
                  Features
                </button>
                <button
                  onClick={() => scrollToSection('how-it-works')}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground py-2 text-left"
                >
                  How It Works
                </button>
                <div className="flex gap-2 pt-2">
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link to="/login">Login</Link>
                  </Button>
                  <Button asChild size="sm" className="flex-1 bg-primary hover:bg-primary/90">
                    <Link to="/signup">Sign Up</Link>
                  </Button>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="gradient-space py-24 px-4">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">
            Manage Your Real Estate Deals From Lead to Close
          </h1>
          <p className="text-lg sm:text-xl mb-8 opacity-90">
            The all-in-one platform for wholesalers, flippers, and investors to track deals,
            automate workflows, and maximize profits.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 glow-teal">
              <Link to="/signup">
                <Rocket className="mr-2 h-5 w-5" />
                Get Started Free
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10"
              onClick={() => scrollToSection('features')}
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Everything You Need to Close More Deals</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Powerful tools designed specifically for real estate professionals who want to
              streamline their operations and increase profits.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="border border-border hover:border-primary/30 transition-colors">
                <CardHeader>
                  <feature.icon className={`h-10 w-10 mb-2 ${feature.accent ? 'text-accent' : 'text-primary'}`} />
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    {feature.items.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Get started in minutes with our simple three-step process.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={step.number} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary text-2xl font-bold mb-4">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2">
                    {/* Arrow connector would go here */}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 gradient-space">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Close More Deals?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Join thousands of real estate professionals who are already using TED SYSOPS
            to streamline their operations.
          </p>
          <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 glow-teal">
            <Link to="/signup">
              <Rocket className="mr-2 h-5 w-5" />
              Get Started Free
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              <span className="font-bold">TED SYSOPS</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Real Estate Deal Management Platform
            </p>
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">
                Login
              </Link>
              <Link to="/signup" className="text-sm text-muted-foreground hover:text-foreground">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
