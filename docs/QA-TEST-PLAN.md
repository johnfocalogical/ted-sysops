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
| 9. Superadmin | 8 | | |
| 10. Theme & UI | 5 | | |
| **TOTAL** | **59** | | |

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

*Last updated: January 2025*
