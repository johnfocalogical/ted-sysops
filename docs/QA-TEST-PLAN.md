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
| 11. Contact Management | 8 | | |
| 12. Company Management | 7 | | |
| 13. Contact & Company Types | 8 | | |
| 14. Custom Fields | 6 | | |
| 15. Activity Log | 5 | | |
| 16. Team Settings Navigation | 5 | | |
| 17. Automator Builder | 8 | | |
| **TOTAL** | **106** | | |

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

*Last updated: January 2026*
