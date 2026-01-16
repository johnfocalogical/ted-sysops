# TED SYSOPS - Real Estate Deal Management

Workflow-centric deal management platform for real estate investors and wholesalers. Manages the entire deal lifecycle from lead intake to closing, with emphasis on automation through "Automators" (guided workflow processes) and detailed financial tracking.

## Tech Stack

- **Frontend**: React + Vite + TypeScript
- **UI Components**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Realtime + Storage)
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **Design Theme**: Space Force (Futuristic Military Aesthetic)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ted-sysops

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials
```

### Environment Setup

Create a `.env.local` file with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

You can find these values in your Supabase Dashboard under Project Settings > API.

### Development

```bash
# Start the development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

## Project Structure

```
src/
├── components/
│   ├── ui/             # shadcn/ui components
│   ├── shared/         # Reusable app components
│   ├── deals/          # Deal-specific components
│   └── contacts/       # Contact components
├── lib/
│   ├── supabase.ts     # Supabase client
│   └── utils.ts        # Utility functions
├── hooks/              # Custom React hooks
├── pages/              # Route pages
└── stores/             # Zustand stores
```

## Design System

This project uses the **Space Force** design theme - a futuristic military aesthetic with:

- **Primary Color**: Teal (#00D2AF) - Technology & digital systems
- **Accent Color**: Purple (#7C3AED) - Advanced features & automators
- **Warning**: Amber (#F59E0B) - Tactical alerts
- **Success**: Green (#22C55E) - Mission complete
- **Destructive**: Red (#EF4444) - Critical alerts

Visit `/theme-test` in the app to see all theme colors and components.

## Development Guide

For detailed development instructions, patterns, and guidelines, see:

- **[CLAUDE.md](./CLAUDE.md)** - Main development guide
- **[DESIGN-SYSTEM-SPACE-FORCE.md](./DESIGN-SYSTEM-SPACE-FORCE.md)** - Design system specifications
- **[UI-PATTERNS.md](./UI-PATTERNS.md)** - Component patterns
- **[SUPABASE-PATTERNS.md](./SUPABASE-PATTERNS.md)** - Database patterns

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## License

Private - All rights reserved
