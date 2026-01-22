import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Rocket, Users, AlertCircle, CheckCircle2, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

// Types for invitation data
interface RoleInfo {
  id: string
  name: string
}

interface InvitationWithDetails {
  id: string
  email: string
  permission_level: 'admin' | 'member' | 'viewer'
  role_ids: string[]  // Changed from single role_id to array
  roles: RoleInfo[]   // Role details for display
  status: 'pending' | 'accepted' | 'expired' | 'revoked'
  expires_at: string
  team: {
    id: string
    name: string
    slug: string
    org_id: string
    organization: {
      id: string
      name: string
    }
  }
  inviter: {
    id: string
    full_name: string | null
  } | null
}

type PageState = 'loading' | 'invalid' | 'expired' | 'revoked' | 'new-user' | 'existing-user' | 'wrong-email' | 'already-member' | 'success' | 'needs-confirmation'

const signupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type SignupFormData = z.infer<typeof signupSchema>

export function AcceptInvitePage() {
  const { invitationId } = useParams<{ invitationId: string }>()
  const navigate = useNavigate()
  const { user, loading: authLoading, signUp } = useAuth()

  const [pageState, setPageState] = useState<PageState>('loading')
  const [invitation, setInvitation] = useState<InvitationWithDetails | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: '',
      password: '',
      confirmPassword: '',
    },
  })

  // Fetch invitation on mount
  useEffect(() => {
    const fetchInvitation = async () => {
      if (!supabase || !invitationId) {
        setPageState('invalid')
        return
      }

      try {
        // Use SECURITY DEFINER function to bypass RLS
        // This allows unauthenticated users to view invitation details
        const { data, error } = await supabase
          .rpc('get_invitation_details', { p_invitation_id: invitationId })

        if (error || !data) {
          setPageState('invalid')
          return
        }

        // Parse the JSON response from the RPC function
        const invitationData: InvitationWithDetails = {
          id: data.id,
          email: data.email,
          permission_level: data.permission_level as 'admin' | 'member' | 'viewer',
          role_ids: (data.roles || []).map((r: RoleInfo) => r.id),
          roles: data.roles || [],
          status: data.status as 'pending' | 'accepted' | 'expired' | 'revoked',
          expires_at: data.expires_at,
          team: data.team,
          inviter: data.inviter,
        }
        setInvitation(invitationData)

        // Check status
        if (invitationData.status === 'revoked') {
          setPageState('revoked')
          return
        }

        if (invitationData.status === 'accepted') {
          setPageState('invalid')
          return
        }

        // Check expiration
        if (new Date(invitationData.expires_at) < new Date()) {
          setPageState('expired')
          return
        }

        // Will determine user state after auth loading completes
      } catch {
        setPageState('invalid')
      }
    }

    fetchInvitation()
  }, [invitationId])

  // Determine page state based on auth and invitation
  useEffect(() => {
    if (authLoading || !invitation || pageState === 'invalid' || pageState === 'expired' || pageState === 'revoked') {
      return
    }

    const checkUserState = async () => {
      if (!user) {
        setPageState('new-user')
        return
      }

      // User is logged in - check if email matches
      if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
        setPageState('wrong-email')
        return
      }

      // Check if already a member
      if (supabase) {
        const { data: existingMember } = await supabase
          .from('team_members')
          .select('id')
          .eq('team_id', invitation.team.id)
          .eq('user_id', user.id)
          .single()

        if (existingMember) {
          setPageState('already-member')
          return
        }
      }

      setPageState('existing-user')
    }

    checkUserState()
  }, [authLoading, user, invitation, pageState])

  const acceptInvitation = async (userId: string, userEmail: string) => {
    if (!supabase || !invitation) return false

    try {
      // Use SECURITY DEFINER function to bypass RLS
      // This handles: updating invitation, creating team member, assigning roles
      const { data, error } = await supabase.rpc('accept_invitation', {
        p_invitation_id: invitation.id,
        p_user_id: userId,
        p_user_email: userEmail,
      })

      if (error) {
        console.error('Failed to accept invitation:', error)
        throw new Error(error.message || 'Failed to accept invitation')
      }

      return true
    } catch (err) {
      console.error('Accept invitation error:', err)
      throw err
    }
  }

  const onSignupSubmit = async (data: SignupFormData) => {
    if (!invitation) return

    setError(null)

    try {
      // Sign up with the invitation email
      const { error: signUpError, needsConfirmation } = await signUp(
        invitation.email,
        data.password,
        data.fullName
      )

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      if (needsConfirmation) {
        setPageState('needs-confirmation')
        return
      }

      // Wait for trigger to create public.users row
      await new Promise(resolve => setTimeout(resolve, 500))

      // Get the new user
      const { data: { user: newUser } } = await supabase!.auth.getUser()
      if (!newUser) {
        setError('Failed to get user after signup')
        return
      }

      // Accept the invitation
      await acceptInvitation(newUser.id, invitation.email)

      // Redirect to team dashboard
      navigate(`/org/${invitation.team.org_id}/team/${invitation.team.id}/dashboard`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account')
    }
  }

  const handleJoinTeam = async () => {
    if (!user || !invitation) return

    setJoining(true)
    setError(null)

    try {
      await acceptInvitation(user.id, user.email!)
      setPageState('success')

      // Redirect after brief delay to show success
      setTimeout(() => {
        navigate(`/org/${invitation.team.org_id}/team/${invitation.team.id}/dashboard`)
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join team')
      setJoining(false)
    }
  }

  // Header component used across all states
  const Header = () => (
    <header className="border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Rocket className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">TED SYSOPS</span>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  )

  // Loading state
  if (pageState === 'loading' || authLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    )
  }

  // Invalid invitation
  if (pageState === 'invalid') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <Card className="w-full max-w-md border border-border">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-2xl font-bold">Invitation Not Found</CardTitle>
              <CardDescription>
                This invitation link is invalid or has already been used.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link to="/login">
                <Button variant="outline">Go to Login</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  // Expired invitation
  if (pageState === 'expired') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <Card className="w-full max-w-md border border-border">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <CardTitle className="text-2xl font-bold">Invitation Expired</CardTitle>
              <CardDescription>
                This invitation has expired. Please ask the team admin to send a new invitation.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link to="/login">
                <Button variant="outline">Go to Login</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  // Revoked invitation
  if (pageState === 'revoked') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <Card className="w-full max-w-md border border-border">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-2xl font-bold">Invitation Revoked</CardTitle>
              <CardDescription>
                This invitation is no longer valid. Please contact the team admin if you believe this is a mistake.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link to="/login">
                <Button variant="outline">Go to Login</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  // Wrong email (logged in with different email)
  if (pageState === 'wrong-email') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <Card className="w-full max-w-md border border-border">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <CardTitle className="text-2xl font-bold">Wrong Account</CardTitle>
              <CardDescription>
                This invitation was sent to <span className="font-medium text-foreground">{invitation?.email}</span>,
                but you're logged in as <span className="font-medium text-foreground">{user?.email}</span>.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Please log out and sign in with the correct account, or create a new account with the invited email.
              </p>
              <Link to="/login">
                <Button variant="outline">Go to Login</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  // Already a member
  if (pageState === 'already-member') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <Card className="w-full max-w-md border border-border">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold">Already a Member</CardTitle>
              <CardDescription>
                You're already a member of <span className="font-medium text-foreground">{invitation?.team.name}</span>.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button
                onClick={() => navigate(`/org/${invitation?.team.org_id}/team/${invitation?.team.id}/dashboard`)}
                className="bg-primary hover:bg-primary/90"
              >
                Go to Team Dashboard
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  // Success state
  if (pageState === 'success') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <Card className="w-full max-w-md border border-border">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-2xl font-bold">Welcome to {invitation?.team.name}!</CardTitle>
              <CardDescription>
                You've successfully joined the team. Redirecting to your dashboard...
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  // Needs email confirmation
  if (pageState === 'needs-confirmation') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <Card className="w-full max-w-md border border-border">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
              <CardDescription>
                We've sent a confirmation link to <span className="font-medium text-foreground">{invitation?.email}</span>.
                Please verify your email to complete joining the team.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground">
                After confirming, you'll be able to access {invitation?.team.name}.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  // Existing user - show join button
  if (pageState === 'existing-user') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <Card className="w-full max-w-md border border-border">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold">Join {invitation?.team.name}</CardTitle>
              <CardDescription>
                {invitation?.inviter?.full_name || 'A team admin'} has invited you to join{' '}
                <span className="font-medium text-foreground">{invitation?.team.name}</span> at{' '}
                <span className="font-medium text-foreground">{invitation?.team.organization.name}</span>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">Organization:</span>{' '}
                  <span className="font-medium">{invitation?.team.organization.name}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Team:</span>{' '}
                  <span className="font-medium">{invitation?.team.name}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Your role:</span>{' '}
                  <span className="font-medium capitalize">{invitation?.permission_level}</span>
                </div>
              </div>

              <Button
                onClick={handleJoinTeam}
                disabled={joining}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {joining ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  'Join Team'
                )}
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  // New user - show signup form
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md border border-border">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Join {invitation?.team.name}</CardTitle>
            <CardDescription>
              {invitation?.inviter?.full_name || 'A team admin'} has invited you to join{' '}
              <span className="font-medium text-foreground">{invitation?.team.name}</span>.
              Create an account to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSignupSubmit)} className="space-y-4">
                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
                    {error}
                  </div>
                )}

                {/* Email (disabled, from invitation) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={invitation?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Create a password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Confirm your password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    'Create Account & Join'
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link
                to={`/login?redirect=/invite/${invitationId}`}
                className="text-primary hover:underline font-medium"
              >
                Log in
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
