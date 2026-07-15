import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { AuthLayout } from './AuthLayout'
import { RoleSelector } from './RoleSelector'
import { Button, Field, Input } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { loginSchema, type LoginValues } from '@/lib/schemas'
import { ApiError } from '@/api/client'
import { roleHome } from '@/routes/nav'
import type { Role } from '@/types'

export default function Login() {
  const [role, setRole] = useState<Role>('patient')
  const [showPw, setShowPw] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string })?.from

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (values: LoginValues) => {
    setSubmitting(true)
    try {
      const user = await login(role, values.email, values.password)
      toast.success('Welcome back!', `Signed in as ${user.name || user.email}`)
      navigate(from || roleHome(user.role), { replace: true })
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Login failed. Please try again.'
      toast.error('Sign in failed', message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to access your unified health workspace."
      footer={
        <>
          New to HealSync?{' '}
          <Link to="/signup" className="font-semibold text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <RoleSelector value={role} onChange={setRole} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="Email address" htmlFor="email" error={errors.email?.message} required>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            leftIcon={<Mail className="h-4.5 w-4.5" />}
            invalid={!!errors.email}
            {...register('email')}
          />
        </Field>

        <Field label="Password" htmlFor="password" error={errors.password?.message} required>
          <Input
            id="password"
            type={showPw ? 'text' : 'password'}
            placeholder="Enter your password"
            autoComplete="current-password"
            leftIcon={<Lock className="h-4.5 w-4.5" />}
            invalid={!!errors.password}
            rightIcon={
              <button type="button" onClick={() => setShowPw((s) => !s)} className="hover:text-foreground" tabIndex={-1}>
                {showPw ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            }
            {...register('password')}
          />
        </Field>

        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" size="lg" fullWidth loading={submitting}>
          Sign in
        </Button>
      </form>
    </AuthLayout>
  )
}
