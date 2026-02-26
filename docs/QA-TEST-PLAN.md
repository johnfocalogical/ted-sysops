# TED SysOps - Manual QA Test Plan

> **Purpose**: This document provides comprehensive manual QA tests to verify all implemented features of the TED SysOps platform. Use this checklist to validate the application is working correctly.

---

## Test Environment Setup

Before running tests, ensure:
- [ ] Application is running (`npm run dev`)
- [ ] Supabase is connected (check browser console for errors)
- [ ] You have access to email for invitation testing
- [ ] You have at least 2 different email accounts for multi-user testing

**Test URL**: `http://localhost:5173`

---

## 1. Authentication Tests

### AUTH-001: New User Signup
**Prerequisites**: No existing account with test email

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/signup` | Signup page loads with Step 1 (Account) |
| 2 | Enter email, password, full name | Fields accept input |
| 3 | Click "Continue" | Proceeds to Step 2 (Organization) |
| 4 | Enter organization name | Auto-generates slug |
| 5 | Click "Continue" | Proceeds to Step 3 (Team) |
| 6 | Enter team name | Auto-generates slug |
| 7 | Click "Create Account" | Account created, redirected to team dashboard |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### AUTH-002: Login with Valid Credentials
**Prerequisites**: Existing user account

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/login` | Login page loads |
| 2 | Enter valid email and password | Fields accept input |
| 3 | Click "Sign In" | Redirected to team dashboard |
| 4 | Verify header shows user name | User menu displays correctly |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### AUTH-003: Login with Invalid Credentials
**Prerequisites**: None

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/login` | Login page loads |
| 2 | Enter invalid email/password | Fields accept input |
| 3 | Click "Sign In" | Error message displays |
| 4 | Verify still on login page | Not redirected |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### AUTH-004: Logout
**Prerequisites**: Logged in user

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click user menu (top right) | Dropdown opens |
| 2 | Click "Sign Out" | Redirected to login page |
| 3 | Try navigating to `/dashboard` | Redirected back to login |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### AUTH-005: Forgot Password Flow
**Prerequisites**: Existing user account

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/forgot-password` | Forgot password page loads |
| 2 | Enter registered email | Field accepts input |
| 3 | Click "Send Reset Link" | Success message displays |
| 4 | Check email for reset link | Email received (may take a moment) |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### AUTH-006: Session Persistence
**Prerequisites**: Logged in user

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to team dashboard | Dashboard loads |
| 2 | Refresh the page (F5) | Still logged in, dashboard shows |
| 3 | Close browser tab | - |
| 4 | Open new tab, navigate to app | Still logged in |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

## 2. Team Switcher Tests

### TEAM-001: View Available Teams
**Prerequisites**: User belongs to at least one team

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click team switcher (header) | Dropdown opens |
| 2 | View team list | Shows all teams grouped by organization |
| 3 | Current team has checkmark | Visual indicator present |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### TEAM-002: Switch Between Teams
**Prerequisites**: User belongs to multiple teams

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click team switcher | Dropdown opens |
| 2 | Click on different team | Page reloads with new team context |
| 3 | Verify URL changes | URL reflects new org/team IDs |
| 4 | Verify team name in header | Shows selected team |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### TEAM-003: Org Settings Access (Owner)
**Prerequisites**: User is org owner

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click team switcher | Dropdown opens |
| 2 | Look at organization name | Settings gear icon visible |
| 3 | Click organization name/gear | Navigates to org settings |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### TEAM-004: Org Settings Access (Non-Owner)
**Prerequisites**: User is NOT org owner

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click team switcher | Dropdown opens |
| 2 | Look at organization name | NO settings gear icon visible |
| 3 | Try direct URL `/org/[id]/settings` | Access denied or redirect |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### TEAM-005: Create Team (Owner Only)
**Prerequisites**: User is org owner

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click team switcher | Dropdown opens |
| 2 | Look for "Create New Team" | Button visible at bottom |
| 3 | Click "Create New Team" | Create team modal opens |
| 4 | Enter team name | Auto-generates slug |
| 5 | Click "Create Team" | Team created, navigates to new team |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### TEAM-006: Create Team Button Hidden (Non-Owner)
**Prerequisites**: User is NOT org owner

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click team switcher | Dropdown opens |
| 2 | Look for "Create New Team" | Button NOT visible |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

## 3. Invitation Flow Tests

### INV-001: Send Email Invitation
**Prerequisites**: Team admin, valid email address to invite

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Team Settings | Settings page loads |
| 2 | Go to Members tab | Member list visible |
| 3 | Click "Invite Member" | Invite modal opens |
| 4 | Enter email address | Field accepts input |
| 5 | Select permission level | Dropdown works |
| 6 | Click "Send Invitation" | Success toast, modal closes |
| 7 | Check Pending Invitations | New invitation listed |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### INV-002: Send Invitation with Roles
**Prerequisites**: Team admin, roles exist in team

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open invite modal | Modal opens |
| 2 | Enter email | Field accepts input |
| 3 | Select permission level | Dropdown works |
| 4 | Select one or more roles | Role checkboxes toggle |
| 5 | Click "Send Invitation" | Success toast |
| 6 | Check pending invitation | Shows assigned roles |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### INV-003: View Pending Invitations
**Prerequisites**: At least one pending invitation

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Team Settings > Members | Page loads |
| 2 | Look for Pending Invitations section | Section visible |
| 3 | Verify invitation details | Email, permission, roles shown |
| 4 | Verify expiration date | Date displayed |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### INV-004: Revoke Invitation
**Prerequisites**: Pending invitation exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find pending invitation | Invitation visible |
| 2 | Click revoke/delete button | Confirmation dialog |
| 3 | Confirm revocation | Invitation removed from list |
| 4 | Original link no longer works | Error when accepting |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### INV-005: Accept Invitation (Existing User)
**Prerequisites**: Invitation sent to existing user's email

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Get invitation link (from email/admin) | Have the invite URL |
| 2 | Log in as invited user | Logged in |
| 3 | Navigate to invitation link | Accept invitation page loads |
| 4 | Click "Accept Invitation" | Joined team, redirected to dashboard |
| 5 | Verify team in switcher | New team appears |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### INV-006: Accept Invitation (New User)
**Prerequisites**: Invitation sent to email without account

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to invitation link | Accept page loads |
| 2 | Click "Accept Invitation" | Redirected to signup |
| 3 | Complete signup with invited email | Account created |
| 4 | Automatically joined team | Team visible in switcher |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

## 4. Join Link Tests

### JOIN-001: Enable Join Link
**Prerequisites**: Team admin

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Team Settings > Members | Page loads |
| 2 | Find Join Link section | Section visible |
| 3 | Toggle join link ON | Toggle switches, link appears |
| 4 | Copy link | Link copied to clipboard |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### JOIN-002: Join via Link (Existing User)
**Prerequisites**: Join link enabled, logged-in user not in team

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as different user | Logged in |
| 2 | Navigate to join link | Join page loads |
| 3 | See team details | Team name, org shown |
| 4 | Click "Join Team" | Joined, redirected to dashboard |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### JOIN-003: Join via Link (New User)
**Prerequisites**: Join link enabled

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log out or use incognito | Not logged in |
| 2 | Navigate to join link | Join page loads |
| 3 | See team details | Team name, org shown |
| 4 | Click "Join Team" | Redirected to signup |
| 5 | Complete signup | Account created, joined team |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### JOIN-004: Disable Join Link
**Prerequisites**: Team admin, join link currently enabled

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Team Settings > Members | Page loads |
| 2 | Toggle join link OFF | Toggle switches |
| 3 | Try old join link | Error - join link disabled |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### JOIN-005: Regenerate Join Code
**Prerequisites**: Team admin

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Team Settings > Members | Page loads |
| 2 | Click "Regenerate" button | Confirmation dialog |
| 3 | Confirm regeneration | New code generated |
| 4 | Old link no longer works | Error with old link |
| 5 | New link works | Join page loads |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

## 5. Team Member Management Tests

### MEM-001: View Member List
**Prerequisites**: Team admin, team has members

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Team Settings > Members | Page loads |
| 2 | View member list | All members displayed |
| 3 | Verify details shown | Name, email, permission, roles |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### MEM-002: Edit Member Permission Level
**Prerequisites**: Team admin, another member exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find member in list | Member visible |
| 2 | Click edit/manage button | Edit modal opens |
| 3 | Change permission level | Dropdown changes |
| 4 | Save changes | Success toast, list updates |
| 5 | Verify change persists | Reload page, change still there |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### MEM-003: Edit Member Roles
**Prerequisites**: Team admin, roles exist

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find member in list | Member visible |
| 2 | Click edit/manage button | Edit modal opens |
| 3 | Add/remove roles | Checkboxes toggle |
| 4 | Save changes | Success toast |
| 5 | Verify roles updated | Member shows new roles |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### MEM-004: Remove Member from Team
**Prerequisites**: Team admin, member to remove

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find member in list | Member visible |
| 2 | Click remove button | Confirmation dialog |
| 3 | Confirm removal | Member removed from list |
| 4 | Removed user's perspective | Team no longer in switcher |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

## 6. Role System Tests

### ROLE-001: View Default Roles
**Prerequisites**: Team admin, new team

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Team Settings > Roles | Roles tab loads |
| 2 | View role list | Default roles visible |
| 3 | Default roles present | Full Access, Deal Manager, Transaction Coordinator, Finance, View Only |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### ROLE-002: Create Custom Role
**Prerequisites**: Team admin

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Create Role" | Role form modal opens |
| 2 | Enter role name | Field accepts input |
| 3 | Enter description | Field accepts input |
| 4 | Set permissions | Permission matrix works |
| 5 | Click "Create" | Role created, appears in list |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### ROLE-003: Edit Role
**Prerequisites**: Team admin, custom role exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find role in list | Role visible |
| 2 | Click edit button | Edit modal opens |
| 3 | Change name/description | Fields editable |
| 4 | Change permissions | Matrix updates |
| 5 | Save changes | Success toast, list updates |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### ROLE-004: Delete Role (No Members)
**Prerequisites**: Team admin, role with no members assigned

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find unassigned role | Role visible |
| 2 | Click delete button | Confirmation dialog |
| 3 | Confirm deletion | Role removed from list |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### ROLE-005: Cannot Delete Role with Members
**Prerequisites**: Team admin, role assigned to member

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find assigned role | Role shows member count > 0 |
| 2 | Try to delete | Error message or disabled |
| 3 | Role remains | Role still in list |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### ROLE-006: Permission Matrix
**Prerequisites**: Team admin

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open role edit modal | Permission matrix visible |
| 2 | All 11 sections shown | inbox, dashboard, pay_time, team, whiteboard, contacts, employees, transactions, calendar, reports, settings |
| 3 | Toggle section to "Full" | Checkbox/toggle works |
| 4 | Toggle section to "View" | Changes correctly |
| 5 | Toggle section to "None" | Access removed |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### ROLE-007: Multiple Roles Permission Merging
**Prerequisites**: User with 2+ roles having different permissions

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Assign Role A (contacts: view) | Role assigned |
| 2 | Assign Role B (contacts: full) | Role assigned |
| 3 | Login as that user | Logged in |
| 4 | Navigate to Contacts | Has FULL access (merged) |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

