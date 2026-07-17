import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { MailCheck, MapPin, Check, ShieldAlert, Eye, EyeOff } from 'lucide-react'
import { AuthLayout } from './AuthLayout'
import { RoleSelector } from './RoleSelector'
import { Button, Field, Input, Select, Alert } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { ApiError } from '@/api/client'
import { signupFields, buildSignupBody, roleNeedsLocation } from './signupConfig'
import type { Role } from '@/types'

type Result = { kind: 'sent' | 'created-no-email'; email: string } | null

export default function Signup() {
  const [role, setRole] = useState<Role>('patient')
  const [submitting, setSubmitting] = useState(false)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [locating, setLocating] = useState(false)
  const [result, setResult] = useState<Result>(null)
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set())
  const { signup } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<Record<string, string>>()

  const fields = signupFields[role]

  const togglePasswordVisible = (name: string) => {
    setVisiblePasswords((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const detectLocation = () => {
    if (!navigator.geolocation) return toast.error('Location unavailable', 'Your browser does not support geolocation.')
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocating(false)
        toast.success('Location captured')
      },
      () => {
        setLocating(false)
        toast.error('Could not get location', 'Please allow location access and try again.')
      },
    )
  }

  const onSubmit = async (values: Record<string, string>) => {
    if (values.password !== values.confirmPassword) {
      return toast.error('Passwords do not match', 'Please re-check and try again.')
    }
    setSubmitting(true)
    try {
      await signup(role, buildSignupBody(role, values, coords))
      setResult({ kind: 'sent', email: values.email })
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Signup failed.'
      // Backend creates the account first, then emails. If email isn't configured it 500s but the
      // account exists — surface that helpfully instead of as a hard failure.
      if (/email server|email sending/i.test(message)) {
        setResult({ kind: 'created-no-email', email: values.email })
      } else {
        toast.error('Could not create account', message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const switchRole = (r: Role) => {
    setRole(r)
    setCoords(null)
    reset()
  }

  if (result) {
    return (
      <AuthLayout title={result.kind === 'sent' ? 'Check your inbox' : 'Account created'}>
        <div className="space-y-5">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-success-soft text-success">
            {result.kind === 'sent' ? <MailCheck className="h-8 w-8" /> : <Check className="h-8 w-8" />}
          </div>
          {result.kind === 'sent' ? (
            <p className="text-center text-sm text-muted-foreground">
              We sent a verification link to <span className="font-semibold text-foreground">{result.email}</span>.
              Click it to activate your account, then sign in.
            </p>
          ) : (
            <Alert tone="warning" title="Verification email not sent">
              Your account was created, but email delivery isn't configured in this environment yet. An
              admin can verify your account, then you can sign in.
            </Alert>
          )}
          <Button fullWidth size="lg" onClick={() => navigate('/login')}>
            Continue to sign in
          </Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join HealSync and bring your health data together."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <RoleSelector value={role} onChange={switchRole} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <Field
              key={f.name}
              label={f.label}
              htmlFor={f.name}
              error={errors[f.name]?.message as string}
              required
              className={f.half ? '' : 'sm:col-span-2'}
            >
              {f.type === 'select' ? (
                <Select
                  id={f.name}
                  options={f.options ?? []}
                  placeholder="Select…"
                  invalid={!!errors[f.name]}
                  {...register(f.name, f.rules)}
                />
              ) : f.type === 'password' ? (
                <Input
                  id={f.name}
                  type={visiblePasswords.has(f.name) ? 'text' : 'password'}
                  placeholder={f.placeholder}
                  autoComplete={f.autoComplete}
                  invalid={!!errors[f.name]}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => togglePasswordVisible(f.name)}
                      className="hover:text-foreground"
                      tabIndex={-1}
                      aria-label={visiblePasswords.has(f.name) ? 'Hide password' : 'Show password'}
                    >
                      {visiblePasswords.has(f.name) ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  }
                  {...register(f.name, f.rules)}
                />
              ) : (
                <Input
                  id={f.name}
                  type={f.type ?? 'text'}
                  placeholder={f.placeholder}
                  autoComplete={f.autoComplete}
                  invalid={!!errors[f.name]}
                  {...register(f.name, f.rules)}
                />
              )}
            </Field>
          ))}
        </div>

        {roleNeedsLocation(role) && (
          <button
            type="button"
            onClick={detectLocation}
            className="flex w-full items-center gap-3 rounded-xl border border-dashed border-border bg-surface-2/40 p-3.5 text-left transition-colors hover:border-primary/40"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
              <MapPin className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-foreground">
                {coords ? 'Location captured' : locating ? 'Detecting location…' : 'Share precise location (optional)'}
              </span>
              <span className="block text-xs text-muted-foreground">
                {coords
                  ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)} — tap to update`
                  : "We'll use your address if you skip this"}
              </span>
            </span>
            {coords && <Check className="h-5 w-5 text-success" />}
          </button>
        )}

        {watch('password') && watch('confirmPassword') && watch('password') !== watch('confirmPassword') && (
          <p className="flex items-center gap-1.5 text-xs font-medium text-danger">
            <ShieldAlert className="h-3.5 w-3.5" /> Passwords do not match
          </p>
        )}

        <Button type="submit" size="lg" fullWidth loading={submitting}>
          Create account
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          By continuing you agree to HealSync's Terms & Privacy Policy.
        </p>
      </form>
    </AuthLayout>
  )
}
