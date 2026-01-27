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
│   │   ├── settings/           # Team settings components (18 files)
│   │   │   ├── TeamSettingsLayout.tsx     # Settings page layout wrapper
│   │   │   ├── TeamSettingsSidebar.tsx    # Settings sidebar navigation
│   │   │   ├── SettingsCard.tsx           # Category card for settings home
│   │   │   ├── RoleSettingsSection.tsx
│   │   │   ├── RoleFormModal.tsx
│   │   │   ├── RoleList.tsx
│   │   │   ├── PermissionMatrix.tsx
│   │   │   ├── MemberList.tsx
│   │   │   ├── PendingInvitations.tsx
│   │   │   ├── JoinLinkSettings.tsx
│   │   │   ├── TeamMembersSection.tsx
│   │   │   ├── DeleteRoleDialog.tsx
│   │   │   ├── TypeSettingsSection.tsx    # Type CRUD for contact/company types
│   │   │   ├── TypeList.tsx
│   │   │   ├── TypeFormModal.tsx
│   │   │   ├── TypeCreationWizard.tsx
│   │   │   ├── CustomFieldDefinitionManager.tsx
│   │   │   └── CustomFieldDefinitionFormModal.tsx
│   │   │
│   │   ├── shared/             # Cross-app reusable components (23 files)
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
│   │   │   ├── ComingSoon.tsx
│   │   │   ├── PageHeader.tsx
│   │   │   ├── StepIndicator.tsx
│   │   │   ├── ContactMethodsInput.tsx         # Polymorphic contact methods form
│   │   │   ├── IconPicker.tsx                  # Icon selector for types
│   │   │   ├── ColorPicker.tsx                 # Color selector for types
│   │   │   ├── TypeBadge.tsx                   # Generic type badge component
│   │   │   └── CompanyTypeSectionsInput.tsx    # Company type sections input
│   │   │
│   │   ├── ui/                 # shadcn/ui components (23 files)
│   │   │   └── (button, input, form, dialog, dropdown-menu, separator, etc.)
│   │   │
│   │   ├── contacts/           # Contact management (9 files)
│   │   │   ├── index.ts
│   │   │   ├── ContactList.tsx
│   │   │   ├── ContactForm.tsx
│   │   │   ├── CreateContactModal.tsx
│   │   │   ├── ContactDetailDrawer.tsx
│   │   │   ├── ContactSummaryPanel.tsx
│   │   │   ├── DeleteContactDialog.tsx
│   │   │   ├── ContactTypeBadge.tsx
│   │   │   └── ContactTypeFilter.tsx
│   │   │
│   │   ├── companies/          # Company management (8 files)
│   │   │   ├── index.ts
│   │   │   ├── CompanyList.tsx
│   │   │   ├── CompanyForm.tsx
│   │   │   ├── CreateCompanyModal.tsx
│   │   │   ├── CompanyDetailDrawer.tsx
│   │   │   ├── DeleteCompanyDialog.tsx
│   │   │   ├── CompanyTypeBadge.tsx
│   │   │   └── CompanyTypeFilter.tsx
│   │   │
│   │   ├── automators/         # Automator workflow builder (12 files)
│   │   │   ├── AutomatorList.tsx
│   │   │   ├── AutomatorFormModal.tsx
│   │   │   ├── DeleteAutomatorDialog.tsx
│   │   │   └── builder/
│   │   │       ├── NodePalette.tsx
│   │   │       ├── AutomatorToolbar.tsx
│   │   │       ├── ConfigurationPanel.tsx
│   │   │       ├── AutomatorCanvas.tsx
│   │   │       └── nodes/
│   │   │           ├── nodeStyles.ts
│   │   │           ├── StartNode.tsx
│   │   │           ├── EndNode.tsx
│   │   │           ├── DecisionNode.tsx
│   │   │           └── DataCollectionNode.tsx
│   │   │
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
│   │   ├── ContactHub.tsx             # Tabbed hub: Contacts | Companies
│   │   ├── ContactDetailPage.tsx      # Full contact detail + activity log
│   │   ├── Employees.tsx
│   │   ├── Transactions.tsx
│   │   ├── CalendarPage.tsx
│   │   ├── Reports.tsx
│   │   ├── SettingsPage.tsx           # Legacy (redirects to settings home)
│   │   │
│   │   ├── settings/                  # Team settings pages (7 files)
│   │   │   ├── SettingsHomePage.tsx           # Card-grid settings index
│   │   │   ├── TeamMembersPage.tsx           # Members/invites/join links
│   │   │   ├── RolesPage.tsx                 # Role management
│   │   │   ├── ContactTypesPage.tsx          # Contact type management
│   │   │   ├── CompanyTypesPage.tsx          # Company type management
│   │   │   ├── AutomatorsPage.tsx            # Automator list/CRUD
│   │   │   └── AutomatorBuilderPage.tsx      # Visual workflow builder (full-page)
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
│   │   ├── usePermissions.ts           # Permission checking
│   │   ├── useContactStore.ts          # Contact CRUD + list state (Zustand)
│   │   ├── useCompanyStore.ts          # Company CRUD + list state (Zustand)
│   │   └── useCustomFields.ts          # Custom field value read/write
│   │
│   ├── lib/
│   │   ├── supabase.ts                 # Supabase client init
│   │   ├── adminService.ts             # Admin panel operations
│   │   ├── orgService.ts               # Organization operations
│   │   ├── roleService.ts              # Role management
│   │   ├── contactService.ts           # Contact CRUD operations
│   │   ├── companyService.ts           # Company CRUD operations
│   │   ├── contactMethodHelpers.ts     # Polymorphic contact method utilities
│   │   ├── teamTypeService.ts          # Team contact/company type management
│   │   ├── typeTemplateService.ts      # Superadmin type template CRUD
│   │   ├── customFieldValueService.ts  # Custom field value operations
│   │   ├── activityLogService.ts       # Activity log CRUD
│   │   ├── automatorService.ts         # Automator CRUD + publish/archive
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
│   │   ├── invitation.types.ts
│   │   ├── contact.types.ts            # Contact, ContactMethod, DTOs
│   │   ├── company.types.ts            # Company, CompanyType, DTOs
│   │   ├── type-system.types.ts        # Type templates, team types, custom field defs
│   │   ├── custom-fields.types.ts      # Custom field values, form types
│   │   ├── activity.types.ts           # Activity log entries, DTOs
│   │   └── automator.types.ts          # Automator nodes, edges, definitions
│   │
│   ├── stores/
│   │   └── automatorBuilderStore.ts    # Zustand store for builder canvas state
│   │
│   ├── config/
│   │   └── settingsConfig.ts           # Settings category/item definitions
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
│       ├── 008_organization_members.sql  # Multi-owner support
│       ├── 009_contacts_companies.sql    # Contacts, companies, methods, types
│       ├── 010_type_templates.sql        # Type template system, custom fields
│       ├── 011_custom_field_values.sql   # Custom field value storage
│       ├── 012_activity_log.sql          # Activity log system
│       └── 013_automators.sql            # Automator definitions
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

