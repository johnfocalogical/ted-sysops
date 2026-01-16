import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, Rocket, CheckCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { StepIndicator } from '@/components/shared/StepIndicator'
import { useAuth } from '@/hooks/useAuth'

// Step 1: Account details schema
const accountSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

// Step 2: Organization schema
const orgSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
})

// Step 3: Team schema
const teamSchema = z.object({
  teamName: z.string().min(2, 'Team name must be at least 2 characters'),
})

type AccountFormData = z.infer<typeof accountSchema>
type OrgFormData = z.infer<typeof orgSchema>
type TeamFormData = z.infer<typeof teamSchema>

const STEPS = ['Account', 'Organization', 'Team']

export function Signup() {
  const navigate = useNavigate()
  const { signUpWithOrgAndTeam } = useAuth()
  const [currentStep, setCurrentStep] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)

  // Store data from completed steps
  const [accountData, setAccountData] = useState<AccountFormData | null>(null)
  const [orgData, setOrgData] = useState<OrgFormData | null>(null)

  // Step 1: Account form
  const accountForm = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  // Step 2: Organization form
  const orgForm = useForm<OrgFormData>({
    resolver: zodResolver(orgSchema),
    defaultValues: {
      companyName: '',
    },
  })

  // Step 3: Team form
  const teamForm = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      teamName: '',
    },
  })

  const handleAccountSubmit = (data: AccountFormData) => {
    setAccountData(data)
    setCurrentStep(1)
  }

  const handleOrgSubmit = (data: OrgFormData) => {
    setOrgData(data)
    setCurrentStep(2)
  }

  const handleTeamSubmit = async (data: TeamFormData) => {
    if (!accountData || !orgData) return

    setError(null)
    setIsSubmitting(true)

    const { data: result, error } = await signUpWithOrgAndTeam({
      email: accountData.email,
      password: accountData.password,
      full_name: accountData.fullName,
      org_name: orgData.companyName,
      team_name: data.teamName,
    })

    setIsSubmitting(false)

    if (error) {
      // Check for specific error types
      if (error.message.includes('already registered') || error.message.includes('already exists')) {
        setError('An account with this email already exists. Please log in instead.')
      } else {
        setError(error.message)
      }
    } else if (result?.needsEmailConfirmation) {
      setNeedsConfirmation(true)
    } else if (result) {
      // Redirect to the newly created team's dashboard
      navigate(`/org/${result.org_id}/team/${result.team_id}/dashboard`)
    }
  }

  const goToStep = (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step)
    }
  }

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Show confirmation message if email verification is required
  if (needsConfirmation) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <Rocket className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">TED SYSOPS</span>
            </Link>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <Card className="w-full max-w-md border border-border">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
              <CardDescription>
                We've sent a confirmation link to your email address.
                Click the link to activate your account and access your workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link to="/login">
                <Button variant="outline" className="mt-4">
                  Return to Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Rocket className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">TED SYSOPS</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md border border-border">
          <CardHeader className="text-center">
            <StepIndicator
              steps={STEPS}
              currentStep={currentStep}
              onStepClick={goToStep}
            />
            <CardTitle className="text-2xl font-bold">
              {currentStep === 0 && 'Create Your Account'}
              {currentStep === 1 && 'Set Up Your Organization'}
              {currentStep === 2 && 'Create Your First Team'}
            </CardTitle>
            <CardDescription>
              {currentStep === 0 && 'Enter your personal details to get started'}
              {currentStep === 1 && 'Tell us about your company'}
              {currentStep === 2 && 'Teams are workspaces where you manage deals'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm mb-4">
                {error}
                {error.includes('already exists') && (
                  <Link to="/login" className="block mt-2 underline font-medium">
                    Go to Login
                  </Link>
                )}
              </div>
            )}

            {/* Step 1: Account Details */}
            {currentStep === 0 && (
              <Form {...accountForm}>
                <form onSubmit={accountForm.handleSubmit(handleAccountSubmit)} className="space-y-4">
                  <FormField
                    control={accountForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="John Smith"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={accountForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="john@company.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={accountForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Create a password"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          At least 8 characters with uppercase, lowercase, and number
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={accountForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Confirm your password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    Continue
                  </Button>
                </form>
              </Form>
            )}

            {/* Step 2: Organization */}
            {currentStep === 1 && (
              <Form {...orgForm}>
                <form onSubmit={orgForm.handleSubmit(handleOrgSubmit)} className="space-y-4">
                  <FormField
                    control={orgForm.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="Acme Real Estate LLC"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          This is your organization's billing and management entity
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={goBack}
                      className="flex-1"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-primary hover:bg-primary/90"
                    >
                      Continue
                    </Button>
                  </div>
                </form>
              </Form>
            )}

            {/* Step 3: Team */}
            {currentStep === 2 && (
              <Form {...teamForm}>
                <form onSubmit={teamForm.handleSubmit(handleTeamSubmit)} className="space-y-4">
                  <FormField
                    control={teamForm.control}
                    name="teamName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team Name</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="Main Team"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          You can create additional teams later for different projects or locations
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={goBack}
                      className="flex-1"
                      disabled={isSubmitting}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-primary hover:bg-primary/90"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Workspace'
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            )}

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