## 7. Organization Owner Tests

### ORG-001: Access Org Settings
**Prerequisites**: User is org owner

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click team switcher | Dropdown opens |
| 2 | Click org name with gear | Navigates to org settings |
| 3 | See General, Teams, Members tabs | Navigation works |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### ORG-002: Update Organization Name
**Prerequisites**: Org owner

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Go to Org Settings > General | General tab loads |
| 2 | Edit organization name | Field editable |
| 3 | Save changes | Success toast |
| 4 | Verify in team switcher | New name displayed |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### ORG-003: View All Org Members
**Prerequisites**: Org owner, multiple users across teams

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Go to Org Settings > Members | Members tab loads |
| 2 | View member list | ALL users from ALL teams shown |
| 3 | See team memberships | Each user shows their teams |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### ORG-004: Make User an Org Owner
**Prerequisites**: Org owner, non-owner user exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find non-owner user | User in list |
| 2 | Click "Make Owner" | Confirmation dialog |
| 3 | Confirm | User now shows "Owner" badge |
| 4 | That user can access org settings | Verified |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### ORG-005: Remove Org Owner
**Prerequisites**: Multiple org owners, not removing creator

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find non-creator owner | Owner badge visible |
| 2 | Click "Remove Owner" | Confirmation dialog |
| 3 | Confirm | Owner badge removed |
| 4 | User loses org settings access | Cannot access |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### ORG-006: Cannot Remove Original Creator
**Prerequisites**: Org owner viewing creator

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find org creator | Has "Creator" badge |
| 2 | Look for "Remove Owner" button | Disabled or not present |
| 3 | Cannot demote creator | Protected |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### ORG-007: Cannot Remove Last Owner
**Prerequisites**: Only one org owner

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Try to remove self as owner | Error message |
| 2 | Owner status preserved | Still an owner |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### ORG-008: Manage User's Team Memberships
**Prerequisites**: Org owner, user in some teams

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Go to Org Settings > Members | Page loads |
| 2 | Find user, click "Manage Teams" | Modal opens |
| 3 | See all org teams with toggles | Teams listed |
| 4 | Toggle user into new team | Switch toggles |
| 5 | Toggle user out of team | Switch toggles |
| 6 | Verify changes | User's team list updated |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

## 8. Permission Level Tests

### PERM-001: Admin Full Access
**Prerequisites**: User with admin permission level

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as admin user | Logged in |
| 2 | Access Team Settings | Can access |
| 3 | Can edit members | Edit buttons visible |
| 4 | Can manage roles | Roles tab accessible |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### PERM-002: Member Role-Based Access
**Prerequisites**: User with member permission, limited role

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as member | Logged in |
| 2 | Access granted sections | Sections work |
| 3 | Access denied sections | Redirected or blocked |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### PERM-003: Viewer Read-Only
**Prerequisites**: User with viewer permission level

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as viewer | Logged in |
| 2 | Navigate to allowed section | Page loads |
| 3 | Look for edit controls | Hidden or disabled |
| 4 | View-only banner displays | Banner visible |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### PERM-004: Access Denied Page
**Prerequisites**: User without access to a section

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as restricted user | Logged in |
| 2 | Navigate to restricted section URL | Access denied page |
| 3 | Clear message displayed | Explains no access |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

## 9. Superadmin Tests

### ADMIN-001: Access Admin Panel
**Prerequisites**: User with is_superadmin = true

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as superadmin | Logged in |
| 2 | Navigate to `/admin` | Admin dashboard loads |
| 3 | See admin sidebar | Navigation visible |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### ADMIN-002: Admin Dashboard Stats
**Prerequisites**: Superadmin

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View admin dashboard | Stats cards visible |
| 2 | Shows organization count | Number displayed |
| 3 | Shows team count | Number displayed |
| 4 | Shows user count | Number displayed |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### ADMIN-003: User Management
**Prerequisites**: Superadmin

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Admin > Users | User list loads |
| 2 | Search for user | Search works |
| 3 | Click on user | User details page |
| 4 | See user's teams | Team memberships shown |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### ADMIN-004: Toggle Superadmin Status
**Prerequisites**: Superadmin

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find non-superadmin user | User in list |
| 2 | Toggle superadmin ON | Confirmation required |
| 3 | Confirm | User is now superadmin |
| 4 | Toggle OFF | User no longer superadmin |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### ADMIN-005: Organization Management
**Prerequisites**: Superadmin

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Admin > Organizations | Org list loads |
| 2 | Click organization | Org details page |
| 3 | See teams in org | Teams listed |
| 4 | See org owners | Owners shown |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### ADMIN-006: Team Management
**Prerequisites**: Superadmin

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Admin > Teams | Team list loads |
| 2 | Click team | Team details page |
| 3 | See team members | Members listed |
| 4 | See team roles | Roles shown |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### ADMIN-007: Role Template Management
**Prerequisites**: Superadmin

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Admin > Role Templates | Template list loads |
| 2 | View default templates | 5 templates shown |
| 3 | Edit template | Modal opens |
| 4 | Save changes | Template updated |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### ADMIN-008: Non-Superadmin Cannot Access
**Prerequisites**: Regular user (not superadmin)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as regular user | Logged in |
| 2 | Navigate to `/admin` | Redirected or access denied |
| 3 | No admin link visible | Admin not in navigation |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### ADMIN-009: Type Template Management
**Prerequisites**: Superadmin

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Admin > Type Templates | Type Templates page loads |
| 2 | View three tabs | Contact Types, Company Types, Employee Types tabs with count badges |
| 3 | Click Employee Types tab | Employee type templates listed |
| 4 | Click "Create Template" | Create dialog opens with name, description, icon, color, auto-install fields |
| 5 | Fill form and create | Template created, appears in list |
| 6 | Click edit on non-system template | Edit dialog opens with pre-filled values |
| 7 | Save changes | Template updated |
| 8 | Click delete on non-system template | Confirmation dialog warns about team impact |
| 9 | Confirm deletion | Template removed |
| 10 | Verify system templates | System templates show lock badge, no edit/delete actions |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

## 10. Theme & UI Tests

### UI-001: Light Mode Display
**Prerequisites**: None

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Set theme to light mode | Theme toggles |
| 2 | Background is light | White/light gray |
| 3 | Text is dark | Readable |
| 4 | Teal primary color visible | Buttons, links |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### UI-002: Dark Mode Display
**Prerequisites**: None

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Set theme to dark mode | Theme toggles |
| 2 | Background is dark | Dark gray/black |
| 3 | Text is light | Readable |
| 4 | Teal primary color visible | Buttons, links |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### UI-003: Theme Toggle
**Prerequisites**: None

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find theme toggle | In header/user menu |
| 2 | Click to change theme | Theme switches |
| 3 | Refresh page | Theme persists |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### UI-004: Mobile Responsive - Sidebar
**Prerequisites**: Mobile viewport (< 768px)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Resize to mobile width | Layout adjusts |
| 2 | Sidebar collapses | Hidden by default |
| 3 | Hamburger menu visible | Menu button appears |
| 4 | Click hamburger | Sidebar opens |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### UI-005: Mobile Responsive - Team Switcher
**Prerequisites**: Mobile viewport

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View team switcher on mobile | Adapts to width |
| 2 | Click to open | Dropdown works |
| 3 | Can select team | Navigation works |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

## 11. Contact Management Tests

### CONTACT-001: View Contact List
**Prerequisites**: Team member with contacts access, team has contacts

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Contacts section | ContactHub loads with Contacts tab active |
| 2 | View contact list | Table displays contacts with name, types, phone, email, companies |
| 3 | Verify pagination | Page controls shown when more than 25 contacts |
| 4 | Verify type badges | Color-coded type badges displayed per contact |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### CONTACT-002: Create New Contact
**Prerequisites**: Team member with contacts access

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Add Contact" button | Create contact modal opens |
| 2 | Enter first name (required) | Field accepts input |
| 3 | Enter last name | Field accepts input |
| 4 | Select one or more contact types | Type checkboxes toggle |
| 5 | Add contact methods (phone, email) | Contact method inputs work |
| 6 | Add notes | Textarea accepts input |
| 7 | Click "Create" | Contact created, success toast, appears in list |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### CONTACT-003: View Contact Detail (Drawer)
**Prerequisites**: At least one contact exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click on contact row in list | Contact detail drawer opens from right |
| 2 | View summary panel | Name, avatar, types, contact info displayed |
| 3 | See companies section | Associated companies with roles listed |
| 4 | See notes preview | Notes shown (truncated to 150 chars) |
| 5 | See activity preview | Recent activity entries shown |
| 6 | Click "View Full Details" | Navigates to ContactDetailPage |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### CONTACT-004: View Contact Detail (Full Page)
**Prerequisites**: Contact exists with types, methods, and activity

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to contact detail page | Two-column layout loads |
| 2 | Left column shows contact info | Name, types, methods, companies, notes, custom fields |
| 3 | Right column shows activity feed | Activity entries with timestamps |
| 4 | Custom fields grouped by type | Fields displayed per assigned type |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### CONTACT-005: Edit Contact
**Prerequisites**: Team member, contact exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open contact detail page | Detail view loads |
| 2 | Click edit button | Form mode activates |
| 3 | Edit name, types, methods, notes | Fields are editable |
| 4 | Save changes | Success toast, changes persist on reload |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### CONTACT-006: Delete Contact
**Prerequisites**: Team admin, contact exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open contact detail | Detail loads |
| 2 | Click delete button | Confirmation dialog shows dependency info |
| 3 | Dialog shows company link count | Impact information displayed |
| 4 | Confirm deletion | Contact removed, redirected to list |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### CONTACT-007: Search Contacts
**Prerequisites**: Multiple contacts exist

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Type in search box | List filters after debounce (300ms) |
| 2 | Search by first name | Matching contacts shown |
| 3 | Search by last name | Matching contacts shown |
| 4 | Clear search | Full list restored |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### CONTACT-008: Filter Contacts by Type
**Prerequisites**: Contacts with different types assigned

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click type filter dropdown | Available types listed |
| 2 | Select a type (e.g., "Seller") | Only contacts with that type shown |
| 3 | Select additional type | Filter updates (OR logic) |
| 4 | Clear filter | Full list restored |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

## 12. Company Management Tests