-- Contact method type
contact_method_type: 'phone' | 'email' | 'fax' | 'other'

-- Custom field type
custom_field_type: 'text' | 'textarea' | 'number' | 'currency' | 'date'
                 | 'dropdown' | 'multi_select' | 'checkbox' | 'url' | 'email' | 'phone'

-- Activity type
activity_type: 'comment' | 'created' | 'updated' | 'deleted' | 'status_change'

-- Activity entity type
activity_entity_type: 'contact' | 'company' | 'deal'
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

### ContactHub Tables

#### contacts
Individual people tracked by the team.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| team_id | UUID | FK → teams |
| first_name | TEXT | NOT NULL |
| last_name | TEXT | |
| notes | TEXT | |
| created_by | UUID | FK → users |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**RLS**: Team members SELECT/INSERT/UPDATE; team admins DELETE.

#### companies
Organizations/businesses tracked by the team.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| team_id | UUID | FK → teams |
| name | TEXT | NOT NULL |
| address | TEXT | |
| city | TEXT | |
| state | TEXT | |
| zip | TEXT | |
| website | TEXT | |
| notes | TEXT | |
| poc_contact_id | UUID | FK → contacts (point-of-contact) |
| created_by | UUID | FK → users |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**RLS**: Team members SELECT/INSERT/UPDATE; team admins DELETE.

