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
import { TeamAccessGuard } from '@/components/shared/TeamAccessGuard'
import { SectionAccessGuard } from '@/components/shared/SectionAccessGuard'
import { TeamRedirect } from '@/components/shared/TeamRedirect'
import { AppLayout } from '@/components/layouts/AppLayout'
import { AdminLayout } from '@/components/admin/AdminLayout'

// Admin pages
import { AdminDashboard } from '@/pages/admin/AdminDashboard'
import { AdminUsers } from '@/pages/admin/AdminUsers'
import { AdminUserDetails } from '@/pages/admin/AdminUserDetails'
import { AdminOrganizations } from '@/pages/admin/AdminOrganizations'
import { AdminOrgDetails } from '@/pages/admin/AdminOrgDetails'
import { AdminTeams } from '@/pages/admin/AdminTeams'
import { AdminTeamDetails } from '@/pages/admin/AdminTeamDetails'
import { AdminRoleTemplates } from '@/pages/admin/AdminRoleTemplates'

// App pages
import { MyDashboard } from '@/pages/MyDashboard'
import { PayTime } from '@/pages/PayTime'
import { TeamDashboard } from '@/pages/TeamDashboard'
import { Whiteboard } from '@/pages/Whiteboard'
import { ContactHub } from '@/pages/ContactHub'
import { Employees } from '@/pages/Employees'
import { Transactions } from '@/pages/Transactions'
import { CalendarPage } from '@/pages/CalendarPage'
import { Reports } from '@/pages/Reports'
import { SettingsPage } from '@/pages/SettingsPage'

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
          <Route path="employees" element={
            <SectionAccessGuard section="employees">
              <Employees />
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
          <Route path="settings" element={
            <SectionAccessGuard section="settings">
              <SettingsPage />
            </SectionAccessGuard>
          } />
          <Route path="access-denied" element={<AccessDeniedPage />} />
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
  )
}

export default App
