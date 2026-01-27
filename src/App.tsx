import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { Home } from '@/pages/Home'
import { Login } from '@/pages/Login'
import { Signup } from '@/pages/Signup'
import { ForgotPassword } from '@/pages/ForgotPassword'
import { AcceptInvitePage } from '@/pages/AcceptInvitePage'
import { JoinTeamPage } from '@/pages/JoinTeamPage'
import { AccessDeniedPage } from '@/pages/AccessDeniedPage'
import { ThemeTest } from '@/pages/ThemeTest'
import { ProtectedRoute } from '@/components/shared/ProtectedRoute'
import { SuperadminGuard } from '@/components/shared/SuperadminGuard'
import { OrgOwnerGuard } from '@/components/shared/OrgOwnerGuard'
import { TeamAccessGuard } from '@/components/shared/TeamAccessGuard'
import { SectionAccessGuard } from '@/components/shared/SectionAccessGuard'
import { TeamRedirect } from '@/components/shared/TeamRedirect'
import { AppLayout } from '@/components/layouts/AppLayout'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { OrgSettingsLayout } from '@/components/layouts/OrgSettingsLayout'
import { TeamSettingsLayout } from '@/components/settings/TeamSettingsLayout'

// Admin pages
import { AdminDashboard } from '@/pages/admin/AdminDashboard'
import { AdminUsers } from '@/pages/admin/AdminUsers'
import { AdminUserDetails } from '@/pages/admin/AdminUserDetails'
import { AdminOrganizations } from '@/pages/admin/AdminOrganizations'
import { AdminOrgDetails } from '@/pages/admin/AdminOrgDetails'
import { AdminTeams } from '@/pages/admin/AdminTeams'
import { AdminTeamDetails } from '@/pages/admin/AdminTeamDetails'
import { AdminRoleTemplates } from '@/pages/admin/AdminRoleTemplates'
import { AdminTypeTemplates } from '@/pages/admin/AdminTypeTemplates'

// Org settings pages
import { OrgGeneralSettings } from '@/pages/org-settings/OrgGeneralSettings'
import { OrgTeamsPage } from '@/pages/org-settings/OrgTeamsPage'
import { OrgMembersPage } from '@/pages/org-settings/OrgMembersPage'