### COMPANY-001: View Company List
**Prerequisites**: Team member, ContactHub accessible

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to ContactHub | Page loads with Contacts tab |
| 2 | Click "Companies" tab | Companies tab activates with count badge |
| 3 | View company list | Table shows name, types, phone, email, POC |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### COMPANY-002: Create New Company
**Prerequisites**: Team member with contacts access

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On Companies tab, click "Add Company" | Create company modal opens |
| 2 | Enter company name (required) | Field accepts input |
| 3 | Enter address, city, state, zip | Address fields accept input |
| 4 | Enter website | Field accepts input |
| 5 | Select company types | Type checkboxes toggle |
| 6 | Add contact methods (phone, email) | Method inputs work |
| 7 | Click "Create" | Company created, success toast, appears in list |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### COMPANY-003: View Company Detail
**Prerequisites**: At least one company exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click on company row in list | Company detail drawer opens |
| 2 | View company info | Name, address, types, methods shown |
| 3 | See linked contacts | Associated contacts with roles listed |
| 4 | See POC indicator | Point-of-contact highlighted if set |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### COMPANY-004: Edit Company
**Prerequisites**: Team member, company exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open company detail | Detail loads |
| 2 | Edit name, address, website | Fields are editable |
| 3 | Change type assignments | Types update |
| 4 | Set POC contact | POC dropdown works |
| 5 | Save changes | Success toast, changes persist |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### COMPANY-005: Delete Company
**Prerequisites**: Team admin, company exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open company detail | Detail loads |
| 2 | Click delete button | Confirmation dialog with dependency info |
| 3 | Confirm deletion | Company removed from list |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### COMPANY-006: Link Contact to Company
**Prerequisites**: Both a contact and company exist

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open contact detail page in edit mode | Edit form loads |
| 2 | Find company association section | Section visible |
| 3 | Add company with role title | Association created |
| 4 | Save changes | Link persists |
| 5 | Verify company shows in contact detail | Company listed with role |
| 6 | Verify contact shows in company detail | Contact listed with role |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### COMPANY-007: Search and Filter Companies
**Prerequisites**: Multiple companies with various types

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter search text in search box | Company list filters by name |
| 2 | Use type filter dropdown | Only matching companies shown |
| 3 | Clear filters | Full list restored |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

## 13. Contact & Company Types (Settings) Tests

### TYPE-001: View Team Contact Types
**Prerequisites**: Team admin

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Settings | Settings home card grid loads |
| 2 | Click "Contact Types" card | Contact Types page loads |
| 3 | View type list | Default types listed (Seller, Buyer, Investor, Agent, etc.) |
| 4 | Each type shows icon, color, usage count | Details visible |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### TYPE-002: Create Custom Contact Type
**Prerequisites**: Team admin

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Create Type" button | Type creation wizard opens |
| 2 | Enter type name | Field accepts input |
| 3 | Enter description | Field accepts input |
| 4 | Select icon | Icon picker works |
| 5 | Select color | Color picker works |
| 6 | Click "Create" | New type appears in list |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### TYPE-003: Edit Contact Type
**Prerequisites**: Team admin, type exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click edit on a type | Edit modal opens |
| 2 | Change name, icon, or color | Fields update |
| 3 | Toggle active/inactive | Status changes |
| 4 | Save changes | Success toast, list updates |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### TYPE-004: Delete Unused Contact Type
**Prerequisites**: Team admin, type with 0 usage count

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find type with 0 usage count | Type visible in list |
| 2 | Click delete | Confirmation dialog |
| 3 | Confirm deletion | Type removed from list |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### TYPE-005: Cannot Delete Type in Use
**Prerequisites**: Team admin, type assigned to contacts

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find type with usage count > 0 | Type visible |
| 2 | Attempt to delete | Error message or delete disabled |
| 3 | Type remains in list | Not removed |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### TYPE-006: View Team Company Types
**Prerequisites**: Team admin

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Settings | Settings home loads |
| 2 | Click "Company Types" card | Company Types page loads |
| 3 | View type list | Default types listed (Title Company, Lender, Brokerage, etc.) |
| 4 | Each type shows icon, color, usage count | Details visible |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### TYPE-007: Create Custom Company Type
**Prerequisites**: Team admin

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Create Type" | Type creation wizard opens |
| 2 | Enter type name, select icon and color | Fields work |
| 3 | Click "Create" | New company type appears in list |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### TYPE-008: Edit and Delete Company Type
**Prerequisites**: Team admin, custom company type exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click edit on company type | Modal opens, fields editable |
| 2 | Save changes | Success toast, list updates |
| 3 | Delete unused company type | Confirmation dialog, type removed |
| 4 | Attempt delete of in-use type | Error or disabled |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

## 14. Custom Fields Tests

### FIELD-001: Add Custom Field to Type
**Prerequisites**: Team admin, contact or company type exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Contact Types or Company Types settings | Page loads |
| 2 | Click "Manage Fields" on a type | Custom field definition manager opens |
| 3 | Click "Add Field" | Field definition form opens |
| 4 | Enter field name, select type (text, number, date, etc.) | Fields work |
| 5 | Set required/optional | Toggle works |
| 6 | Save field | Field appears in type's field list |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### FIELD-002: Add Dropdown/Multi-Select Field with Options
**Prerequisites**: Team admin

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Add new field, select "Dropdown" or "Multi-Select" type | Options input appears |
| 2 | Add multiple options | Options listed |
| 3 | Save field | Field with options created successfully |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### FIELD-003: Edit Custom Field Definition
**Prerequisites**: Custom field definition exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click edit on a field definition | Edit form opens |
| 2 | Change name, type, or options | Fields update |
| 3 | Save changes | Definition updated, success toast |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### FIELD-004: Delete Custom Field Definition
**Prerequisites**: Custom field definition exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click delete on a field definition | Confirmation dialog |
| 2 | Confirm deletion | Field removed from list |
| 3 | Existing values for this field cascade deleted | No orphaned data |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### FIELD-005: Fill Custom Field Values on Contact
**Prerequisites**: Contact exists with assigned type that has custom fields defined

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open contact detail page | Page loads |
| 2 | Find custom fields section | Fields grouped by type |
| 3 | Fill in text, number, date, dropdown fields | Inputs accept values |
| 4 | Save values | Values persisted |
| 5 | Reload page | Saved values shown correctly |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### FIELD-006: Orphan Preservation on Type Removal
**Prerequisites**: Contact with type assigned and custom field values filled

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Remove a type from the contact | Type unassigned |
| 2 | Custom field values preserved (orphaned) | Values not deleted |
| 3 | Re-assign the same type | Type reassigned |
| 4 | Custom field values restored | Previous values reappear |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

## 15. Activity Log Tests

### ACT-001: View Activity Feed
**Prerequisites**: Contact or company with activity entries

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to contact detail page | Page loads |
| 2 | Find activity section (right column) | Activity feed visible |
| 3 | Entries show user name, timestamp, content | Properly formatted |
| 4 | Most recent entries at top | Reverse chronological order |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### ACT-002: Add Comment
**Prerequisites**: Team member, contact detail page

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find comment input area | Input visible |
| 2 | Type a comment | Text entered |
| 3 | Submit comment | Comment appears in feed at top |
| 4 | Verify user name and timestamp | Correctly attributed |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### ACT-003: Edit Own Comment
**Prerequisites**: User has posted a comment

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find own comment in feed | Comment visible |
| 2 | Click edit action | Comment becomes editable |
| 3 | Change text and save | Updated text shown |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### ACT-004: Delete Own Comment
**Prerequisites**: User has posted a comment

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find own comment | Comment visible |
| 2 | Click delete action | Confirmation dialog |
| 3 | Confirm deletion | Comment removed from feed |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### ACT-005: Cannot Edit/Delete Others' Comments (Non-Admin)
**Prerequisites**: Non-admin team member, comment by another user exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find another user's comment | Comment visible |
| 2 | Look for edit/delete actions | Not visible or disabled |
| 3 | Comment is read-only | Cannot modify |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

## 16. Team Settings Navigation Tests

### SET-001: Settings Home Card Grid
**Prerequisites**: Team admin or member with settings access

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Settings | Settings home page loads |
| 2 | View category cards | 3 categories: General, Contact Hub, Automation |
| 3 | Each card shows icon, label, description | Properly rendered |
| 4 | Click a card | Navigates to corresponding settings page |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### SET-002: Settings Search
**Prerequisites**: Settings home page

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Type in search box | Cards filter in real time |
| 2 | Search "roles" | Only Roles card shown |
| 3 | Search "automators" | Only Automators card shown |
| 4 | Clear search | All cards restored |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### SET-003: Navigate to Settings Subpage
**Prerequisites**: Settings home page

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Team Members" card | TeamMembersPage loads |
| 2 | Verify sidebar shows active item | "Team Members" highlighted |
| 3 | Click "Roles" in sidebar | RolesPage loads |
| 4 | Click back/home link | Settings home page loads |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### SET-004: Settings Sidebar Navigation
**Prerequisites**: Any settings subpage

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View sidebar | Settings items grouped by category |
| 2 | Click each sidebar item | Corresponding page loads |
| 3 | Active item highlighted | Visual indicator present |
| 4 | Categories match: General, Contact Hub, Automation | Correct grouping |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### SET-005: View-Only Banner for Non-Admin
**Prerequisites**: Team member (not admin) with settings view access

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Settings | Settings home loads |
| 2 | View-only banner displayed | Banner indicates read-only access |
| 3 | Edit/create buttons hidden | Admin-only controls not visible |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

## 17. Automator Builder Tests

