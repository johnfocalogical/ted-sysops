# Real Estate Deal Management Platform

## Project Overview
Workflow-centric deal management platform for real estate investors and wholesalers. Manages the entire deal lifecycle from lead intake to closing, with emphasis on automation through "Automators" (guided workflow processes) and detailed financial tracking.

## Tech Stack
- **Frontend**: React + Vite + shadcn/ui + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Realtime + Storage)
- **State Management**: Zustand or Jotai (lightweight)
- **Forms**: React Hook Form + Zod validation
- **Tables**: TanStack Table (React Table v8)
- **Design Theme**: Space Force - Futuristic military aesthetic with teal primary color

## Critical Context Files
Before starting any feature, READ these relevant guides:

### Domain Knowledge
- **REAL-ESTATE-DOMAIN.md** - Industry terminology, deal types, workflows, and business concepts
- **AUTOMATOR-PATTERNS.md** - The automator/process engine (our core differentiator)

### Technical Guides  
- **SUPABASE-PATTERNS.md** - Database patterns, RLS, realtime subscriptions
- **FINANCIAL-PATTERNS.md** - Approach to profit calculations, commissions, JV splits
- **UI-PATTERNS.md** - Generic component patterns (how to build forms, tables, layouts)
- **DESIGN-SYSTEM-SPACE-FORCE.md** - Specific design specs (colors, styles, Space Force theme) ⭐

### Data Reference
- **DATA-SCHEMA.md** - High-level data model and relationships (specific schema in GitHub issues)

## Design System Usage

**We use TWO design-related files that work together:**

### UI-PATTERNS.md (Generic "How To" Patterns)
Use this to learn:
- How to structure forms with React Hook Form
- How to build tables with sorting/filtering
- How to create modals and dialogs
- Generic shadcn/ui component patterns
- Layout patterns (tabs, master-detail, etc.)