// App pages
import { Inbox } from '@/pages/Inbox'
import { MyDashboard } from '@/pages/MyDashboard'
import { PayTime } from '@/pages/PayTime'
import { TeamDashboard } from '@/pages/TeamDashboard'
import { Whiteboard } from '@/pages/Whiteboard'
import { ContactHub } from '@/pages/ContactHub'
import { ContactDetailPage } from '@/pages/ContactDetailPage'
import { Employees } from '@/pages/Employees'
import { EmployeeDetailPage } from '@/pages/EmployeeDetailPage'
import { Transactions } from '@/pages/Transactions'
import { CalendarPage } from '@/pages/CalendarPage'
import { Reports } from '@/pages/Reports'
// Team settings pages
import { SettingsHomePage } from '@/pages/settings/SettingsHomePage'
import { TeamMembersPage } from '@/pages/settings/TeamMembersPage'
import { RolesPage } from '@/pages/settings/RolesPage'
import { ContactTypesPage } from '@/pages/settings/ContactTypesPage'
import { CompanyTypesPage } from '@/pages/settings/CompanyTypesPage'
import { AutomatorsPage } from '@/pages/settings/AutomatorsPage'
import { AutomatorBuilderPage } from '@/pages/settings/AutomatorBuilderPage'
import { DepartmentsPage } from '@/pages/settings/DepartmentsPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/invite/:invitationId" element={<AcceptInvitePage />} />
        <Route path="/join/:joinCode" element={<JoinTeamPage />} />
        <Route path="/theme-test" element={<ThemeTest />} />

        {/* Legacy route redirects - these redirect to team-scoped URLs */}
        <Route path="/dashboard" element={<ProtectedRoute><TeamRedirect /></ProtectedRoute>} />
        <Route path="/pay-time" element={<ProtectedRoute><TeamRedirect /></ProtectedRoute>} />
        <Route path="/team" element={<ProtectedRoute><TeamRedirect /></ProtectedRoute>} />
        <Route path="/whiteboard" element={<ProtectedRoute><TeamRedirect /></ProtectedRoute>} />
        <Route path="/contacts" element={<ProtectedRoute><TeamRedirect /></ProtectedRoute>} />
        <Route path="/employees" element={<ProtectedRoute><TeamRedirect /></ProtectedRoute>} />
        <Route path="/transactions" element={<ProtectedRoute><TeamRedirect /></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute><TeamRedirect /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><TeamRedirect /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><TeamRedirect /></ProtectedRoute>} />

        {/* Admin routes (superadmin only) */}
        <Route
          path="/admin"
          element={
            <SuperadminGuard>
              <AdminLayout />
            </SuperadminGuard>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="organizations" element={<AdminOrganizations />} />
          <Route path="organizations/:orgId" element={<AdminOrgDetails />} />
          <Route path="teams" element={<AdminTeams />} />
          <Route path="teams/:teamId" element={<AdminTeamDetails />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="users/:userId" element={<AdminUserDetails />} />
          <Route path="role-templates" element={<AdminRoleTemplates />} />
          <Route path="type-templates" element={<AdminTypeTemplates />} />
        </Route>

        {/* Org settings routes (org owners only) */}
        <Route
          path="/org/:orgId/settings"
          element={
            <ProtectedRoute>
              <OrgOwnerGuard>
                <OrgSettingsLayout />
              </OrgOwnerGuard>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="general" replace />} />
          <Route path="general" element={<OrgGeneralSettings />} />
          <Route path="teams" element={<OrgTeamsPage />} />
          <Route path="members" element={<OrgMembersPage />} />
        </Route>

        {/* Team-scoped app routes */}
        <Route
          path="/org/:orgId/team/:teamId"
          element={
            <ProtectedRoute>
              <TeamAccessGuard>
                <AppLayout />
              </TeamAccessGuard>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="inbox" element={
            <SectionAccessGuard section="inbox">
              <Inbox />
            </SectionAccessGuard>
          } />
          <Route path="dashboard" element={
            <SectionAccessGuard section="dashboard">
              <MyDashboard />
            </SectionAccessGuard>
          } />
          <Route path="pay-time" element={
            <SectionAccessGuard section="pay_time">
              <PayTime />
            </SectionAccessGuard>
          } />
          <Route path="team" element={
            <SectionAccessGuard section="team">
              <TeamDashboard />
            </SectionAccessGuard>
          } />
          <Route path="whiteboard" element={
            <SectionAccessGuard section="whiteboard">
              <Whiteboard />
            </SectionAccessGuard>
          } />
          <Route path="contacts" element={
            <SectionAccessGuard section="contacts">
              <ContactHub />
            </SectionAccessGuard>
          } />
          <Route path="contacts/:contactId" element={
            <SectionAccessGuard section="contacts">
              <ContactDetailPage />
            </SectionAccessGuard>
          } />
          <Route path="employees" element={
            <SectionAccessGuard section="employees">
              <Employees />
            </SectionAccessGuard>
          } />
          <Route path="employees/:employeeId" element={
            <SectionAccessGuard section="employees">
              <EmployeeDetailPage />
            </SectionAccessGuard>
          } />
          <Route path="transactions" element={
            <SectionAccessGuard section="transactions">
              <Transactions />
            </SectionAccessGuard>
          } />
          <Route path="calendar" element={
            <SectionAccessGuard section="calendar">
              <CalendarPage />
            </SectionAccessGuard>
          } />
          <Route path="reports" element={
            <SectionAccessGuard section="reports">
              <Reports />
            </SectionAccessGuard>
          } />
          <Route path="access-denied" element={<AccessDeniedPage />} />
        </Route>

        {/* Team settings routes (dedicated layout) */}
        <Route
          path="/org/:orgId/team/:teamId/settings"
          element={
            <ProtectedRoute>
              <TeamAccessGuard>
                <SectionAccessGuard section="settings">
                  <TeamSettingsLayout />
                </SectionAccessGuard>
              </TeamAccessGuard>
            </ProtectedRoute>
          }
        >
          <Route index element={<SettingsHomePage />} />
          <Route path="team-members" element={<TeamMembersPage />} />
          <Route path="roles" element={<RolesPage />} />
          <Route path="contact-types" element={<ContactTypesPage />} />
          <Route path="company-types" element={<CompanyTypesPage />} />
          <Route path="automators" element={<AutomatorsPage />} />
          <Route path="departments" element={<DepartmentsPage />} />
        </Route>

        {/* Automator Builder (full-page layout) */}
        <Route
          path="/org/:orgId/team/:teamId/settings/automators/:automatorId"
          element={
            <ProtectedRoute>
              <TeamAccessGuard>
                <SectionAccessGuard section="settings">
                  <AutomatorBuilderPage />
                </SectionAccessGuard>
              </TeamAccessGuard>
            </ProtectedRoute>
          }
        />
      </Routes>
      <Toaster />
    </BrowserRouter>
  )
}

export default App