### AUTO-001: View Automator List
**Prerequisites**: Team admin, navigate to Settings > Automators

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Settings > Automators | Automator list page loads |
| 2 | View list (may be empty) | Table or empty state shown |
| 3 | Status badges visible | Draft/Published shown with appropriate colors |
| 4 | Purple accent color used | Automator UI uses purple theme |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### AUTO-002: Create New Automator
**Prerequisites**: Team admin

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Create Automator" button | Form modal opens |
| 2 | Enter automator name (required) | Field accepts input |
| 3 | Enter description (optional) | Field accepts input |
| 4 | Click "Create" | Automator created as Draft, redirects to builder |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### AUTO-003: Automator Builder Layout
**Prerequisites**: Automator exists, navigate to builder

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to automator builder page | Full-page builder loads |
| 2 | Verify 3-panel layout | Left: NodePalette, Center: Canvas, Right: ConfigurationPanel |
| 3 | Toolbar visible at top | Name, status badge, save/publish buttons shown |
| 4 | Canvas is interactive | Can pan and zoom |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### AUTO-004: Add Nodes to Canvas
**Prerequisites**: Automator builder open

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Drag Start node from palette | Start node appears on canvas |
| 2 | Drag End node from palette | End node appears on canvas |
| 3 | Drag Decision node from palette | Decision node appears on canvas |
| 4 | Drag Data Collection node from palette | Data Collection node appears on canvas |
| 5 | Nodes are visually distinct | Different styles per node type |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### AUTO-005: Configure Node Properties
**Prerequisites**: Nodes placed on canvas

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click on a Decision node | ConfigurationPanel shows decision properties |
| 2 | Enter question text | Field accepts input |
| 3 | Click on Data Collection node | Panel shows field configuration |
| 4 | Set field type, name, required | Properties configurable |
| 5 | Click on End node | Panel shows outcome (success/failure/cancelled) |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### AUTO-006: Save Automator Draft
**Prerequisites**: Builder with nodes/edges configured

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Save" in toolbar | Definition saved, success indicator |
| 2 | Navigate away from builder | Can leave page |
| 3 | Return to builder | Saved state persists (nodes, edges, viewport) |
| 4 | Status remains "Draft" | Badge shows Draft |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### AUTO-007: Publish and Unpublish Automator
**Prerequisites**: Automator in draft status with valid definition

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Publish" in toolbar | Confirmation or action executes |
| 2 | Status changes to "Published" | Badge updates |
| 3 | Version number incremented | Version visible |
| 4 | published_at timestamp set | Timestamp shown in list |
| 5 | Click "Unpublish" | Status returns to "Draft" |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### AUTO-008: Duplicate Automator
**Prerequisites**: Automator exists in list

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find automator in list | Automator visible |
| 2 | Click duplicate action (dropdown menu) | Duplicate created |
| 3 | New automator has "(Copy)" suffix in name | Name modified |
| 4 | New automator is in Draft status | Status is Draft |
| 5 | Definition is identical to original | Same nodes and edges |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### AUTO-009: Configure Backend Actions on Node
**Prerequisites**: Automator builder open, Decision or Data Collection node on canvas

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select a Data Collection node | ConfigurationPanel shows node properties |
| 2 | Find "Backend Actions" section | Action editor visible below node config |
| 3 | Click "Add Action" | Action type selector dropdown appears |
| 4 | Select "Set Deal Field" | SetDealFieldAction config form appears |
| 5 | Configure field name and value source (static) | Fields accept input |
| 6 | Add another action "Check Checklist Item" | Second action appears in list |
| 7 | Drag to reorder actions | Actions reorder correctly |
| 8 | Delete an action | Action removed from list |
| 9 | Save automator | Actions persisted in definition |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### AUTO-010: Configure Branch-Specific Actions on Decision Node
**Prerequisites**: Builder open, Decision node on canvas

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select a Decision node | ConfigurationPanel shows decision config |
| 2 | Find "Yes Branch Actions" section | Branch-specific action editors visible |
| 3 | Add action to "Yes" branch | Action appears under Yes branch |
| 4 | Find "No Branch Actions" section | Separate section for No branch |
| 5 | Add different action to "No" branch | Action appears under No branch |
| 6 | Save automator | Branch actions persisted in definition |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### AUTO-011: Value Source Picker
**Prerequisites**: Builder open, node with action configured

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open a Set Deal Field action | Value source picker visible |
| 2 | Select "Static Value" | Text input appears for entering value |
| 3 | Switch to "Field Reference" | Dropdown lists data collection fields from workflow |
| 4 | Select a field | Field ID stored as value source |
| 5 | Switch to "Today" (for date actions) | "Today" option selects current date function |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### AUTO-012: Trigger Automator Action
**Prerequisites**: Builder open, at least one other published automator exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Add "Trigger Automator" action to a node | TriggerAutomatorAction config appears |
| 2 | Select a published automator from dropdown | Automator linked |
| 3 | Save | Purple TriggerBadge appears on the node in canvas |
| 4 | Verify parent-child relationship | parent_automator_ids updated on child automator |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### AUTO-013: Parent-Child Automator Navigation in Builder
**Prerequisites**: Automator with trigger_automator action linking to a child automator

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open parent automator in builder | Toolbar shows automator name |
| 2 | Click on child automator link (from trigger action) | Builder navigates to child automator |
| 3 | Verify breadcrumb shows parent → child | Breadcrumb navigation visible in toolbar |
| 4 | Click parent in breadcrumb | Builder navigates back to parent automator |
| 5 | Verify builder state restores | Parent's nodes, edges, viewport restored |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### AUTO-014: Automator List - Tree View and Dependencies
**Prerequisites**: At least two automators with parent-child relationship

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Settings > Automators | List page loads |
| 2 | Toggle to Tree view mode | Automators shown in parent→child hierarchy |
| 3 | Verify dependency badges | "Triggers" and "Triggered by" badges visible |
| 4 | Check completeness indicator | Warning shown if child automator not published |
| 5 | Toggle to Flat view mode | All automators shown in flat list |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

## 17b. Automator Instance Execution Tests

### INST-001: Start Automator Instance on Deal
**Prerequisites**: Deal exists, at least one published automator, deal detail page open

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to deal detail page | Page loads with Action tab visible |
| 2 | Click Action tab | ActionTab loads with "Start Automator" button |
| 3 | Click "Start Automator" | StartAutomatorDialog opens |
| 4 | Verify only published automators shown | Draft/archived automators not listed |
| 5 | Select an automator | Automator highlighted |
| 6 | Click "Start" | Instance created, dialog closes, flow map shows first interactive node |
| 7 | Verify instance appears in instance list | Status shows "Running" |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### INST-002: Execute Data Collection Step
**Prerequisites**: Running instance on a deal, current node is Data Collection type

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View current node in step interaction panel | Data collection form renders with configured fields |
| 2 | Fill in required fields | Form validation works (required fields enforced) |
| 3 | Fill in optional fields | Fields accept input |
| 4 | Click "Submit" / advance | Step recorded, actions execute, next node presented |
| 5 | Verify step history updates | Previous step shows in step history with responses |
| 6 | Verify flow map highlights next node | Visual progress updated |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### INST-003: Execute Decision Step
**Prerequisites**: Running instance, current node is Decision type

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View current node in step interaction panel | Decision question displayed with Yes/No options |
| 2 | Click "Yes" | Step recorded with branch_taken = "Yes" |
| 3 | Verify correct branch followed | Next node matches "Yes" edge target |
| 4 | Verify branch-specific actions executed | Actions for "Yes" branch run (not "No" branch actions) |
| 5 | Verify step history shows branch choice | "Yes" recorded in step log |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### INST-004: Instance Auto-Completion at End Node
**Prerequisites**: Running instance, one step away from End node

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Complete the step before End node | Step recorded |
| 2 | End node auto-completes | Instance status changes to "Completed" |
| 3 | Verify completed_at timestamp set | Timestamp visible in instance list |
| 4 | Verify flow map shows completed state | All nodes shown as completed |
| 5 | Verify end outcome recorded | Success/failure/cancelled outcome stored |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### INST-005: Cancel Running Instance
**Prerequisites**: Admin user, running instance on a deal

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find running instance in instance list | Instance visible with "Running" status |
| 2 | Click cancel action | Confirmation dialog appears |
| 3 | Confirm cancellation | Instance status changes to "Canceled" |
| 4 | Verify canceled_at timestamp set | Timestamp visible |
| 5 | Verify instance no longer shows as active | Moved to canceled filter |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### INST-006: Backend Action Execution - Set Deal Field
**Prerequisites**: Running instance with set_deal_field action configured

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Complete step that triggers set_deal_field action | Step executes |
| 2 | Verify deal field updated | Navigate to deal info, field has new value |
| 3 | Verify action logged in step | actions_executed JSONB shows success |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### INST-007: Backend Action Execution - Check Checklist Item
**Prerequisites**: Running instance with check_checklist_item action, deal has matching checklist item

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Complete step that triggers check_checklist_item | Step executes |
| 2 | Navigate to deal sidebar > Checklist | Checklist tab visible |
| 3 | Verify item auto-checked | Item shows as checked |
| 4 | Verify "Checked by [Automator Name]" badge | Purple/different styling indicates automator source |
| 5 | Verify checked_by_source metadata | Source shows automator name, instance_id, step_node_id |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### INST-008: Backend Action Execution - Trigger Child Automator
**Prerequisites**: Running instance with trigger_automator action linking to a published child automator

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Complete step that triggers trigger_automator action | Step executes |
| 2 | Verify child instance created | New instance appears in instance list |
| 3 | Verify child instance links to parent | parent_instance_id set on child |
| 4 | Verify child instance is "Running" | Status shows Running |
| 5 | Verify child is on same deal | deal_id matches parent |
| 6 | Complete child instance | Child completes independently |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### INST-009: Backend Action Error Handling
**Prerequisites**: Running instance with an action that may fail (e.g., invalid field name)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Complete step with action that errors | Step still completes successfully |
| 2 | Verify action error logged | actions_executed shows error for failed action |
| 3 | Verify other actions still ran | Subsequent actions in list were not skipped |
| 4 | Verify instance continues | Can proceed to next step |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### INST-010: Flow Map Visualization
**Prerequisites**: Running instance with multiple completed steps

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open Action tab on deal | Flow map visible |
| 2 | Verify completed nodes styled differently | Completed steps have distinct visual treatment |
| 3 | Verify current node highlighted | Active node is visually prominent |
| 4 | Verify future nodes shown | Remaining workflow visible but dimmed |
| 5 | Click a completed node | Step details panel shows responses and action results |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### INST-011: Step History
**Prerequisites**: Instance with multiple completed steps

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View step history panel | Chronological list of completed steps |
| 2 | Verify each entry shows node type, timestamp, user | Properly formatted |
| 3 | Verify data collection steps show user responses | Form data displayed |
| 4 | Verify decision steps show branch taken | "Yes" or "No" displayed |
| 5 | Verify action results shown | Executed actions with success/failure status |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### INST-012: Instance List with Filters
**Prerequisites**: Deal with multiple instances in different statuses

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View instance list on Action tab | All instances for deal shown |
| 2 | Verify columns | Automator name, status badge, progress |
| 3 | Filter by "Running" | Only running instances shown |
| 4 | Filter by "Completed" | Only completed instances shown |
| 5 | Filter by "Canceled" | Only canceled instances shown |
| 6 | Click an instance | Details panel opens with step history |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### INST-013: Realtime Instance Updates
**Prerequisites**: Two browser windows on same deal, one user starts an automator

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | User A starts an automator on deal | Instance created |
| 2 | User B sees new instance appear | Instance list updates in real-time |
| 3 | User A completes a step | Step recorded |
| 4 | User B sees instance progress update | Status/progress reflects latest state |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### INST-014: Definition Snapshot Immutability
**Prerequisites**: Running instance on a deal

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Note the current automator definition | Definition recorded |
| 2 | Edit the automator in builder (add/remove nodes) | Definition changed |
| 3 | Save and publish updated automator | New version published |
| 4 | Return to running instance on deal | Instance still works with original definition |
| 5 | Complete remaining steps | Steps follow original snapshot, not new definition |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### INST-015: TPT Progress with Automator Instances
**Prerequisites**: Deal with active automator instances

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View deal header | TPT progress bar visible |
| 2 | Verify TPT includes automator progress | Progress aggregates checklist + instance completion |
| 3 | Complete a step in an instance | TPT percentage increases |
| 4 | Complete all instances | TPT reflects full completion |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### INST-016: Cannot Start Unpublished Automator
**Prerequisites**: Deal exists, only draft automators available

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open Action tab on deal | Tab loads |
| 2 | Click "Start Automator" | Dialog opens |
| 3 | Verify draft automators not listed | Only published automators shown |
| 4 | If no published automators | Empty state or disabled start button |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### INST-017: Automator Instance Permissions
**Prerequisites**: Team with admin and member users

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | As member, start an instance | Instance created (members can start) |
| 2 | As member, execute steps | Steps recorded (members can execute) |
| 3 | As member, try to cancel instance | Cannot cancel (admin only) |
| 4 | As admin, cancel instance | Instance canceled successfully |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

## 18. Employee Directory Tests