#### contact_companies (Junction)
Many-to-many relationship between contacts and companies.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| contact_id | UUID | FK → contacts |
| company_id | UUID | FK → companies |
| role_title | TEXT | e.g., "Loan Officer" |
| is_primary | BOOLEAN | Default FALSE |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**Unique**: (contact_id, company_id)

#### contact_methods (Polymorphic)
Contact methods that belong to a contact, company, OR contact-company relationship.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| contact_id | UUID | FK → contacts (nullable) |
| company_id | UUID | FK → companies (nullable) |
| contact_company_id | UUID | FK → contact_companies (nullable) |
| method_type | contact_method_type | phone, email, fax, other |
| label | TEXT | e.g., "Work", "Cell" |
| value | TEXT | NOT NULL |
| is_primary | BOOLEAN | Default FALSE |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**Constraint**: Exactly one of contact_id, company_id, or contact_company_id must be set.

### Type System Tables

#### contact_type_templates / company_type_templates
System-wide type definitions (superadmin-managed).

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| name | TEXT | UNIQUE |
| description | TEXT | |
| icon | TEXT | Lucide icon name |
| color | TEXT | Tailwind color key |
| is_system | BOOLEAN | |
| auto_install | BOOLEAN | Copy to new teams |
| sort_order | INTEGER | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**Default Contact Types**: Seller, Buyer, Investor, Agent, Wholesaler, Contractor, Attorney, Other
**Default Company Types**: Title Company, Lender, Brokerage, Contractor, Property Management, Inspection, Legal, Marketing, Other

#### team_contact_types / team_company_types
Per-team type definitions (customizable, auto-copied from templates).

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| team_id | UUID | FK → teams |
| name | TEXT | |
| description | TEXT | |
| icon | TEXT | Lucide icon name |
| color | TEXT | Tailwind color key |
| is_active | BOOLEAN | Default TRUE |
| sort_order | INTEGER | |
| template_id | UUID | FK → templates (nullable) |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**Unique**: (team_id, name)
**Auto-populated** from templates when team is created via trigger.

#### contact_type_assignments / company_type_assignments (Junction)
Many-to-many: contacts/companies to their team types.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| contact_id / company_id | UUID | FK |
| type_id | UUID | FK → team_contact_types / team_company_types |
| created_at | TIMESTAMPTZ | |

**Unique**: (contact_id/company_id, type_id)

### Custom Field Tables

#### custom_field_definitions
Field definitions attached to team_contact_types or team_company_types.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| team_contact_type_id | UUID | FK (nullable) |
| team_company_type_id | UUID | FK (nullable) |
| name | TEXT | NOT NULL |
| field_type | custom_field_type | text, number, date, dropdown, etc. |
| description | TEXT | |
| is_required | BOOLEAN | Default FALSE |
| options | JSONB | For dropdown/multi_select |
| default_value | TEXT | |
| sort_order | INTEGER | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

#### custom_field_values
Stored values for custom fields with typed columns.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| field_definition_id | UUID | FK → custom_field_definitions |
| contact_id | UUID | FK → contacts (nullable) |
| company_id | UUID | FK → companies (nullable) |
| value_text | TEXT | |
| value_number | NUMERIC | |
| value_date | DATE | |
| value_boolean | BOOLEAN | |
| value_json | JSONB | For multi_select |
| is_orphaned | BOOLEAN | Default FALSE |
| orphaned_at | TIMESTAMPTZ | |
| orphaned_type_name | TEXT | Preserves type name on unassign |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### Activity Log Tables

#### activity_logs
Universal activity tracking (polymorphic).

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| team_id | UUID | FK → teams |
| user_id | UUID | FK → users |
| contact_id | UUID | FK → contacts (nullable) |
| company_id | UUID | FK → companies (nullable) |
| entity_type | activity_entity_type | contact, company, deal |
| activity_type | activity_type | comment, created, updated, etc. |
| content | TEXT | Comment text or description |
| metadata | JSONB | Additional structured data |
| created_at | TIMESTAMPTZ | |