### DESIGN-SYSTEM-SPACE-FORCE.md (Specific "What Colors/Styles" Theme)
Use this to learn:
- Exact colors to use (Teal #00D2AF primary, Purple #7C3AED accent)
- Typography specs (Inter font, sizes)
- Component styling (button colors, badge styles, card designs)
- Space Force futuristic military aesthetic
- Light and dark theme specifications

**Both work together:**
- UI-PATTERNS tells you HOW to build a component
- DESIGN-SYSTEM tells you WHAT colors/styles to apply

**Example workflow:**
1. Read UI-PATTERNS.md: "Here's how to build a form with validation"
2. Read DESIGN-SYSTEM-SPACE-FORCE.md: "Use teal for primary buttons, purple for automators"
3. Build the form following both guides

## Project Architecture
```
src/
├── components/
│   ├── deals/          # Deal-specific components
│   ├── contacts/       # Contact management  
│   ├── automators/     # Process/workflow UI
│   ├── ui/             # shadcn/ui components
│   └── shared/         # Reusable components
├── lib/
│   ├── supabase.js     # Supabase client
│   ├── calculations.js # Financial logic
│   └── automator-engine.js # Process execution
├── hooks/              # Custom React hooks
├── pages/              # Route pages
└── stores/             # State management
```

## Key Principles

### 1. Read Issues First
When starting a feature, ALWAYS read the GitHub issue completely. It contains:
- Specific requirements and acceptance criteria
- Exact field names and validations
- Business rules for THIS feature
- Files to create/modify

### 2. Reference Context Files for Patterns
Use context files to understand:
- How to structure similar features
- Best practices for this domain
- Common patterns and approaches
- Technical implementation strategies

### 3. Multi-Tab Interface Philosophy
This is a data-dense application. Users expect:
- Lots of information visible at once
- Tabbed interfaces for deal details
- Master-detail layouts (list + sidebar)
- Quick actions and keyboard shortcuts

### 4. Real-time Collaboration
Multiple users work on the same deals simultaneously:
- Use Supabase Realtime for live updates
- Show "user is editing" indicators
- Handle optimistic updates with conflict resolution
- Activity logging for audit trail

### 5. Flexible Configuration
Organizations customize heavily:
- Custom fields (JSONB storage)
- Configurable dropdown options
- Flexible commission rules
- User-defined processes/automators

### 6. Space Force Design Aesthetic
Our app has a unique visual identity:
- Futuristic military precision (think: mission control, Space Force)
- Teal (#00D2AF) primary color - technology, digital systems
- Purple (#7C3AED) accent - advanced features, automators
- Professional but forward-thinking
- Clean, tactical interfaces
- Both light and dark themes

## Development Workflow

1. **Pick an issue from GitHub Projects "To Do" column**
2. **Read the issue completely** - it has specific requirements
3. **Check relevant context files** for patterns and approaches
   - Domain knowledge files for business concepts
   - Technical pattern files for implementation approach
   - UI-PATTERNS.md for component structure
   - DESIGN-SYSTEM-SPACE-FORCE.md for colors and styling
4. **Ask clarifying questions** if requirements are ambiguous
5. **Build iteratively** - start simple, add complexity
6. **Test as you go** - verify each piece works
7. **Follow the Space Force design theme** - use teal/purple colors, tactical feel
8. **Commit with issue reference** - `git commit -m "feat: description (#issue-number)"`
9. **Update GitHub** - move issue to Done, add comments

## Common Patterns to Follow

### Database Queries
- Always filter by `org_id` for multi-tenancy
- Use RLS policies for security
- Leverage Supabase Realtime for live data
- Index commonly queried fields

### Forms
- Use React Hook Form + Zod validation
- shadcn/ui form components
- Show loading states
- Display errors inline
- Optimistic updates with rollback
- Follow Space Force styling (teal buttons, proper spacing)

### Financial Calculations
- Calculate on client for immediate feedback
- Verify on server for accuracy
- Log all changes to financial fields
- Use decimal precision for money

### Automators/Processes
- Store as JSON definitions
- Track state per deal instance
- Immutable once completed
- Can update deal data and checklists
- Use purple accent color for automator buttons/features

### UI Components
- Use shadcn/ui components exclusively
- Teal (#00D2AF) for primary actions
- Purple (#7C3AED) for automators and advanced features
- Amber (#F59E0B) for warnings
- Green (#22C55E) for success/profit
- Red (#EF4444) for errors/delete
- Status badges have colored backgrounds with borders
- Financial numbers are bold and large (text-2xl font-bold)

## Testing Strategy
- **Manual testing** during development
- **Test with realistic data** - use wholesaling scenarios
- **Multi-user testing** - verify realtime updates work
- **Financial accuracy** - double-check calculations
- **Permission testing** - verify RLS works correctly
- **Theme testing** - verify in both light and dark modes

## Common Gotchas

### Supabase
- RLS policies can slow queries - index carefully
- Realtime subscriptions need cleanup
- JSONB queries require GIN indexes
- Row-level security affects all queries

### React/State
- Avoid prop drilling - use context or state management
- Memoize expensive calculations
- Clean up subscriptions in useEffect
- Handle loading and error states

### Financial Logic
- Always use Decimal/precise math for money
- Commission rules can be complex - test thoroughly
- JV splits affect profit calculations
- Expenses must be tracked per deal

### Design System
- Always reference DESIGN-SYSTEM-SPACE-FORCE.md for colors
- Don't use generic blue - use our teal (#00D2AF)
- Purple is for special features (automators)
- Test components in both light and dark themes
- Use the Space Force tactical aesthetic (clean, precise)

## When to Ask for Help

**Ask me if you're unsure about:**
- How to interpret vague requirements
- Best approach for complex features
- Data modeling decisions
- Performance concerns
- Security implications
- Which colors to use (check DESIGN-SYSTEM-SPACE-FORCE.md first)

**Don't ask me for:**
- Specific business rules (they're in the issue)
- Exact field names (they're in the issue)
- Basic React/Supabase syntax (use docs)

## Quick Reference

### Useful Commands
```bash
# Start dev server
npm run dev

# Add shadcn component
npx shadcn-ui@latest add [component]

# Generate types from Supabase
npx supabase gen types typescript --project-id [id] > src/types/database.types.ts

# Run linting
npm run lint
```

### Design Quick Reference
```jsx
// Primary button (Teal)
<Button className="bg-primary hover:bg-primary/90">Save Deal</Button>

// Automator button (Purple)
<Button className="bg-accent hover:bg-accent/90">
  <Zap className="mr-2 h-4 w-4" />
  Run Automator
</Button>

// Status badge
<Badge className="bg-teal-100 text-teal-800 border border-teal-300">
  Active
</Badge>

// Profit display
<div className="text-3xl font-bold text-success">
  +${profit.toLocaleString()}
</div>
```

### Supabase Resources
- Project URL: [Set in .env.local]
- Anon Key: [Set in .env.local]  
- Dashboard: https://supabase.com/dashboard

### GitHub Resources
- Repository: [Your repo URL]
- Projects Board: [Your board URL]
- Issues: [Your issues URL]

### Design Resources
- Theme CSS: src/globals.css
- Design System: DESIGN-SYSTEM-SPACE-FORCE.md
- Setup Guide: SPACE-FORCE-SETUP.md (reference)
- Primary Color: #00D2AF (Teal)
- Accent Color: #7C3AED (Purple)

---

**Remember:** Context files provide guidance and patterns. GitHub issues provide specific requirements. Read both! And always follow the Space Force design theme for a consistent, professional look.