### EMP-001: View Employee List
**Prerequisites**: Team member with employees access, team has employees

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Employees section | Employee Sentinel page loads |
| 2 | Click "Directory" tab | Directory tab activates |
| 3 | View employee table | Table shows name, job title, department, types, status, phone, email, roles |
| 4 | Verify status badges | Active (teal), Inactive (gray with 50% opacity row) |
| 5 | Verify pagination | "Showing X to Y of Z employees" with Previous/Next controls |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### EMP-002: Search Employees
**Prerequisites**: Multiple employees exist

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Type in search box | List filters after debounce (300ms) |
| 2 | Search by employee name | Matching employees shown |
| 3 | Search by email | Matching employees shown |
| 4 | Clear search | Full list restored, pagination resets to page 1 |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### EMP-003: Filter by Department
**Prerequisites**: Employees assigned to different departments

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click department filter dropdown | Active departments listed plus "All Departments" |
| 2 | Select a department | Only employees in that department shown |
| 3 | Filter badge shows "1" | Active filter indicator present |
| 4 | Select "All Departments" | Filter cleared, full list restored |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### EMP-004: Filter by Status
**Prerequisites**: Both active and inactive employees exist

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click status filter dropdown | "All", "Active", "Inactive" options shown |
| 2 | Select "Active" | Only active employees shown |
| 3 | Select "Inactive" | Only inactive employees shown (rows at 50% opacity) |
| 4 | Select "All" | Filter cleared, all employees shown |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### EMP-005: Filter by Employee Type
**Prerequisites**: Employees with different employee types assigned

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click employee type filter dropdown | Team employee types listed plus "All Types" |
| 2 | Select a type | Only employees with that type shown |
| 3 | Select "All Types" | Filter cleared, full list restored |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### EMP-006: View Employee Detail Drawer
**Prerequisites**: At least one employee exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click on employee row in directory | Detail drawer (sheet) opens from right |
| 2 | View header section | Avatar, name, status badge, department badge, type badges, job title |
| 3 | View contact info card | Primary phone, primary email, account email shown |
| 4 | View profile card | Hire date, roles (color-coded pills), permission level |
| 5 | View emergency contact (if populated) | Name, relationship, phone shown |
| 6 | View notes preview | Notes truncated to 150 chars |
| 7 | View activity preview | Recent changes shown (max 10 items) |
| 8 | Click "View Full Profile" | Navigates to full employee detail page |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### EMP-007: View Employee Full Detail Page
**Prerequisites**: Employee exists with profile data

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to employee detail page | Two-column layout loads |
| 2 | Left column shows employee info | Name, status, department, types, job title, contact methods, account, profile details, emergency contact, notes |
| 3 | Right column shows activity feed | Activity entries with timestamps and user attribution |
| 4 | Commission rules section visible | Shows effective commission rules (if any) |
| 5 | Footer shows created/updated dates | Timestamps displayed |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### EMP-008: Edit Employee Profile
**Prerequisites**: Admin user, or non-admin viewing own profile

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open employee detail page | Detail page loads |
| 2 | Click "Edit Profile" button | Form mode activates with "Edit Employee Profile" heading |
| 3 | Edit fields (job title, department, status, etc.) | Fields are editable |
| 4 | Click "Save Profile" | Success toast, changes persist on reload |
| 5 | Click "Cancel Editing" | Returns to view mode without saving |
| 6 | Verify activity log | Profile changes logged with before/after values |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

## 19. Employee Profile Form Tests

### PROF-001: Edit Job Information
**Prerequisites**: Admin or self-edit, employee detail page in edit mode

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Edit Job Title | Text input accepts value |
| 2 | Select Department from dropdown | All team departments shown, selection works |
| 3 | Set Hire Date | Date picker works |
| 4 | Change Status (Active/Inactive) | Required dropdown, selection works |
| 5 | Save changes | Success toast, all fields persist on reload |
| 6 | Verify activity log | Each changed field logged separately with before/after values |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### PROF-002: Assign Employee Types
**Prerequisites**: Team has employee types configured, employee in edit mode

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find Employee Types section in form | Type checkboxes displayed with badges (icon + color) |
| 2 | Check one or more types | Checkboxes toggle on |
| 3 | Uncheck a type | Checkbox toggles off |
| 4 | Save changes | Types updated, badges appear in detail view |
| 5 | Verify activity log | Type assignments/unassignments logged with type names |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### PROF-003: Edit Contact Methods
**Prerequisites**: Employee in edit mode

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find contact methods section | ContactMethodsInput component visible |
| 2 | Add a phone contact method | Method type, value, and label fields shown |
| 3 | Add an email contact method | Additional row added |
| 4 | Mark one as "Primary" | Primary indicator set |
| 5 | Remove a contact method | Row removed |
| 6 | Save changes | Methods persist on reload |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### PROF-004: Edit Emergency Contact
**Prerequisites**: Employee in edit mode

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find emergency contact section | Name, phone, relationship fields visible |
| 2 | Enter contact name | Field accepts input |
| 3 | Enter phone number | Field accepts input |
| 4 | Enter relationship | Field accepts input |
| 5 | Save changes | Emergency contact shown in detail view with clickable phone |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### PROF-005: View-Only Access
**Prerequisites**: Non-admin user viewing another employee's profile

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to another employee's detail page | Page loads in view mode |
| 2 | Look for "Edit Profile" button | Button NOT visible |
| 3 | All content is read-only | No edit controls shown |
| 4 | Navigate to own profile | "Edit Profile" button IS visible |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

## 20. Department Settings Tests

### DEPT-001: View Department List
**Prerequisites**: Team admin, navigate to Settings > Departments

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Settings > Departments | Departments page loads |
| 2 | View department list | Each department shows badge (icon + color + name), status, employee count |
| 3 | Count badge in header | Shows "X department(s) configured" |
| 4 | Inactive departments | Show "Inactive" badge |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### DEPT-002: Create Department
**Prerequisites**: Team admin

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Add Department" | Create dialog opens |
| 2 | Enter department name (required) | Field accepts input |
| 3 | Enter description (optional) | Textarea accepts input |
| 4 | Select icon from picker | Icon selected |
| 5 | Select color from picker | Color selected |
| 6 | Preview badge updates in real time | Badge preview reflects current form state |
| 7 | Click "Create" | Department created, appears in list |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### DEPT-003: Edit Department
**Prerequisites**: Team admin, department exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click edit (pencil) on a department | Edit dialog opens with pre-filled values |
| 2 | Change name, description, icon, or color | Fields update |
| 3 | Toggle active/inactive via switch in list | Status changes |
| 4 | Save changes | Success toast, list updates |
| 5 | Verify name uniqueness | Duplicate name shows error |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### DEPT-004: Delete Department (No Employees)
**Prerequisites**: Team admin, department with 0 employees assigned

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find department with 0 employees | Employee count badge shows "0 employee(s)" |
| 2 | Click delete (trash) button | Confirmation dialog appears |
| 3 | Confirm deletion | Department removed from list |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### DEPT-005: Cannot Delete Department with Employees
**Prerequisites**: Team admin, department with employees assigned

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find department with employees | Employee count > 0 |
| 2 | Click delete button | Dialog shows reason: "Department has X employees assigned" |
| 3 | Delete button disabled or not shown | Cannot proceed with deletion |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

## 21. Employee Types Settings Tests

### ETYPE-001: View Employee Type List
**Prerequisites**: Team admin, navigate to Settings > Employee Types

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Settings > Employee Types | Employee Types page loads |
| 2 | View type list | Types shown with badge (icon + color + name), status, usage count |
| 3 | Count in header | Shows "X type(s) configured" |
| 4 | Each type has actions | Toggle switch, edit, manage fields, delete buttons visible |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### ETYPE-002: Create Employee Type
**Prerequisites**: Team admin

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Create Type" | TypeCreationWizard opens |
| 2 | Enter type name | Field accepts input |
| 3 | Enter description | Field accepts input |
| 4 | Select icon and color | Pickers work |
| 5 | Click "Create" | New employee type appears in list |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### ETYPE-003: Edit Employee Type
**Prerequisites**: Team admin, employee type exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click edit (pencil) on a type | TypeFormModal opens with pre-filled values |
| 2 | Change name, description, icon, or color | Fields update |
| 3 | Toggle active/inactive via switch | Status changes |
| 4 | Save changes | Success toast, list updates |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### ETYPE-004: Delete Employee Type
**Prerequisites**: Team admin, employee type exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find type with 0 usage count | Type visible |
| 2 | Click delete (trash) button | Confirmation dialog |
| 3 | Confirm deletion | Type removed from list |
| 4 | Attempt to delete type with usage > 0 | Error or delete disabled |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### ETYPE-005: Manage Custom Fields for Employee Type
**Prerequisites**: Team admin, employee type exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Manage Fields" on a type | CustomFieldDefinitionManager opens |
| 2 | Add a new field definition | Field creation form works |
| 3 | Edit existing field | Field edit works |
| 4 | Delete a field | Field removed |
| 5 | Verify fields appear on employee profiles with that type | Custom fields shown in detail view |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

## 22. Commission Rules Tests

