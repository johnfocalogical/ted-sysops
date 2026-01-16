import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { Home } from '@/pages/Home'
import { Login } from '@/pages/Login'
import { Signup } from '@/pages/Signup'
import { ForgotPassword } from '@/pages/ForgotPassword'
import { AcceptInvitePage } from '@/pages/AcceptInvitePage'
import { JoinTeamPage } from '@/pages/JoinTeamPage'
import { ThemeTest } from '@/pages/ThemeTest'
import { ProtectedRoute } from '@/components/shared/ProtectedRoute'
import { TeamAccessGuard } from '@/components/shared/TeamAccessGuard'
import { TeamRedirect } from '@/components/shared/TeamRedirect'
import { AppLayout } from '@/components/layouts/AppLayout'

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
          <Route path="dashboard" element={<MyDashboard />} />
          <Route path="pay-time" element={<PayTime />} />
          <Route path="team" element={<TeamDashboard />} />
          <Route path="whiteboard" element={<Whiteboard />} />
          <Route path="contacts" element={<ContactHub />} />
          <Route path="employees" element={<Employees />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
  )
}

export default App
