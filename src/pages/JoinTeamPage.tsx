import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Rocket, Users, AlertCircle, CheckCircle2, Mail, LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

// Types for team data with join link
interface TeamWithJoinLink {
  id: string
  name: string
  slug: string
  org_id: string
  join_code: string
  default_role_id: string | null
  organization: {
    id: string
    name: string
  }
  default_role: {
    id: string
    name: string
  } | null
}

type PageState = 'loading' | 'invalid' | 'disabled' | 'new-user' | 'existing-user' | 'already-member' | 'success' | 'needs-confirmation'

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type SignupFormData = z.infer<typeof signupSchema>

export function JoinTeamPage() {
  const { joinCode } = useParams<{ joinCode: string }>()
  const navigate = useNavigate()
  const { user, loading: authLoading, signUp } = useAuth()

  const [pageState, setPageState] = useState<PageState>('loading')
  const [team, setTeam] = useState<TeamWithJoinLink | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      fullName: '',
      password: '',
      confirmPassword: '',
    },
  })

  // Fetch team by join code
  useEffect(() => {
    const fetchTeam = async () => {
      if (!supabase || !joinCode) {
        setPageState('invalid')
        return
      }

      try {
        const { data, error } = await supabase
          .from('teams')
          .select(`
            id, name, slug, org_id, join_code, default_role_id,
            organization:organizations!inner (id, name),
            default_role:team_roles (id, name)
          `)
          .eq('join_code', joinCode)
          .eq('join_link_enabled', true)
          .single()

        if (error || !data) {
          // Could be disabled or invalid
          // Try to check if team exists but link is disabled
          const { data: disabledTeam } = await supabase
            .from('teams')
            .select('id')
            .eq('join_code', joinCode)
            .single()

          if (disabledTeam) {
            setPageState('disabled')
          } else {
            setPageState('invalid')
          }
          return
        }

        setTeam(data as unknown as TeamWithJoinLink)
      } catch {
        setPageState('invalid')
      }
    }

    fetchTeam()
  }, [joinCode])

  // Determine page state based on auth and team
  useEffect(() => {
    if (authLoading || !team || pageState === 'invalid' || pageState === 'disabled') {
      return
    }

    const checkUserState = async () => {
      if (!user) {
        setPageState('new-user')
        return
      }

      // Check if already a member
      if (supabase) {
        const { data: existingMember } = await supabase
          .from('team_members')
          .select('id')
          .eq('team_id', team.id)
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
  }, [authLoading, user, team, pageState])

  const joinTeam = async (userId: string) => {
    if (!supabase || !team) return false

    try {
      // Add to team_members with default role
      const { error: teamError } = await supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          user_id: userId,
          permission_level: 'member',
          role_id: team.default_role_id
        })

      if (teamError) {
        console.error('Failed to add to team:', teamError)
        throw new Error('Failed to join team')
      }

      return true
    } catch (err) {
      console.error('Join team error:', err)
      throw err
    }
  }

  const onSignupSubmit = async (data: SignupFormData) => {
    if (!team) return

    setError(null)

    try {
      // Sign up with provided email
      const { error: signUpError, needsConfirmation } = await signUp(
        data.email,
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

      // Join the team
      await joinTeam(newUser.id)

      // Redirect to team dashboard
      navigate(`/org/${team.org_id}/team/${team.id}/dashboard`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account')
    }
  }

  const handleJoinTeam = async () => {
    if (!user || !team) return

    setJoining(true)
    setError(null)

    try {
      await joinTeam(user.id)
      setPageState('success')

      // Redirect after brief delay to show success
      setTimeout(() => {
        navigate(`/org/${team.org_id}/team/${team.id}/dashboard`)
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

  // Invalid join code
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
              <CardTitle className="text-2xl font-bold">Invalid Join Link</CardTitle>
              <CardDescription>
                This join link is invalid or doesn't exist.
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

  // Join link disabled
  if (pageState === 'disabled') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <Card className="w-full max-w-md border border-border">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <LinkIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <CardTitle className="text-2xl font-bold">Join Link Disabled</CardTitle>
              <CardDescription>
                This team's join link is currently disabled. Please contact the team admin for an invitation.
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
                You're already a member of <span className="font-medium text-foreground">{team?.name}</span>.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button
                onClick={() => navigate(`/org/${team?.org_id}/team/${team?.id}/dashboard`)}
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
              <CardTitle className="text-2xl font-bold">Welcome to {team?.name}!</CardTitle>
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
                We've sent a confirmation link to your email address.
                Please verify your email to complete joining the team.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground">
                After confirming, you'll be able to access {team?.name}.
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
              <CardTitle className="text-2xl font-bold">Join {team?.name}</CardTitle>
              <CardDescription>
                You've been invited to join{' '}
                <span className="font-medium text-foreground">{team?.name}</span> at{' '}
                <span className="font-medium text-foreground">{team?.organization.name}</span>.
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
                  <span className="font-medium">{team?.organization.name}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Team:</span>{' '}
                  <span className="font-medium">{team?.name}</span>
                </div>
                {team?.default_role && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Your role:</span>{' '}
                    <span className="font-medium">{team.default_role.name}</span>
                  </div>
                )}
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
            <CardTitle className="text-2xl font-bold">Join {team?.name}</CardTitle>
            <CardDescription>
              Create an account to join{' '}
              <span className="font-medium text-foreground">{team?.name}</span> at{' '}
              <span className="font-medium text-foreground">{team?.organization.name}</span>.
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

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                to={`/login?redirect=/join/${joinCode}`}
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