### COMM-001: View Role Commission Rules
**Prerequisites**: Team admin, role exists with commission rules

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Settings > Team Roles | Roles list loads |
| 2 | Click role dropdown > "Commission Rules" | RoleCommissionRulesSection expands below role |
| 3 | View rule cards | Each card shows name, calculation type badge (teal), summary text |
| 4 | Active/inactive toggle visible | Switch shown per rule |
| 5 | Priority badge shown (if > 0) | Badge displayed |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### COMM-002: Create Flat Fee Commission Rule
**Prerequisites**: Team admin, role exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Expand commission rules for a role | Section visible |
| 2 | Click "+ Add Rule" | RoleCommissionRuleFormModal opens |
| 3 | Enter rule name | Required field accepts input |
| 4 | Select calculation type "Flat Fee" | Amount field appears |
| 5 | Enter amount (e.g., $500) | Number field accepts value > 0 |
| 6 | Optionally set minimum deal profit | Number field accepts value |
| 7 | Set priority and notes | Optional fields work |
| 8 | Click Save | Rule created, card appears with "Flat Fee" badge and summary |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### COMM-003: Create Percentage Commission Rule
**Prerequisites**: Team admin, role exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "+ Add Rule" on a role | Form modal opens |
| 2 | Select "Percentage of Gross Profit" | Percentage and cap fields appear |
| 3 | Enter percentage (e.g., 3%) | Validates 0-100 range |
| 4 | Optionally set cap amount | Number field works |
| 5 | Click Save | Rule created with summary "3% of gross profit" |
| 6 | Repeat with "Percentage of Net Profit" | Same flow, "net profit" in summary |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### COMM-004: Create Tiered Commission Rule
**Prerequisites**: Team admin, role exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "+ Add Rule" on a role | Form modal opens |
| 2 | Select "Tiered" calculation type | Profit basis and tier bracket fields appear |
| 3 | Select profit basis (gross/net) | Dropdown works |
| 4 | Add tier: threshold $0, percentage 2% | First tier row added |
| 5 | Click "+ Add Tier" | Second tier row appears |
| 6 | Add tier: threshold $50,000, percentage 4% | Values entered |
| 7 | Click Save | Rule created with tiered summary |
| 8 | Verify tier thresholds must be increasing | Validation prevents decreasing thresholds |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### COMM-005: Edit Role Commission Rule
**Prerequisites**: Team admin, role has commission rule

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click edit (pencil) on a rule card | Form modal opens pre-filled |
| 2 | Change name or configuration | Fields update |
| 3 | Click Save | Rule updated, card refreshes |
| 4 | Verify employees inheriting this rule see updated values | Effective commissions reflect change |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### COMM-006: Delete Role Commission Rule
**Prerequisites**: Team admin, role has commission rule

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click delete (trash) on a rule card | Confirmation dialog appears |
| 2 | Warning mentions impact on employees | Message: "affects all employees who inherit via this role" |
| 3 | Confirm deletion | Rule removed from list |
| 4 | Verify employees no longer see this rule | Rule disappears from effective commissions |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### COMM-007: Toggle Role Commission Rule Active/Inactive
**Prerequisites**: Team admin, role has commission rule

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find active commission rule | Active toggle is ON |
| 2 | Toggle switch OFF | Rule card shows "Inactive" badge, opacity reduced |
| 3 | Toggle switch ON | Rule reactivated, badge removed |
| 4 | Verify employee view reflects toggle | Inactive rules shown dimmed in effective commissions |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### COMM-008: View Effective Commissions on Employee
**Prerequisites**: Employee assigned to role(s) with commission rules

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open employee detail page | Detail page loads |
| 2 | Find "Effective Commission Rules" section | Section visible with DollarSign icon |
| 3 | Rules grouped into "From Roles" and "Custom Rules" | Sections labeled |
| 4 | Role rules show source badge | Shield icon + role name |
| 5 | Each card shows: name, type badge (teal), summary | Properly formatted |
| 6 | Override button visible on role rules (admin only) | Button present |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### COMM-009: Create Employee Override with Expiration
**Prerequisites**: Admin, employee inherits role commission rule

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Override" on a role-inherited rule | CommissionOverrideFormModal opens pre-filled with role rule values |
| 2 | Modify configuration (e.g., change percentage) | Fields editable |
| 3 | Set expiration using preset (e.g., "90 days") | Date auto-calculates |
| 4 | Click Save | Override created |
| 5 | Rule card updates | Shows "Override (Role Name)" badge (amber) + "Expires [date]" badge (purple) |
| 6 | Summary reflects overridden values | New configuration displayed |
| 7 | Only this employee affected | Other employees with same role still see original |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### COMM-010: Create Custom Employee Commission Rule
**Prerequisites**: Admin, employee detail page

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "+ Add Custom Rule" | CommissionRuleFormModal opens (blank) |
| 2 | Enter rule name | Required field |
| 3 | Select calculation type | Dynamic config fields appear |
| 4 | Set effective date (required) | Date picker works |
| 5 | Optionally set end date | Date picker, must be >= effective date |
| 6 | Configure rule details | Fields validated per calculation type |
| 7 | Click Save | Rule created under "Custom Rules" section |
| 8 | Card shows "Custom" badge | No role association |
| 9 | Rule only applies to this employee | Not shared with other employees |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

## 23. My Pay & Time Dashboard Tests

### PAY-001: View Pay & Time Page
**Prerequisites**: Logged-in employee with employee profile

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to My Pay & Time | Page loads with title "My Pay & Time" |
| 2 | Summary cards visible | 4 cards: Total Earned, Pending Commissions, Deals Closed, Average Commission |
| 3 | Tab navigation visible | Commission Rules, Earnings, Activity tabs |
| 4 | Commission Rules tab active by default | Commission rules content displayed |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### PAY-002: Summary Cards Display
**Prerequisites**: Pay & Time page loaded

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View Total Earned (YTD) card | Shows $0.00 with "No deals closed yet" (green accent, left border) |
| 2 | View Pending Commissions card | Shows $0.00 with "No pending deals" (amber accent) |
| 3 | View Deals Closed (YTD) card | Shows 0 with "No deals closed yet" (teal accent) |
| 4 | View Average Commission card | Shows $0.00 with "No data yet" (muted accent) |
| 5 | Responsive grid layout | 1 col mobile, 2 cols tablet, 4 cols desktop |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### PAY-003: Commission Rules Tab
**Prerequisites**: Employee with role-based and/or custom commission rules

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click Commission Rules tab | EffectiveCommissionsSection loads |
| 2 | "From Roles" section shows inherited rules | Role rules with shield badge |
| 3 | "Custom Rules" section shows custom rules | Custom rules with "Custom" badge |
| 4 | Override badges shown where applicable | Amber "Override" badge with expiration |
| 5 | Inactive rules shown at reduced opacity | Dimmed display |
| 6 | Non-admin cannot see Add/Override buttons | Management controls hidden |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### PAY-004: Admin Employee Selector
**Prerequisites**: Admin user, team has multiple employees

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View Pay & Time page as admin | Employee selector dropdown visible in header |
| 2 | Click dropdown | List of all employees (active + inactive) with names and job titles |
| 3 | Select a different employee | Page reloads with selected employee's data |
| 4 | Purple "Admin View" banner appears | Banner: "Viewing [Name]'s Pay & Time dashboard (Admin View)" |
| 5 | Commission rules show selected employee's rules | Data reflects selected employee |
| 6 | Admin can manage rules for selected employee | Add/Override buttons visible |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### PAY-005: Activity Tab with Filters
**Prerequisites**: Employee with activity history

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click Activity tab | Activity feed loads with filter bar |
| 2 | Filter by category (All, Comments, Profile Changes, Commission, Permissions) | Feed filters correctly |
| 3 | Set date range (From/To) | Feed filtered to date range |
| 4 | Add a comment | Comment appears in feed with user attribution |
| 5 | Click Export button | CSV file downloads with filtered activity |
| 6 | Click "Load More" (if available) | Additional entries loaded (20 per batch) |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### PAY-006: No Profile State
**Prerequisites**: User account without employee profile

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to My Pay & Time | Error state displayed |
| 2 | UserX icon visible | Icon shown |
| 3 | Message displayed | "Your account doesn't have an employee profile yet" |
| 4 | Instruction shown | "Contact your team admin to set up your employee record" |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

## 24. Team Performance Dashboard Tests

### PERF-001: View Overview Tab with Metric Cards
**Prerequisites**: Team member with employees access

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Employees section | Employee Sentinel page loads |
| 2 | Overview tab active by default | TeamOverviewTab displayed |
| 3 | View 6 metric cards | Total Team Members, Commissions Paid, Pending Liability, Avg Deals, Revenue Generated, Avg Commission |
| 4 | Total Team Members shows live count | Actual count + "X active" subtitle |
| 5 | Financial cards show $0 placeholders | "Awaiting deal integration" subtitles |
| 6 | Cards have colored left borders | Visual distinction per card |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### PERF-002: Filter by Period
**Prerequisites**: Overview tab visible

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find period selector dropdown | Default: "Year to Date" |
| 2 | Select "This Month" | Selection changes |
| 3 | Select "This Quarter" | Selection changes |
| 4 | Select "Last Year" | Selection changes |
| 5 | Select "All Time" | Selection changes |
| 6 | Note: Financial data not yet connected | Placeholder values remain until deal integration |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### PERF-003: Filter by Department
**Prerequisites**: Overview tab visible, departments configured

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find department selector dropdown | Default: "All Departments" |
| 2 | Select a specific department | Department breakdown filters to selected department |
| 3 | Unassigned row hidden when department selected | Only selected department shown |
| 4 | Select "All Departments" | Full breakdown restored |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### PERF-004: Department Breakdown Display
**Prerequisites**: Overview tab visible, departments with employees

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View Department Metrics card | Card with Building2 icon |
| 2 | Each department row shows | Colored dot, name, employee count, percentage, progress bar |
| 3 | Progress bars proportional | Widths relative to max department count |
| 4 | "Unassigned" row visible | Shows employees without department assignment |
| 5 | Revenue column shows placeholder | "—" with italic text |
| 6 | Footer note visible | "Revenue and commission data available after deal integration" |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### PERF-005: Placeholder Sections Display
**Prerequisites**: Overview tab visible

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Scroll below Department Breakdown | Three placeholder sections visible |
| 2 | Employee Leaderboard placeholder | Trophy icon, "Coming Soon" message, 3 skeleton rows |
| 3 | Employee Comparison placeholder | GitCompareArrows icon, "Coming Soon" message |
| 4 | Workload Distribution placeholder | PieChart icon, "Coming Soon" message |
| 5 | All placeholders explain future functionality | Descriptive text about deal integration requirement |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

## 25. Whiteboard Pipeline Tests

### WB-001: Whiteboard Page Load
**Prerequisites**: Logged in, team selected, at least one deal exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Whiteboard page | Page loads with metric cards, filters, and deal view |
| 2 | Verify metric cards display | 6 status cards showing count and estimated profit per status |
| 3 | Verify default view is Kanban | Kanban columns visible (Active, For Sale, Pending Sale, On Hold) |
| 4 | Verify collapsed section exists | Closed/Funded/Canceled section at bottom, expandable |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### WB-002: Create New Deal
**Prerequisites**: Logged in with create permission

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "New Deal" button | Create Deal modal opens |
| 2 | Enter address (required) | Field accepts input |
| 3 | Select deal type | Dropdown shows wholesale, listing, novation, purchase |
| 4 | Select owner from team members | Dropdown populated with team members |
| 5 | Fill optional fields (city, state, zip, contract price) | Fields accept input |
| 6 | Click "Create Deal" | Modal closes, deal appears in pipeline, metric cards refresh |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### WB-003: Kanban Drag and Drop
**Prerequisites**: At least one deal in "Active" status

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Drag a deal card from Active to For Sale | Card shows grab cursor, drag overlay with rotation |
| 2 | Drop card on For Sale column | Deal status changes, card appears in new column |
| 3 | Verify metric cards update | Active count decreases, For Sale count increases |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### WB-004: List View Toggle
**Prerequisites**: At least one deal exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click List view toggle | View switches from Kanban to table |
| 2 | Verify table columns | Address, City, Status, Type, Owner, Contract Price, Closing Date |
| 3 | Click a column header | Rows sort by that column |
| 4 | Click a table row | Navigates to deal detail page |
| 5 | Verify pagination | "Showing X to Y of Z" text, Previous/Next buttons |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### WB-005: Pipeline Filters
**Prerequisites**: Multiple deals with different statuses, types, and owners

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Type in search box | Deals filter by address/city match |
| 2 | Select a status filter | Only deals with that status shown |
| 3 | Select a deal type filter | Only deals with that type shown |
| 4 | Select an owner filter | Only deals owned by that user shown |
| 5 | Verify active filter badges appear | Badges shown below filters with X to remove |
| 6 | Click "Clear Filters" | All filters reset, all deals shown |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### WB-006: Metric Card Filtering
**Prerequisites**: Deals in multiple statuses

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click a metric card (e.g., "Active") | Pipeline filters to show only Active deals |
| 2 | Click the same card again | Filter toggles off, all deals shown |
| 3 | Verify card shows ring highlight when active | Selected card has visual ring indicator |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

## 26. Deal Detail Tests