**RLS**: Team members SELECT/INSERT; own entries or team admin UPDATE/DELETE.

### Automator Tables

#### automators
Workflow definitions stored as JSONB.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| team_id | UUID | FK → teams |
| name | TEXT | NOT NULL |
| description | TEXT | |
| definition | JSONB | {nodes, edges, viewport} |
| status | TEXT | 'draft', 'published', 'archived' |
| version | INTEGER | Incremented on publish |
| created_by | UUID | FK → users |
| updated_by | UUID | FK → users |
| published_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**Unique**: (team_id, name)
**RLS**: Team members SELECT; team admins INSERT/UPDATE/DELETE.

### Entity Relationship Diagram

```
┌─────────────────┐
│   auth.users    │
│   (Supabase)    │
└────────┬────────┘
         │ (trigger sync)
         ▼
┌─────────────────┐      ┌──────────────────────┐     ┌──────────────────────┐
│     users       │      │   role_templates     │     │  type_templates      │
│  (is_superadmin)│      │ (system-wide roles)  │     │ (contact + company)  │
└────────┬────────┘      └──────────┬───────────┘     └──────────┬───────────┘
         │                          │ (auto-install)              │ (auto-install)
    ┌────┴────┐                     │                             │
    │         │                     ▼                             ▼
    ▼         ▼              ┌─────────────┐            ┌─────────────────────┐
┌────────┐  ┌─────────────┐  │ team_roles  │            │ team_contact_types  │
│org_    │  │organizations│  │ (per-team)  │            │ team_company_types  │
│members │  │  (owner_id) │  └──────┬──────┘            └──────────┬──────────┘
└────────┘  └──────┬──────┘         │                              │
                   │                │                              │
                   ▼                │                              │
            ┌──────────┐            │                              │
            │  teams   │            │                              │
            │ (org_id) │            │                              │
            └────┬─────┘            │                              │
                 │                  │                              │
    ┌────────┬───┼────────┬─────────┤                              │
    │        │   │        │         │                              │
    ▼        │   ▼        ▼         ▼                              │
┌─────────┐  │ ┌──────────┐ ┌────────────────────┐                │
│ team_   │  │ │ team_    │ │ team_member_roles  │                │
│ members │  │ │invitations│ │ (member ↔ role)   │                │
└─────────┘  │ └──────────┘ └────────────────────┘                │
             │                                                     │
             ▼                                                     │
      ┌────────────┐                                               │
      │ automators │                                               │
      │ (JSONB def)│                                               │
      └────────────┘                                               │
                                                                   │
┌────── team-scoped data ──────────────────────────────────────────┤
│                                                                   │
│  ┌──────────┐      ┌──────────────────┐      ┌──────────────┐   │
│  │ contacts │──┬──→│ contact_companies│←──┬──│  companies   │   │
│  └────┬─────┘  │   └──────────────────┘   │  └──────┬───────┘   │
│       │        │            │              │         │            │
│       │        │   contact_methods         │         │            │
│       │        │   (polymorphic: contact,  │         │            │
│       │        │    company, or link)      │         │            │
│       │        │                           │         │            │
│       ├────────┴── contact_type_assignments─┘────────┤            │
│       │            company_type_assignments──────────┤            │
│       │                                              ├────────────┘
│       │                                              │
│       ├── custom_field_values     custom_field_definitions
│       │   (per contact/company)   (per team type)
│       │
│       └── activity_logs
│           (polymorphic: contact | company)
└──────────────────────────────────────────────────────────────────
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
| contacts | team member OR superadmin | team member OR superadmin | team member OR superadmin | team admin OR superadmin |
| companies | team member OR superadmin | team member OR superadmin | team member OR superadmin | team admin OR superadmin |
| contact_type_templates | everyone | superadmin | superadmin | superadmin |
| company_type_templates | everyone | superadmin | superadmin | superadmin |
| team_contact_types | team/org member OR superadmin | team admin OR superadmin | team admin OR superadmin | team admin OR superadmin |
| team_company_types | team/org member OR superadmin | team admin OR superadmin | team admin OR superadmin | team admin OR superadmin |
| custom_field_definitions | via parent type (team member) | team admin OR superadmin | team admin OR superadmin | team admin OR superadmin |
| custom_field_values | via parent entity (team member) | team member OR superadmin | team member OR superadmin | team member OR superadmin |
| activity_logs | team member OR superadmin | team member | own entry OR team admin | own entry OR team admin |
| automators | team member OR superadmin | team admin OR superadmin | team admin OR superadmin | team admin OR superadmin |

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
    ├── /team, /whiteboard
    ├── /contacts                           # ContactHub (tabbed: Contacts | Companies)
    ├── /contacts/:contactId                # ContactDetailPage (full detail + activity)
    ├── /employees, /transactions
    ├── /calendar, /reports
    ├── /settings                           # SettingsHomePage (card-grid index)
    │   ├── /team-members                   # TeamMembersPage
    │   ├── /roles                          # RolesPage
    │   ├── /contact-types                  # ContactTypesPage
    │   ├── /company-types                  # CompanyTypesPage
    │   ├── /automators                     # AutomatorsPage (list/CRUD)
    │   └── /automators/:automatorId        # AutomatorBuilderPage (full-page)
    └── /access-denied
```

