# Design System - TED SYSOPS Space Force Theme

## 🚀 Design Philosophy

**"Futuristic Military Precision"**
- Clean, tactical interfaces
- Space Force aesthetics (think: advanced HQ, mission control)
- High contrast for readability
- Subtle tech elements without being over-the-top
- Professional but forward-thinking

---

## 🎨 Color Palette

### Primary Colors

**Teal (#00D2AF) - Technology & Digital Systems**
- HSL: 174 100% 41%
- Use for: Primary actions, links, active states, tech elements
- Represents: Advanced systems, digital precision, mission-ready

**Purple (#7C3AED) - Advanced Tech & Energy**
- HSL: 258 90% 66%
- Use for: Special features, accent elements, future-tech highlights
- Represents: Next-gen capabilities, energy systems, innovation

**Amber (#F59E0B) - Tactical Alerts**
- HSL: 38 92% 50%
- Use for: Warnings, pending actions, important notices
- Represents: Mission-critical info, tactical awareness

### Semantic Colors

**Success Green (#22C55E) - Mission Complete**
- HSL: 142 71% 45%
- Use for: Completed tasks, positive profit, successful operations

**Destructive Red (#EF4444) - Critical Alert**
- HSL: 0 84% 60%
- Use for: Errors, delete actions, critical warnings

### Neutral Colors

**Light Theme (Clean Command Center):**
- Background: Pure white (#FFFFFF)
- Text: Deep charcoal (#1F2937)
- Muted: Light gray (#F3F4F6)

**Dark Theme (Deep Space Operations):**
- Background: Deep space (#1A1F2E)
- Text: Almost white (#F9FAFB)
- Muted: Dark gray-blue (#2D3748)

---

## 🔤 Typography

### Font Family
**Inter** - Modern, precise, highly readable
- Geometric but warm
- Excellent for data-heavy displays
- Professional military-tech aesthetic

**Alternative:** "Space Grotesk" for a more futuristic feel (optional upgrade later)

### Type Scale
```
Hero/Display:     text-4xl (36px) font-bold
Page Title:       text-3xl (30px) font-bold
Section Heading:  text-2xl (24px) font-bold
Card Title:       text-xl (20px) font-semibold
Body:             text-base (16px) font-normal
Small:            text-sm (14px) font-normal
Caption:          text-xs (12px) font-medium
```

### Special Typography
```jsx
// Gradient text for hero sections
<h1 className="text-4xl font-bold text-gradient-space">
  Mission Control
</h1>

// Mono font for data/metrics (optional)
<span className="font-mono text-lg">$15,000</span>
```

---

## 🎯 Component Patterns

### Buttons

**Primary Action (Teal):**
```jsx
<Button className="bg-primary hover:bg-primary/90">
  Launch Mission
</Button>
```

**Advanced Feature (Purple Accent):**
```jsx
<Button className="bg-accent hover:bg-accent/90">
  Activate Automator
</Button>
```

**Secondary:**
```jsx
<Button variant="outline">
  Cancel
</Button>
```

**Destructive:**
```jsx
<Button variant="destructive">
  Delete Deal
</Button>
```

**With Glow Effect (use sparingly for hero CTAs):**
```jsx
<Button className="bg-primary hover:bg-primary/90 glow-teal">
  Get Started
</Button>
```

### Cards

**Standard Card:**
```jsx
<Card className="border border-border">
  <CardHeader>
    <CardTitle>Deal Intel</CardTitle>
    <CardDescription>123 Main St, Austin TX</CardDescription>
  </CardHeader>
  <CardContent>
    <p className="text-2xl font-bold text-success">+$15,000</p>
  </CardContent>
</Card>
```

**Glassmorphism Card (dark mode, special features):**
```jsx
<Card className="glass-dark border-0">
  <CardHeader>
    <CardTitle className="text-primary">Advanced Analytics</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

**Gradient Card (hero/featured):**
```jsx
<Card className="gradient-space text-white border-0">
  <CardHeader>
    <CardTitle>Featured Mission</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

### Status Badges

**Deal Statuses with Space Force Theme:**

```jsx
// Active - Teal (mission in progress)
<Badge className="bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400 border border-teal-300 dark:border-teal-700">
  Active Mission
</Badge>

// Pending - Amber (tactical hold)
<Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-300 dark:border-amber-700">
  Standby
</Badge>

// Closed - Green (mission complete)
<Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-300 dark:border-green-700">
  Complete
</Badge>

// Canceled - Red (mission aborted)
<Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-300 dark:border-red-700">
  Aborted
</Badge>

// Special - Purple (advanced status)
<Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-300 dark:border-purple-700">
  Automated
</Badge>
```

### Financial Displays

**Profit Display (Mission Success):**
```jsx
<div className="space-y-1">
  <p className="text-sm text-muted-foreground uppercase tracking-wide">
    Projected Yield
  </p>
  <div className="flex items-baseline gap-2">
    <span className="text-3xl font-bold text-success">
      ${profit.toLocaleString()}
    </span>
    <TrendingUp className="h-5 w-5 text-success" />
  </div>
</div>
```

**Metric Card (Tactical Display):**
```jsx
<Card className="border-l-4 border-l-primary">
  <CardContent className="pt-6">
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Active Missions
      </p>
      <p className="text-4xl font-bold tabular-nums">
        24
      </p>
      <p className="text-sm text-success flex items-center gap-1">
        <ArrowUp className="h-4 w-4" />
        +12% this month
      </p>
    </div>
  </CardContent>
</Card>
```

### Tables

**Tactical Data Table:**
```jsx
<Table>
  <TableHeader>
    <TableRow className="border-b border-border">
      <TableHead className="font-semibold uppercase text-xs tracking-wider">
        Mission ID
      </TableHead>
      <TableHead className="font-semibold uppercase text-xs tracking-wider">
        Status
      </TableHead>
      <TableHead className="font-semibold uppercase text-xs tracking-wider text-right">
        Yield
      </TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow className="hover:bg-muted/50 border-b border-border/50">
      <TableCell className="font-medium">DEAL-001</TableCell>
      <TableCell><StatusBadge status="active" /></TableCell>
      <TableCell className="text-right tabular-nums">$15,000</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

---

## 🎭 Dark Mode

### Enable Dark Mode
```jsx
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

function ThemeToggle() {
  const [theme, setTheme] = useState('light')
  
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    document.documentElement.classList.toggle('dark')
  }
  
  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme}>
      {theme === 'light' ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </Button>
  )
}
```

### Dark Mode Best Practices
- Use `dark:` prefix for dark mode variants
- Test ALL components in both modes
- Borders should be more subtle in dark mode
- Shadows work differently (use glow effects instead)
- Text contrast is critical - use `text-foreground`

---

## ✨ Special Effects (Use Sparingly)

### Glow Effects
```jsx
// Subtle glow on primary actions
<Button className="bg-primary glow-teal">
  Primary Action
</Button>

// Purple glow for advanced features
<div className="glow-purple p-4 rounded-lg">
  Advanced Feature
</div>
```

### Glassmorphism (Dark Mode Only)
```jsx
<Card className="dark:glass-dark">
  <CardContent>
    Semi-transparent with blur
  </CardContent>
</Card>
```

### Gradient Backgrounds
```jsx
// Hero section
<div className="gradient-space p-12 rounded-xl text-white">
  <h1 className="text-4xl font-bold">Welcome to Command Center</h1>
</div>

// Gradient text
<h1 className="text-5xl font-bold text-gradient-space">
  TED SYSOPS
</h1>
```

---

## 📐 Spacing & Layout

### Container
```
max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
```

### Grid Layouts
```jsx
// Dashboard cards
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Metric cards */}
</div>

// Deal cards
<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
  {/* Deal cards */}
</div>
```

### Spacing Scale
```
Micro:   gap-1  (4px)   - Icon spacing
Tight:   gap-2  (8px)   - Button groups
Normal:  gap-4  (16px)  - Form fields
Loose:   gap-6  (24px)  - Cards
XLoose:  gap-8  (32px)  - Sections
```

---

## 🎯 Icons

### Icon System
**Lucide React** - Modern, consistent, perfect for tech aesthetic

```bash
npm install lucide-react
```

### Common Icons
```jsx
import { 
  Home,           // Dashboard
  Building2,      // Properties
  Users,          // Contacts
  Zap,            // Automators (energy/speed)
  DollarSign,     // Financials
  CheckSquare,    // Checklist
  Activity,       // Activity log
  Settings,       // Settings
  TrendingUp,     // Profit
  AlertTriangle,  // Warnings
  Shield,         // Security/status
  Rocket          // Launch/action
} from 'lucide-react'
```

### Icon Sizing
```jsx
// Inline with text (16px)
<Zap className="h-4 w-4" />

// Standard (20px)
<Building2 className="h-5 w-5" />

// Large (24px)
<Rocket className="h-6 w-6" />
```

### Icon Colors
```jsx
// Primary
<Zap className="h-5 w-5 text-primary" />

// Accent
<Shield className="h-5 w-5 text-accent" />

// Success
<TrendingUp className="h-5 w-5 text-success" />

// Muted
<Settings className="h-5 w-5 text-muted-foreground" />
```

---

## 🎨 Color Usage Guidelines

### When to Use Each Color

**Teal (Primary):**
- Primary buttons and CTAs
- Links and navigation
- Active states
- Deal status: Active
- Tech/digital elements

**Purple (Accent):**
- Special features (Automators)
- Advanced capabilities
- Highlight important info
- Futuristic elements

**Amber (Warning):**
- Warnings and alerts
- Pending states
- Important notices
- Deal status: Pending

**Green (Success):**
- Success messages
- Positive profit numbers
- Deal status: Closed
- Completed tasks

**Red (Destructive):**
- Delete actions
- Errors
- Critical alerts
- Deal status: Canceled

---

## 📱 Responsive Design

### Mobile First
```jsx
// Stack on mobile, grid on desktop
<div className="flex flex-col lg:flex-row gap-4">

// Full width on mobile, contained on desktop
<div className="w-full lg:max-w-4xl">

// Hide complex tables on mobile, show simplified cards
<div className="hidden lg:block">
  <DataTable />
</div>
<div className="lg:hidden">
  <MobileCardList />
</div>
```

### Breakpoints
```
sm:  640px   - Large phones
md:  768px   - Tablets  
lg:  1024px  - Laptops
xl:  1280px  - Desktops
2xl: 1536px  - Large screens
```

---

## ♿ Accessibility

### Contrast Requirements
All color combinations meet WCAG AA standards:
- Text on background: 4.5:1 minimum
- Large text: 3:1 minimum
- Tested in both light and dark modes

### Focus States
All interactive elements have visible focus rings using the primary teal color.

### Keyboard Navigation
- All functionality accessible via keyboard
- Tab order follows visual order
- Escape closes modals/dialogs

---

## 🚀 Implementation Checklist

- [ ] Install Inter font from Google Fonts
- [ ] Copy `globals-space-force.css` to `src/globals.css`
- [ ] Import in main file: `import './globals.css'`
- [ ] Install shadcn/ui components
- [ ] Install lucide-react for icons
- [ ] Create ThemeToggle component
- [ ] Test all components in light mode
- [ ] Test all components in dark mode
- [ ] Verify color contrast
- [ ] Test responsive layouts

---

## 🎯 For Claude Code

When building components:

1. **Use the Space Force aesthetic:**
   - Clean, precise, tactical
   - Teal for primary, purple for advanced features
   - High contrast, readable

2. **Follow the palette:**
   - Teal: Primary actions, tech elements
   - Purple: Special features, automators
   - Amber: Warnings, tactical alerts
   - Green: Success, profit
   - Red: Errors, critical

3. **Component rules:**
   - shadcn/ui components only
   - Status badges with borders
   - Financial numbers bold and large
   - Uppercase labels for tactical feel
   - Use mono font for numbers (optional)

4. **Special effects:**
   - Use glow effects sparingly (hero sections only)
   - Gradients for special cards/headers
   - Glass effect in dark mode for overlays

---

## 🎨 Visual References

**Inspired by:**
- Space Force logo and branding
- Sci-fi HUD interfaces (Halo, Mass Effect)
- Modern military command centers
- Tech startup dashboards (Linear, Vercel)
- Tactical game UIs

**NOT like:**
- Overly skeuomorphic
- Too many animations
- Cluttered cyberpunk
- Generic corporate blue

**Perfect balance:** Professional meets futuristic. Tactical precision meets modern design.

---

**Your app will feel like a next-gen mission control center for real estate operations. 🚀**