### DEAL-001: Deal Detail Page Load
**Prerequisites**: At least one deal exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click a deal from whiteboard | Deal detail page loads |
| 2 | Verify pinned header | Address, status, owner, deal type badge, TPT bar visible |
| 3 | Verify two-panel layout | Left panel (tabs) ~65%, right panel (sidebar) ~35% |
| 4 | Verify 6 tabs in left panel | Deal Info, Action, Employee, Dispo, Financial, Intake |
| 5 | Verify 4 tabs in right sidebar | Checklist, Activity, Comments, Notes |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### DEAL-002: Deal Header - Status Change
**Prerequisites**: Deal in "Active" status

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click status dropdown in header | Dropdown shows all 7 statuses with colored badges |
| 2 | Select "For Sale" | Status changes immediately |
| 3 | Select "Canceled" | Confirmation dialog appears ("Are you sure?") |
| 4 | Confirm cancellation | Status changes to Canceled |
| 5 | Select "Closed" | Confirmation dialog appears |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### DEAL-003: Deal Header - Owner Change
**Prerequisites**: Team has multiple members

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click owner dropdown in header | Dropdown shows team members |
| 2 | Select a different owner | Owner updates in header |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### DEAL-004: Deal Header - Save and Delete
**Prerequisites**: Deal detail page loaded

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Make a change (e.g., change owner) | Amber dirty indicator dot appears on Save button |
| 2 | Click Save | Changes saved, dirty indicator disappears |
| 3 | Click Delete button | Confirmation dialog appears |
| 4 | Confirm delete | Deal soft-deleted, navigates back to whiteboard |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### DEAL-005: Deal Info Tab - Contract Facts
**Prerequisites**: Deal detail page loaded, Deal Info tab active

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Expand Contract Facts section | Fields visible: Contract Price, dates, earnest money |
| 2 | Enter Contract Price | Currency field with $ prefix, commits on blur |
| 3 | Set Contract Date | Date picker works |
| 4 | Set DD Start/End dates | Date fields accept input |
| 5 | Set Closing/Extended Closing dates | Date fields accept input |
| 6 | Enter Earnest Money (amount, held by, date) | Fields accept input |
| 7 | Verify "Unsaved changes" banner appears | Banner with Save button shown at top |
| 8 | Click Save | Changes saved, banner disappears |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### DEAL-006: Deal Info Tab - Property Facts
**Prerequisites**: Deal detail page loaded

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Expand Property Facts section (collapsed by default) | Fields visible |
| 2 | Select Property Type | Dropdown with 10 options |
| 3 | Enter bed/bath/sqft/year/lot size | Number fields accept input |
| 4 | Enter ARV and Estimated Repair Cost | Currency fields in Valuation subsection |
| 5 | Enter mortgage info (lender, balance, payment) | Fields in Mortgage & Liens subsection |
| 6 | Toggle Foreclosure on | Foreclosure status and auction date fields appear |
| 7 | Save changes | All property facts persisted |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### DEAL-007: Deal Info Tab - Deal Facts & Title Stepper
**Prerequisites**: Deal detail page loaded

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Expand Deal Facts section | Fields visible including Title Status Stepper |
| 2 | Verify 3-step stepper (Open → Ordered → Ready) | Visual stepper with current step highlighted |
| 3 | Click forward step | Title status advances |
| 4 | Click backward step | Confirmation dialog appears |
| 5 | Select Purchase Type | Dropdown with 5 options |
| 6 | Enter Lead Source and Reason for Selling | Text fields accept input |
| 7 | Toggle POA Required | Checkbox toggles |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### DEAL-008: Deal Info Tab - Close Section
**Prerequisites**: Deal not yet closed

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Expand Close Section (collapsed by default) | Actual Closing Date and Price fields |
| 2 | Enter Actual Closing Date | Date picker works |
| 3 | Enter Actual Closing Price | Currency field works |
| 4 | When both fields filled | Dialog prompts "Mark deal as Closed?" |
| 5 | Confirm | Deal status changes to Closed, "Closed" badge appears |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

## 27. Deal Disposition & Showings Tests

### DISPO-001: Showings List CRUD
**Prerequisites**: Deal detail page, Dispo tab active

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Add Showing" | Dialog opens with date, time, buyer, vendor, buffer, notes |
| 2 | Set date and time (required) | Fields accept input |
| 3 | Search for buyer contact | Debounced search returns matching contacts |
| 4 | Search for vendor/runner contact | Debounced search returns matching contacts |
| 5 | Set buffer minutes (default 15) | Number field works |
| 6 | Click Add | Showing appears in table, activity logged |
| 7 | Click delete on a showing | Confirmation dialog, then showing removed |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### DISPO-002: Disposition Details
**Prerequisites**: Deal detail page, Dispo tab active

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter Original Projected Sales Price | Currency field, locks after first save |
| 2 | Enter Updated Projected Sales Price | Currency field accepts input |
| 3 | Toggle "JV Deal" on | JV configuration section appears |
| 4 | Select Fixed Amount | Currency field for JV amount appears |
| 5 | Switch to Percentage | Percentage field + calculated dollar amount appears |
| 6 | Search and assign JV Partner | Contact search, partner linked |
| 7 | Click Save | Changes persisted, diffs logged to activity |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### DISPO-003: Buyer Assignment
**Prerequisites**: Deal detail page, Dispo tab, at least one company with linked contacts

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Search for buyer company | Debounced search returns companies |
| 2 | Select a company | Company's linked contacts load in dropdown |
| 3 | Select a buyer contact | Contact assigned to deal |
| 4 | Verify buyer shows in header | Buyer contact visible |
| 5 | Click remove on assigned buyer | Buyer removed from deal |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

## 28. Deal Employee & Vendor Tests

### EMP-D-001: Assign Employee to Deal
**Prerequisites**: Deal detail page, Employee tab active, team has multiple members

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select team member from dropdown | Dropdown excludes already-assigned members |
| 2 | Enter role | Text input accepts role description |
| 3 | Click Add | Employee appears in list with avatar, name, role |
| 4 | Verify activity logged | Activity feed shows assignment |
| 5 | Verify header employee count updates | Avatar stack in header reflects new count |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### EMP-D-002: Remove Employee from Deal
**Prerequisites**: Deal has at least one assigned employee

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click delete button on employee row | Confirmation dialog appears |
| 2 | Confirm deletion | Employee removed from list |
| 3 | Verify header count updates | Avatar stack decreases |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### EMP-D-003: Assign Vendor to Deal
**Prerequisites**: Deal detail page, Employee tab active, contacts exist

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Type in vendor search field | Debounced search (300ms) returns matching contacts |
| 2 | Select a contact | Contact shown as selected |
| 3 | Enter vendor role | Text input accepts role |
| 4 | Click Add | Vendor appears in list with icon, name, role |
| 5 | Verify header vendor count updates | Vendor count in header reflects change |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### EMP-D-004: Remove Vendor from Deal
**Prerequisites**: Deal has at least one assigned vendor

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click delete button on vendor row | Confirmation dialog appears |
| 2 | Confirm deletion | Vendor removed from list |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

## 29. Deal Financial Tests

### FIN-001: Financial Summary Display
**Prerequisites**: Deal with contract price and projected sale price set

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Financial tab | 9 metric cards displayed in grid |
| 2 | Verify calculations | Contract Price, Projected Sale Price, Gross Profit, etc. |
| 3 | Verify color coding | Green for profit, red for loss, gray for neutral |
| 4 | Verify JV Fee card appears only for JV deals | Conditional display |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### FIN-002: Expense List CRUD
**Prerequisites**: Deal detail page, Financial tab active

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Add Expense" | Dialog opens with category, amount, date, description, notes |
| 2 | Select category from 8 options | Dropdown works (marketing, inspection, etc.) |
| 3 | Enter amount (required) | Currency field accepts input |
| 4 | Click Add | Expense appears in table with color-coded category badge |
| 5 | Verify total row updates | Total expenses recalculated |
| 6 | Click edit on an expense | Edit dialog pre-filled with current values |
| 7 | Update and save | Expense updated in table |
| 8 | Click delete on an expense | Confirmation dialog, expense removed |
| 9 | Verify financial summary updates | Gross After Expenses and Net Profit recalculate |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### FIN-003: Commission Breakdown
**Prerequisites**: Deal with assigned employees, contract price and sale price set

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Verify employee list with commission column | Table shows each employee with editable % input |
| 2 | Enter commission percentage for an employee | % field accepts decimal input |
| 3 | Verify calculated commission amount | Dollar amount = grossAfterExpenses * percentage / 100 |
| 4 | Verify Total Commissions row | Sum of all employee commissions |
| 5 | Verify Estimated Net Profit row | Gross after expenses minus total commissions |
| 6 | Click Save | Commission percentages persisted |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### FIN-004: Actual Results (Closed Deal)
**Prerequisites**: Deal with status "Closed" or "Funded", actual closing price set

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Financial tab | Actual Results section visible (green-tinted card) |
| 2 | Verify actual figures | Actual Close Price, Revenue, Gross Profit, Net Profit displayed |
| 3 | Verify Estimated vs Actual comparison | Shows over/under estimate amount |
| 4 | Verify section hidden for non-closed deals | ActualResults not rendered for active deals |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

## 30. Deal Sidebar Tests

### SIDE-001: Deal Checklist
**Prerequisites**: Deal with checklist items

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open Checklist tab in sidebar | Progress bar and checklist items visible |
| 2 | Toggle a checklist item | Checkbox updates optimistically, item shows strikethrough and completed date |
| 3 | Verify TPT progress bar updates | Percentage recalculates in sidebar and header |
| 4 | Uncheck an item | Item reverts to unchecked, progress decreases |
| 5 | Verify activity logged | Toggle action recorded in activity feed |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### SIDE-002: Activity Feed
**Prerequisites**: Deal with prior activity (changes, comments, etc.)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open Activity tab in sidebar | Chronological feed of activity entries |
| 2 | Verify entry format | Avatar, user name, relative time, activity icon, content |
| 3 | Scroll through entries | Entries load, "Load more" button appears after 20 items |
| 4 | Click "Load more" | Additional entries load |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### SIDE-003: Deal Comments with @Mentions
**Prerequisites**: Deal detail page, team has multiple members

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open Comments tab in sidebar | Chat-style feed, oldest first |
| 2 | Type a comment and press Cmd/Ctrl+Enter | Comment posted, auto-scrolls to bottom |
| 3 | Type "@" in comment box | Team member autocomplete dropdown appears |
| 4 | Navigate dropdown with arrow keys | Selection highlights move |
| 5 | Press Enter/Tab to select member | @mention inserted in comment |
| 6 | Post comment with @mention | @mention displayed in teal color |
| 7 | Verify tagged_user_ids stored | Mentioned user IDs saved with comment |
| 8 | Hover over own comment, click trash icon | Confirmation dialog, then comment deleted |
| 9 | Press Escape during @mention | Autocomplete dismisses |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### SIDE-004: Deal Notes
**Prerequisites**: Deal detail page loaded

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open Notes tab in sidebar | Notes list (newest first) |
| 2 | Type a note and press Cmd/Ctrl+Enter | Note posted, appears at top |
| 3 | Verify no @mention support | Typing @ does not trigger autocomplete |
| 4 | Delete own note | Confirmation dialog, note removed |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