### State Management

**Zustand Stores:**
- `useTeamContext` - Current team, org, user, merged permissions
- `useOrgContext` - Organization details and ownership
- `useNavigation` - Mobile menu state
- `useContactStore` - Contact list, search, type filtering, pagination, selection
- `useCompanyStore` - Company list, search, type filtering, pagination, selection
- `automatorBuilderStore` - Canvas state: nodes, edges, viewport, selected node, dirty flag

**React Context:**
- `useAuth` - Authentication state, login/signup operations

**Custom Hooks:**
- `useCustomFields` - Reads and saves custom field values for contacts/companies

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
- `contactService.ts` - Contact CRUD, type assignments, search, pagination
- `companyService.ts` - Company CRUD, type assignments, contact linking, POC
- `contactMethodHelpers.ts` - Polymorphic contact method utilities
- `teamTypeService.ts` - Team-level contact/company type CRUD + custom field definitions
- `typeTemplateService.ts` - Superadmin type template management
- `customFieldValueService.ts` - Custom field value read/write with typed columns
- `activityLogService.ts` - Activity log CRUD, paginated queries
- `automatorService.ts` - Automator CRUD + publish/unpublish/duplicate/archive

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

### Settings Architecture

Team settings use a dedicated layout with sidebar navigation, separate from the main AppLayout.

**Settings Config** (`src/config/settingsConfig.ts`):
- `SETTINGS_CATEGORIES` array defines categories and items as typed data
- 3 categories: **General** (team-members, roles), **Contact Hub** (contact-types, company-types), **Automation** (automators)
- `ALL_SETTINGS_ITEMS` flat array for search functionality
- Each item has: id, label, icon, description, route

**Layout Structure:**
- `TeamSettingsLayout` wraps all settings routes with sidebar + content area
- `TeamSettingsSidebar` renders navigation grouped by category
- `SettingsHomePage` renders a searchable card-grid of all categories
- Individual settings pages are standalone route components

**Automator Builder** (full-page, not nested in TeamSettingsLayout):
- 3-panel layout: NodePalette (left), AutomatorCanvas (center), ConfigurationPanel (right)
- AutomatorToolbar at the top with save/publish/status controls
- State managed by `automatorBuilderStore` (Zustand)
- Node types: Start, End, Decision, DataCollection
- Status lifecycle: draft → published → archived

### Type System Pattern

Follows the same architecture as roles: system-wide templates auto-install to teams.

1. **Templates** (superadmin-managed): `contact_type_templates`, `company_type_templates`
2. **Team Types** (per-team, customizable): `team_contact_types`, `team_company_types`
3. **Auto-copy trigger**: `copy_type_templates_to_team()` fires on team INSERT
4. **Custom Fields**: Defined per team type, values stored per entity with typed columns
5. **Orphan Management**: When a type is unassigned from a contact/company, custom field values are marked as orphaned (not deleted). Re-assigning the type restores them.

### ContactHub Architecture

The ContactHub uses a master-detail pattern with two entry points:

