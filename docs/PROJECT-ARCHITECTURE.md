# TED SysOps - Project Architecture

> **Purpose**: This document provides a comprehensive overview of the TED SysOps platform architecture for use in Claude projects. It enables AI assistants to understand the existing system and write detailed specifications for future features and epics.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Directory Structure](#3-directory-structure)
4. [Database Schema](#4-database-schema)
5. [Authorization System](#5-authorization-system)
6. [Key Architectural Patterns](#6-key-architectural-patterns)
7. [Current Implementation Status](#7-current-implementation-status)
8. [Writing Future Epics](#8-writing-future-epics)

---

## 1. Project Overview

### Platform Purpose
TED SysOps is a **workflow-centric deal management platform** for real estate investors and wholesalers. It manages the entire deal lifecycle from lead intake to closing, with emphasis on:
- **Automators**: Guided workflow processes (the core differentiator)
- **Financial Tracking**: Detailed profit calculations, commissions, JV splits
- **Team Collaboration**: Multi-user workspaces with role-based permissions

### Multi-Tenancy Architecture

```
Organization (billing entity / company)
    └── Team (workspace within organization)
         └── Team Members (users with roles and permissions)
              └── Deals, Contacts, Transactions, etc.
```

**Key principles:**
- Organizations are the top-level billing entity
- Teams are isolated workspaces within an organization
- Users can belong to multiple teams across multiple organizations
- All data is scoped by organization/team for complete isolation

### Design Theme: Space Force
The application uses a futuristic military aesthetic:
- **Primary Color**: Teal (#00D2AF) - technology, digital systems
- **Accent Color**: Purple (#7C3AED) - advanced features, automators
- Clean, tactical interfaces with both light and dark themes

---

## 2. Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.0 | UI library |
| Vite | 7.2.4 | Build tool & dev server |
| TypeScript | 5.9.3 | Type safety |
| React Router DOM | 7.12.0 | Client-side routing |

### UI & Styling
| Technology | Version | Purpose |
|------------|---------|---------|
| shadcn/ui | - | Component library (Radix UI based) |
| Tailwind CSS | 3.4.19 | Utility-first styling |
| Lucide React | 0.562.0 | Icon library |
| next-themes | 0.4.6 | Dark/light theme management |

### State & Forms
| Technology | Version | Purpose |
|------------|---------|---------|
| Zustand | 5.0.10 | Lightweight state management |
| React Hook Form | 7.71.1 | Form handling |
| Zod | 4.3.5 | Schema validation |
| @hookform/resolvers | 5.2.2 | Form validation bridge |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Supabase | 2.90.1 | PostgreSQL + Auth + Realtime + Storage |

### Environment Variables
```
VITE_SUPABASE_URL - Supabase project URL
VITE_SUPABASE_ANON_KEY - Supabase anonymous key
```

---

## 3. Directory Structure

```
ted-sysops/
├── src/
│   ├── components/
│   │   ├── admin/              # Superadmin interface (3 files)
│   │   │   ├── AdminHeader.tsx
│   │   │   ├── AdminLayout.tsx
│   │   │   └── AdminSidebar.tsx
│   │   │
│   │   ├── layouts/            # Page layout wrappers (8 files)
│   │   │   ├── AppLayout.tsx           # Main team-scoped layout
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TeamSwitcher.tsx        # Team/Org navigation dropdown
│   │   │   ├── UserMenu.tsx
│   │   │   ├── OrgSettingsLayout.tsx
│   │   │   ├── OrgSettingsHeader.tsx
│   │   │   └── OrgSettingsSidebar.tsx
│   │   │
│   │   ├── settings/           # Team settings components (9 files)
│   │   │   ├── RoleSettingsSection.tsx
│   │   │   ├── RoleFormModal.tsx
│   │   │   ├── RoleList.tsx
│   │   │   ├── PermissionMatrix.tsx
│   │   │   ├── MemberList.tsx
│   │   │   ├── PendingInvitations.tsx
│   │   │   ├── JoinLinkSettings.tsx
│   │   │   ├── TeamMembersSection.tsx
│   │   │   └── DeleteRoleDialog.tsx
│   │   │
│   │   ├── shared/             # Cross-app reusable components (18 files)
│   │   │   ├── ProtectedRoute.tsx              # Auth guard
│   │   │   ├── SuperadminGuard.tsx             # Superadmin only
│   │   │   ├── OrgOwnerGuard.tsx               # Org owner guard
│   │   │   ├── TeamAccessGuard.tsx             # Team member guard
│   │   │   ├── SectionAccessGuard.tsx          # Per-section permission guard
│   │   │   ├── TeamRedirect.tsx                # Redirect to team scope
│   │   │   ├── InviteMemberModal.tsx           # Invite workflow
│   │   │   ├── EditMemberModal.tsx
│   │   │   ├── CreateTeamModal.tsx
│   │   │   ├── ManageTeamsModal.tsx
│   │   │   ├── RemoveMemberDialog.tsx
│   │   │   ├── PendingInvitationsNotification.tsx
│   │   │   ├── ImpersonationBanner.tsx
│   │   │   ├── ViewOnlyBanner.tsx
│   │   │   ├── ThemeToggle.tsx
│   │   │   ├── PageHeader.tsx
│   │   │   └── StepIndicator.tsx
│   │   │
│   │   ├── ui/                 # shadcn/ui components (23 files)
│   │   │   └── (button, input, form, dialog, dropdown-menu, etc.)
│   │   │
│   │   ├── contacts/           # Contact management (placeholder)
│   │   └── deals/              # Deal components (placeholder)
│   │
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Login.tsx
│   │   ├── Signup.tsx                  # Multi-step signup flow
│   │   ├── ForgotPassword.tsx
│   │   ├── AcceptInvitePage.tsx
│   │   ├── JoinTeamPage.tsx
│   │   ├── AccessDeniedPage.tsx
│   │   ├── ThemeTest.tsx
│   │   │
│   │   ├── Inbox.tsx                   # App sections
│   │   ├── MyDashboard.tsx
│   │   ├── PayTime.tsx
│   │   ├── TeamDashboard.tsx
│   │   ├── Whiteboard.tsx
│   │   ├── ContactHub.tsx
│   │   ├── Employees.tsx
│   │   ├── Transactions.tsx
│   │   ├── CalendarPage.tsx
│   │   ├── Reports.tsx
│   │   ├── SettingsPage.tsx
│   │   │
│   │   ├── admin/                      # Superadmin pages (8 files)
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── AdminUsers.tsx
│   │   │   ├── AdminUserDetails.tsx
│   │   │   ├── AdminOrganizations.tsx
│   │   │   ├── AdminOrgDetails.tsx
│   │   │   ├── AdminTeams.tsx
│   │   │   ├── AdminTeamDetails.tsx
│   │   │   └── AdminRoleTemplates.tsx
│   │   │
│   │   └── org-settings/               # Org owner pages (3 files)
│   │       ├── OrgGeneralSettings.tsx
│   │       ├── OrgTeamsPage.tsx
│   │       └── OrgMembersPage.tsx
│   │
│   ├── hooks/
│   │   ├── useAuth.tsx                 # Auth context & operations
│   │   ├── useTeamContext.ts           # Zustand team/org context
│   │   ├── useOrgContext.ts            # Organization context
│   │   ├── useNavigation.ts            # Navigation state
│   │   └── usePermissions.ts           # Permission checking
│   │
│   ├── lib/
│   │   ├── supabase.ts                 # Supabase client init
│   │   ├── adminService.ts             # Admin panel operations
│   │   ├── orgService.ts               # Organization operations
│   │   ├── roleService.ts              # Role management
│   │   └── utils.ts                    # Utility functions
│   │
│   ├── types/
│   │   ├── index.ts                    # Type exports
│   │   ├── context.types.ts            # TeamContext, TeamSwitcherItem
│   │   ├── user.types.ts
│   │   ├── organization.types.ts
│   │   ├── team.types.ts
│   │   ├── team-member.types.ts
│   │   ├── org-member.types.ts
│   │   ├── role.types.ts               # Role & permissions
│   │   └── invitation.types.ts
│   │
│   ├── stores/                         # Zustand stores (placeholder dirs)
│   │   ├── contacts/
│   │   └── deals/
│   │
│   ├── App.tsx                         # Router configuration
│   ├── main.tsx                        # React entry point
│   └── globals.css                     # Global styles & theme
│
├── supabase/
│   └── migrations/
│       ├── 001_core_schema.sql         # Tables, RLS, helpers
│       ├── 002_signup_function.sql     # Signup workflow
│       ├── 003_join_links.sql          # Join link feature
│       ├── 004_multiple_roles.sql      # Multi-role support
│       ├── 005_create_team_function.sql
│       ├── 006_get_invitation_function.sql
│       ├── 007_accept_invitation_function.sql
│       └── 008_organization_members.sql # Multi-owner support
│
└── Configuration Files
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json / tsconfig.app.json
    ├── tailwind.config.js
    ├── eslint.config.js
    └── components.json (shadcn/ui)
```

---

## 4. Database Schema

### Enums

```sql
-- Permission level for team members
permission_level: 'admin' | 'member' | 'viewer'

-- Invitation lifecycle
invitation_status: 'pending' | 'accepted' | 'expired' | 'revoked'
```

### Core Tables

#### organizations
Top-level billing entity (company).

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| name | TEXT | NOT NULL |
| slug | TEXT | UNIQUE |
| owner_id | UUID | FK → auth.users (legacy creator) |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

#### organization_members
Tracks org-level membership and ownership.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| organization_id | UUID | FK → organizations |
| user_id | UUID | FK → auth.users |
| is_owner | BOOLEAN | Enables multiple owners |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**Unique**: (organization_id, user_id)

#### teams
Workspace within an organization.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| org_id | UUID | FK → organizations |
| name | TEXT | NOT NULL |
| slug | TEXT | |
| join_code | TEXT | Auto-generated |
| join_link_enabled | BOOLEAN | Default FALSE |
| default_role_id | UUID | FK → team_roles |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**Unique**: (org_id, slug)

#### users
Extended auth.users data (public profile).

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK, FK → auth.users |
| email | TEXT | NOT NULL |
| full_name | TEXT | |
| avatar_url | TEXT | |
| is_superadmin | BOOLEAN | Default FALSE |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**Auto-created** via trigger when auth.users row is created.

#### team_members
User membership in a team.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| team_id | UUID | FK → teams |
| user_id | UUID | FK → users |
| permission_level | permission_level | Default 'member' |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**Unique**: (team_id, user_id)

**Note**: Roles stored in junction table `team_member_roles`, not on this table.

### Role System Tables

#### role_templates
System-wide role definitions.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| name | TEXT | UNIQUE |
| description | TEXT | |
| permissions | JSONB | Section-level access |
| is_system | BOOLEAN | |
| auto_install | BOOLEAN | Copy to new teams |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**Default Templates**: Full Access, Deal Manager, Transaction Coordinator, Finance, View Only

#### team_roles
Per-team role definitions.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| team_id | UUID | FK → teams |
| name | TEXT | |
| description | TEXT | |
| permissions | JSONB | Section-level access |
| is_default | BOOLEAN | Copied from template |
| template_id | UUID | FK → role_templates |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**Unique**: (team_id, name)

**Auto-populated** from role_templates when team is created via trigger.

#### team_member_roles (Junction)
Multiple roles per team member.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| team_member_id | UUID | FK → team_members |
| role_id | UUID | FK → team_roles |
| created_at | TIMESTAMPTZ | |

**Unique**: (team_member_id, role_id)

### Invitation Tables

#### team_invitations
Pending invites to join a team.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| team_id | UUID | FK → teams |
| email | TEXT | NOT NULL |
| permission_level | permission_level | Default 'member' |
| status | invitation_status | Default 'pending' |
| invited_by | UUID | FK → users |
| expires_at | TIMESTAMPTZ | Default NOW() + 7 days |
| accepted_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

#### team_invitation_roles (Junction)
Multiple roles per invitation.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| invitation_id | UUID | FK → team_invitations |
| role_id | UUID | FK → team_roles |
| created_at | TIMESTAMPTZ | |

**Unique**: (invitation_id, role_id)

### Permissions Structure (JSONB)

```typescript
type SectionKey =
  | 'inbox' | 'dashboard' | 'pay_time' | 'team'
  | 'whiteboard' | 'contacts' | 'employees'
  | 'transactions' | 'calendar' | 'reports' | 'settings'

type AccessLevel = 'full' | 'view'

// Stored in team_roles.permissions and role_templates.permissions
{
  "inbox": { "access": "full" },
  "dashboard": { "access": "full" },
  "contacts": { "access": "view" },
  // ... etc
}
```

### Entity Relationship Diagram

```
┌─────────────────┐
│   auth.users    │
│   (Supabase)    │
└────────┬────────┘
         │ (trigger sync)
         ▼
┌─────────────────┐      ┌──────────────────────┐
│     users       │      │   role_templates     │
│  (is_superadmin)│      │ (system-wide roles)  │
└────────┬────────┘      └──────────┬───────────┘
         │                          │ (auto-install)
    ┌────┴────┐                     │
    │         │                     ▼
    ▼         ▼              ┌─────────────┐
┌────────┐  ┌─────────────┐  │ team_roles  │
│org_    │  │organizations│  │ (per-team)  │
│members │  │  (owner_id) │  └──────┬──────┘
└────────┘  └──────┬──────┘         │
                   │                │
                   ▼                │
            ┌──────────┐            │
            │  teams   │            │
            │ (org_id) │            │
            └────┬─────┘            │
                 │                  │
    ┌────────────┼────────────┐     │
    │            │            │     │
    ▼            ▼            ▼     ▼
┌─────────┐ ┌──────────┐ ┌────────────────────┐
│ team_   │ │ team_    │ │ team_member_roles  │
│ members │ │invitations│ │ (member ↔ role)   │
└─────────┘ └──────────┘ └────────────────────┘
```

---

## 5. Authorization System

### Permission Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│ SUPERADMIN (users.is_superadmin = true)                     │
│ - System-wide access to everything                          │
│ - Manage role templates, impersonate users                  │
├─────────────────────────────────────────────────────────────┤
│ ORG OWNER (organization_members.is_owner = true)            │
│ - Full control over organization                            │
│ - Create/delete teams, manage all org members               │
│ - Access org settings                                       │
├─────────────────────────────────────────────────────────────┤
│ TEAM ADMIN (team_members.permission_level = 'admin')        │
│ - Manage team settings, members, roles                      │
│ - Invite/remove team members                                │
│ - Full access to all team sections                          │
├─────────────────────────────────────────────────────────────┤
│ TEAM MEMBER (team_members.permission_level = 'member')      │
│ - Access based on assigned roles                            │
│ - Multiple roles with permission merging                    │
├─────────────────────────────────────────────────────────────┤
│ TEAM VIEWER (team_members.permission_level = 'viewer')      │
│ - Read-only access based on assigned roles                  │
└─────────────────────────────────────────────────────────────┘
```

### SQL Helper Functions (SECURITY DEFINER)

All bypass RLS for authorization checks:

| Function | Purpose |
|----------|---------|
| `is_superadmin(user_id)` | Check if user is superadmin |
| `is_org_member(org_id, user_id)` | Check org membership |
| `is_org_owner(org_id, user_id)` | Check org ownership (both sources) |
| `is_team_member(team_id, user_id)` | Check team membership |
| `is_team_admin(team_id, user_id)` | Check if team admin |
| `get_org_owner_count(org_id)` | Count owners (last-owner protection) |

### RLS Policy Summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| organizations | org member OR superadmin | authenticated | owner OR superadmin | owner OR superadmin |
| teams | team/org member OR superadmin | org member OR superadmin | team admin OR superadmin | team admin OR superadmin |
| team_members | team member OR superadmin | team admin OR self OR superadmin | team admin OR superadmin | team admin OR superadmin |
| team_invitations | admin OR recipient OR superadmin | team admin OR superadmin | admin OR recipient | team admin OR superadmin |
| role_templates | everyone | superadmin | superadmin | superadmin |

### Frontend Guards

Located in `src/components/shared/`:

| Guard | Purpose | Checks |
|-------|---------|--------|
| `ProtectedRoute` | Basic auth gate | User is logged in |
| `TeamAccessGuard` | Team membership | User can access team |
| `SuperadminGuard` | Superadmin only | `users.is_superadmin = true` |
| `OrgOwnerGuard` | Org owner only | `is_org_owner()` |
| `SectionAccessGuard` | Section permission | `canAccess(section)` |

**Usage:**
```tsx
<SectionAccessGuard section="dashboard">
  <Dashboard />
</SectionAccessGuard>
```

### Permission Checking Hooks

#### useTeamContext() (Zustand)
Primary permission context for team-scoped pages.

```typescript
// State
context: TeamContext          // Current team/org/user/permissions
availableTeams: TeamSwitcherItem[]
loading: boolean
error: string | null

// Methods
loadContext(orgId, teamId, userId): Promise<boolean>
loadAvailableTeams(userId): Promise<void>

// Permission checks
isAdmin(): boolean            // permission_level === 'admin'
isMember(): boolean           // permission_level in ['admin', 'member']
canAccess(section): boolean   // Has any access (view or full)
hasFullAccess(section): boolean // Has 'full' access
```

#### Permission Merging Logic
When user has multiple roles, permissions merge using "most permissive wins":

```typescript
function mergeRolePermissions(roles: TeamRole[]): RolePermissions {
  const merged: RolePermissions = {}

  for (const role of roles) {
    for (const [section, perm] of Object.entries(role.permissions)) {
      const current = merged[section]?.access
      // 'full' beats 'view', 'view' beats nothing
      if (!current || perm.access === 'full') {
        merged[section] = perm
      }
    }
  }

  return merged
}
```

---

## 6. Key Architectural Patterns

### Routing Structure

```
/ (Home - public)
├── /login, /signup, /forgot-password (Public auth)
├── /invite/:invitationId (Accept invitation)
├── /join/:joinCode (Join via link)
│
├── /admin/* (SuperadminGuard)
│   ├── /organizations, /teams, /users
│   └── /role-templates
│
├── /org/:orgId/settings/* (OrgOwnerGuard)
│   ├── /general
│   ├── /teams
│   └── /members
│
└── /org/:orgId/team/:teamId/* (TeamAccessGuard)
    ├── /dashboard, /inbox, /pay-time
    ├── /team, /whiteboard, /contacts
    ├── /employees, /transactions
    ├── /calendar, /reports, /settings
    └── /access-denied
```

### State Management

**Zustand Stores:**
- `useTeamContext` - Current team, org, user, merged permissions
- `useOrgContext` - Organization details and ownership
- `useNavigation` - Mobile menu state

**React Context:**
- `useAuth` - Authentication state, login/signup operations

**Local State:**
- Form data, modal visibility, loading states

### Service Layer Pattern

Services in `src/lib/` handle Supabase operations:

```typescript
// Example: orgService.ts
export async function addUserToTeam(
  teamId: string,
  userId: string,
  permissionLevel: PermissionLevel,
  roleIds?: string[]
): Promise<string> {
  // 1. Create team_member record
  // 2. Create team_member_roles records
  // 3. Return member ID
}
```

**Services:**
- `orgService.ts` - Organization and member management
- `roleService.ts` - Role CRUD operations
- `adminService.ts` - Superadmin operations

### Form Pattern

```typescript
// 1. Define Zod schema
const formSchema = z.object({
  name: z.string().min(2, 'Name required'),
  email: z.string().email('Invalid email'),
})

// 2. Create form with React Hook Form
const form = useForm<z.infer<typeof formSchema>>({
  resolver: zodResolver(formSchema),
  defaultValues: { name: '', email: '' },
})

// 3. Use shadcn/ui Form components
<Form {...form}>
  <FormField
    control={form.control}
    name="name"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Name</FormLabel>
        <FormControl>
          <Input {...field} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
</Form>
```

### Component Organization

**Naming Conventions:**
- PascalCase files: `InviteMemberModal.tsx`
- Guards: `*Guard.tsx`
- Modals: `*Modal.tsx`
- Dialogs: `*Dialog.tsx`
- Sections: `*Section.tsx`

**Path Aliases:**
- `@/*` → `./src/*`

---

## 7. Current Implementation Status

### Fully Implemented

| Feature | Components | Services |
|---------|------------|----------|
| Authentication | Login, Signup, ForgotPassword, useAuth | Supabase Auth |
| Multi-step Signup | Signup.tsx with org/team creation | create_user_workspace() |
| Team Management | TeamSwitcher, CreateTeamModal | create_team() |
| Role System | RoleSettingsSection, RoleFormModal, PermissionMatrix | roleService.ts |
| Invitations | InviteMemberModal, AcceptInvitePage, PendingInvitations | team_invitations, accept_invitation() |
| Join Links | JoinLinkSettings, JoinTeamPage | join_code on teams |
| Org Owners | OrgOwnerGuard, OrgMembersPage | organization_members |
| Superadmin Panel | 8 admin pages, AdminLayout | adminService.ts |
| Theme System | ThemeToggle, Space Force theme | next-themes, Tailwind |

### Placeholder / Not Yet Implemented

| Section | Status | Notes |
|---------|--------|-------|
| Deals | Placeholder | Core deal management |
| Contacts | Placeholder | Contact hub |
| Whiteboard | Placeholder | Kanban/pipeline view |
| Transactions | Placeholder | Transaction tracking |
| Automators | Not started | Guided workflow engine |
| Pay Time | Placeholder | Commission tracking |
| Calendar | Placeholder | Scheduling |
| Reports | Placeholder | Analytics |
| Employees | Placeholder | Employee management |

---

## 8. Writing Future Epics

### Required Epic Sections

When writing a new epic specification, include:

1. **Overview**
   - Feature description
   - User stories / use cases
   - Success criteria

2. **Data Model**
   - New tables (with columns, types, constraints)
   - Modifications to existing tables
   - Relationships and indexes
   - RLS policies

3. **API / Functions**
   - New SECURITY DEFINER functions
   - RPC endpoints
   - Edge functions (if needed)

4. **UI Components**
   - New pages (route paths)
   - New components (with props/state)
   - Modifications to existing components

5. **Permissions**
   - Which permission levels can access
   - Section-level permissions
   - RLS policy requirements

6. **Implementation Order**
   - Migration files first
   - Types/services
   - Components/pages
   - Tests/verification

### Database Migration Conventions

```sql
-- ============================================================================
-- Migration: [Name]
-- Description: [What this migration does]
-- ============================================================================

-- 1. Create tables
CREATE TABLE IF NOT EXISTS table_name (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- columns...
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Add indexes
CREATE INDEX IF NOT EXISTS idx_table_column ON table_name(column);

-- 3. Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- 4. Create policies
CREATE POLICY "policy_name" ON table_name
    FOR SELECT USING (/* condition */);

-- 5. Create triggers
CREATE TRIGGER update_table_updated_at
    BEFORE UPDATE ON table_name
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Type Definition Pattern

```typescript
// In src/types/[feature].types.ts

// Database row type
export interface Deal {
  id: string
  team_id: string
  name: string
  status: DealStatus
  // ...
  created_at: string
  updated_at: string
}

// Create DTO (what client sends)
export interface CreateDealDTO {
  team_id: string
  name: string
  // ...
}

// Update DTO (partial)
export interface UpdateDealDTO {
  name?: string
  status?: DealStatus
  // ...
}

// Extended type (with joins)
export interface DealWithContacts extends Deal {
  contacts: Contact[]
}
```

### Service Pattern

```typescript
// In src/lib/[feature]Service.ts

import { supabase } from './supabase'
import type { Deal, CreateDealDTO, UpdateDealDTO } from '@/types/deal.types'

export async function getDeals(teamId: string): Promise<Deal[]> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function createDeal(dto: CreateDealDTO): Promise<Deal> {
  // ...
}
```

### Component Naming

| Type | Pattern | Example |
|------|---------|---------|
| Page | `[Feature].tsx` | `Deals.tsx` |
| List | `[Feature]List.tsx` | `DealList.tsx` |
| Form Modal | `[Feature]FormModal.tsx` | `DealFormModal.tsx` |
| Detail View | `[Feature]Detail.tsx` | `DealDetail.tsx` |
| Settings Section | `[Feature]SettingsSection.tsx` | `DealSettingsSection.tsx` |

### Referencing Existing Patterns

When writing epics, reference these existing implementations:

| Pattern | Reference |
|---------|-----------|
| CRUD with modal | `RoleSettingsSection.tsx` + `RoleFormModal.tsx` |
| List with actions | `MemberList.tsx` |
| Permission guard | `SectionAccessGuard.tsx` |
| Multi-step form | `Signup.tsx` |
| Junction table | `team_member_roles` |
| SECURITY DEFINER | `create_team()`, `accept_invitation()` |

---

## Quick Reference

### Key Files

| Purpose | Location |
|---------|----------|
| Routes | `src/App.tsx` |
| Auth context | `src/hooks/useAuth.tsx` |
| Team context | `src/hooks/useTeamContext.ts` |
| Permission types | `src/types/role.types.ts` |
| Org service | `src/lib/orgService.ts` |
| Core schema | `supabase/migrations/001_core_schema.sql` |

### Commands

```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm run lint             # Run ESLint
npx shadcn-ui@latest add [component]  # Add shadcn component
```

### Design System Colors

```css
--primary: Teal #00D2AF
--accent: Purple #7C3AED
--success: Green #22C55E
--warning: Amber #F59E0B
--destructive: Red #EF4444
```

---

*Last updated: January 2025*