## 31. My Dashboard (Mission Control) Tests

### DASH-001: Dashboard Page Load
**Prerequisites**: Logged-in user with deals

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Dashboard (or login) | MyDashboard loads with "Mission Control" title and user's name |
| 2 | Verify 4 sections load | Attention Needed, My Pipeline, My Financials, Recent Activity |
| 3 | Each section has independent loading | Sections show skeletons individually, render as data arrives |
| 4 | No console errors | Clean load |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### DASH-002: Deadlines Section
**Prerequisites**: Deals with upcoming closing dates, DD expirations, or extended closing dates

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View Deadlines section | "Deadlines This Week" header with count badge |
| 2 | Verify deadline rows | Each row shows: clickable address, deadline type badge, date, days remaining, status badge |
| 3 | Verify color coding | Red for ≤3 days, amber for ≤7 days, gray for >7 days |
| 4 | Click 14d button | Header changes to "Next 2 Weeks", more deadlines may appear |
| 5 | Click 30d button | Header changes to "Next 30 Days" |
| 6 | Click a deal address | Navigates to deal detail page |
| 7 | Verify empty state | "No upcoming deadlines — you're clear." with green checkmark |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### DASH-003: Automator Steps Waiting
**Prerequisites**: Running automator instances where user is owner/TC on the deal

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View "Waiting For You" section | Purple Zap icon, count badge |
| 2 | Each waiting step shows | Deal address, automator name, current step label, relative time |
| 3 | Click "Continue" button | Navigates to deal detail Action tab |
| 4 | Click deal address | Navigates to deal detail |
| 5 | Verify empty state | "No steps waiting — all caught up." with purple checkmark |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### DASH-004: Stale Deals Section
**Prerequisites**: Deals with no activity_logs entries in 7+ days (active/for_sale/pending_sale status)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View "Needs Attention" section | Amber alert icon, count badge |
| 2 | Each stale deal shows | Address (clickable), status badge, days since activity, owner name |
| 3 | Verify color coding | Red for ≥14 days, amber for ≥7 days |
| 4 | Click deal address | Navigates to deal detail |
| 5 | Verify empty state | "All deals have recent activity." with green checkmark |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### DASH-005: Pipeline Metric Cards
**Prerequisites**: User has deals in various statuses

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View pipeline cards | 7 cards: Active, For Sale, Pending Sale, Closed, Funded, On Hold, Canceled |
| 2 | Each card shows | Status label, deal count (large bold), projected/actual profit |
| 3 | Cards have colored left borders | Teal for active, green for closed/funded, amber for on hold, red for canceled |
| 4 | Profit color-coded | Green for positive, red for negative, gray for zero |
| 5 | Click a card | Navigates to Whiteboard filtered by that status |
| 6 | Responsive layout | 2 cols mobile → 3 cols tablet → 7 cols desktop |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### DASH-006: Financial Summary Cards
**Prerequisites**: User has deals with pricing data

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View financial cards | 4 cards: Pipeline Value, Closed Revenue, My Commissions, Total Expenses |
| 2 | Closed Revenue card has MTD/QTD toggle | Inline toggle buttons |
| 3 | Click QTD | Revenue updates to quarterly total |
| 4 | Pipeline Value shows teal accent | Dollar amount formatted |
| 5 | Expenses show red accent | Dollar amount formatted |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### DASH-007: Recent Activity Feed
**Prerequisites**: User's deals have activity entries

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View Recent Activity section | Timeline-style feed, 15 entries max |
| 2 | Each entry shows | User avatar, name, relative time, activity icon, deal address (clickable), description |
| 3 | Click deal address | Navigates to deal detail |
| 4 | Click "Load more" | Additional entries load |
| 5 | Verify empty state | "No recent activity." |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### DASH-008: Empty Dashboard (Zero Deals)
**Prerequisites**: User with zero deals

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Dashboard | Page loads without errors |
| 2 | Deadlines section | "No upcoming deadlines — you're clear." |
| 3 | Pipeline cards | All show 0 count with $0 profit |
| 4 | Financial cards | All show $0 |
| 5 | Activity feed | "No recent activity." |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

## 32. Team Dashboard Tests

### TEAM-D-001: Team Dashboard Page Load
**Prerequisites**: User with team section access

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Team Dashboard | Page loads with "Team Overview" title |
| 2 | PeriodToggle visible in header | MTD / QTD / YTD buttons |
| 3 | Verify 5 sections load | Pipeline, Workload (or permission message), Financials, Recently Closed, Activity |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### TEAM-D-002: Pipeline Overview with Period Toggle
**Prerequisites**: Team has deals in various statuses including closed

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View pipeline cards | Same 7-status layout as My Dashboard plus Canceled |
| 2 | Click QTD toggle | Closed/Funded counts and profits update to quarter scope |
| 3 | Click YTD toggle | Closed/Funded counts update to year scope |
| 4 | Click MTD toggle | Returns to month scope |
| 5 | Cards clickable | Navigate to Whiteboard filtered by status |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### TEAM-D-003: Team Workload Table (Full Access)
**Prerequisites**: Team admin or user with full access to team section

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View Team Workload section | Table visible with team member rows |
| 2 | Columns shown | Team Member, Active, For Sale, Pending, Closed (MTD), Pipeline Value |
| 3 | Click column header | Rows sort by that column |
| 4 | Click same header again | Sort direction toggles |
| 5 | Default sort | By active count descending (busiest first) |
| 6 | Member with 0 active deals | Row has amber highlight |
| 7 | Member with 10+ active deals | Row has red highlight |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### TEAM-D-004: Team Workload Hidden (View Access)
**Prerequisites**: User with view-only access to team section

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Team Dashboard | Page loads |
| 2 | Workload table NOT visible | Table replaced with card |
| 3 | Lock icon and message shown | "Contact your team admin for workload details." |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### TEAM-D-005: Team Financials
**Prerequisites**: Team has deals with pricing data

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View Team Financials section | 4 cards: Pipeline Value, Closed Revenue, Total Expenses, Net Profit |
| 2 | Period toggle affects financials | Changing MTD/QTD/YTD updates revenue, expenses, net profit |
| 3 | Net Profit color-coded | Green for positive, red for negative |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### TEAM-D-006: Recently Closed List
**Prerequisites**: Team has deals closed in last 30 days

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View Recently Closed section | Trophy icon, "(Last 30 days)" subtitle |
| 2 | Table columns | Deal (clickable), Closed Date, Sale Price, Net Profit, Owner |
| 3 | Net Profit color-coded | Green for positive, red for negative |
| 4 | Click deal address | Navigates to deal detail |
| 5 | Deals older than 30 days | NOT shown |
| 6 | Empty state | "No deals closed in the last 30 days." |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### TEAM-D-007: Team Activity Feed
**Prerequisites**: Team has recent deal activity

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View Team Activity section | Activity feed with entries across all team deals |
| 2 | Shows up to 25 entries | Limit is higher than My Dashboard (15) |
| 3 | Each entry shows user, deal, and action | Same format as My Dashboard feed |
| 4 | Click deal address | Navigates to deal detail |
| 5 | "Load more" for pagination | Additional entries load |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

## 33. Transaction Guardian Tests

### TXN-001: Transaction Guardian Page Load
**Prerequisites**: User with transactions section access

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Transactions | Page loads with "Transaction Guardian" title |
| 2 | Three tabs visible | Active, Scheduled, Overdue |
| 3 | Refresh button visible | Refresh icon in header |
| 4 | Active tab is default | Active tasks shown |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### TXN-002: Active Tasks Tab
**Prerequisites**: Running automator instances with waiting steps

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View Active tab | Task cards displayed |
| 2 | Each card shows | Deal address, automator name, next step label, timing info |
| 3 | Status badge shows "Active" | Primary-colored badge |
| 4 | Click "Go to Deal" | Navigates to deal detail page |
| 5 | Empty state | "No active tasks — all automators are up to date." |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### TXN-003: Scheduled Tasks Tab
**Prerequisites**: Automator instances with wait nodes and future wait_show_at dates

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click Scheduled tab | Scheduled tasks displayed |
| 2 | Each card shows | Deal, automator, "Show in X hours/days", optional due time |
| 3 | Status badge shows "Scheduled" | Amber-colored badge |
| 4 | Empty state | "No scheduled tasks." |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### TXN-004: Overdue Tasks Tab
**Prerequisites**: Automator instances with wait_due_at in the past

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click Overdue tab | Overdue tasks displayed |
| 2 | Each card shows | Deal, automator, overdue indicator (alert triangle) |
| 3 | Status badge shows "Overdue" | Red-colored badge |
| 4 | Empty state | "No overdue tasks — everything is on schedule." |
| 5 | Verify overdue count in tab badge | Count shown on Overdue tab |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

### TXN-005: Refresh Tasks
**Prerequisites**: Transaction Guardian page loaded

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click Refresh button | Loading spinner appears |
| 2 | Tasks re-fetched from server | Updated data displayed |
| 3 | Tab counts update | Badges reflect latest counts |

- [ ] **PASS** / [ ] **FAIL**

**Notes**: _________________________________

---

## Test Summary

| Category | Total Tests | Passed | Failed |
|----------|-------------|--------|--------|
| 1. Authentication | 6 | | |
| 2. Team Switcher | 6 | | |
| 3. Invitations | 6 | | |
| 4. Join Links | 5 | | |
| 5. Member Management | 4 | | |
| 6. Role System | 7 | | |
| 7. Organization Owners | 8 | | |
| 8. Permission Levels | 4 | | |
| 9. Superadmin | 9 | | |
| 10. Theme & UI | 5 | | |
| 11. Contact Management | 8 | | |
| 12. Company Management | 7 | | |
| 13. Contact & Company Types | 8 | | |
| 14. Custom Fields | 6 | | |
| 15. Activity Log | 5 | | |
| 16. Team Settings Navigation | 5 | | |
| 17. Automator Builder | 14 | | |
| 17b. Automator Instance Execution | 17 | | |
| 18. Employee Directory | 8 | | |
| 19. Employee Profile Form | 5 | | |
| 20. Department Settings | 5 | | |
| 21. Employee Types Settings | 5 | | |
| 22. Commission Rules | 10 | | |
| 23. My Pay & Time Dashboard | 6 | | |
| 24. Team Performance Dashboard | 5 | | |
| 25. Whiteboard Pipeline | 6 | | |
| 26. Deal Detail | 8 | | |
| 27. Deal Disposition & Showings | 3 | | |
| 28. Deal Employee & Vendor | 4 | | |
| 29. Deal Financial | 4 | | |
| 30. Deal Sidebar | 4 | | |
| 31. My Dashboard (Mission Control) | 8 | | |
| 32. Team Dashboard | 7 | | |
| 33. Transaction Guardian | 5 | | |
| **TOTAL** | **231** | | |

---

## Tester Information

**Tested By**: _________________________________

**Date**: _________________________________

**Environment**: _________________________________

**Browser**: _________________________________

**Notes/Issues Found**:

_________________________________

_________________________________

_________________________________

---

*Last updated: February 2026*