1. **Hub Page** (`ContactHub.tsx`): Tabbed interface (Contacts | Companies) with count badges, search, type filtering, and pagination. Clicking a row opens a detail drawer.
2. **Detail Page** (`ContactDetailPage.tsx`): Full-page two-column layout — left column has contact info, methods, companies, notes, and custom fields; right column has an activity feed.

**Data Stores** (`useContactStore`, `useCompanyStore`): Zustand stores managing list state (contacts, pagination, search, type filter), selection state (drawer/detail), and CRUD refresh triggers.

**Polymorphic Contact Methods**: A single `contact_methods` table serves three owner types (contact, company, or contact-company relationship), with a check constraint ensuring exactly one FK is set. Helper functions in `contactMethodHelpers.ts` abstract the polymorphic queries.

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
| ContactHub | ContactList, ContactForm, CreateContactModal, ContactDetailDrawer, ContactSummaryPanel, DeleteContactDialog | contactService.ts |
| Company Management | CompanyList, CompanyForm, CreateCompanyModal, CompanyDetailDrawer, DeleteCompanyDialog | companyService.ts |
| Contact Detail Page | ContactDetailPage (two-column layout with activity log, custom fields, company links) | contactService.ts, activityLogService.ts, customFieldValueService.ts |
| Type System | TypeSettingsSection, TypeList, TypeFormModal, TypeCreationWizard, CustomFieldDefinitionManager | teamTypeService.ts, typeTemplateService.ts |
| Custom Fields | CustomFieldDefinitionManager, CustomFieldDefinitionFormModal, useCustomFields | customFieldValueService.ts |
| Activity Logging | Inline activity feed with comments on contacts/companies | activityLogService.ts |
| Settings Redesign | SettingsHomePage (card-grid), TeamSettingsLayout, TeamSettingsSidebar, SettingsCard | settingsConfig.ts |
| Contact Methods | ContactMethodsInput (polymorphic: personal, company, relationship) | contactMethodHelpers.ts |

### Placeholder / Not Yet Implemented

| Section | Status | Notes |
|---------|--------|-------|
| Deals | Placeholder | Core deal management |
| Whiteboard | Placeholder | Kanban/pipeline view |
| Transactions | Placeholder | Transaction tracking |
| Automators | Partially implemented | Builder UI complete (draft/publish/archive); execution engine not yet built |
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
| Contact/Company CRUD with list + drawer | `ContactList.tsx` + `ContactDetailDrawer.tsx` |
| Tabbed hub page | `ContactHub.tsx` (Contacts / Companies tabs) |
| Full detail page with activity | `ContactDetailPage.tsx` (two-column layout) |
| Type system (template → team) | `team_contact_types` + `copy_type_templates_to_team()` |
| Custom fields (definition + values) | `CustomFieldDefinitionManager.tsx` + `useCustomFields.ts` |
| Activity logging | `activityLogService.ts` + ContactDetailPage activity feed |
| Zustand data store (list + CRUD) | `useContactStore.ts` (search, filters, pagination) |
| Visual workflow builder | `AutomatorBuilderPage.tsx` + `automatorBuilderStore.ts` |
| Settings config-driven layout | `settingsConfig.ts` + `TeamSettingsLayout.tsx` |
| Polymorphic table (owner check) | `contact_methods`, `custom_field_values`, `activity_logs` |

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
| Contact service | `src/lib/contactService.ts` |
| Company service | `src/lib/companyService.ts` |
| Automator service | `src/lib/automatorService.ts` |
| Activity log service | `src/lib/activityLogService.ts` |
| Contact types | `src/types/contact.types.ts` |
| Company types | `src/types/company.types.ts` |
| Automator types | `src/types/automator.types.ts` |
| Settings config | `src/config/settingsConfig.ts` |
| Builder store | `src/stores/automatorBuilderStore.ts` |
| ContactHub page | `src/pages/ContactHub.tsx` |
| Contact schema | `supabase/migrations/009_contacts_companies.sql` |
| Type templates schema | `supabase/migrations/010_type_templates.sql` |
| Automator schema | `supabase/migrations/013_automators.sql` |

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

*Last updated: January 2026*
