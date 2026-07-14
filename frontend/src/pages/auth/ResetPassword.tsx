import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { z } from 'zod'
import { AuthLayout } from './AuthLayout'
import { Button, Field, Input } from '@/components/ui'
import { authApi } from '@/api/auth'
import { useToast } from '@/context/ToastContext'
import { resetSchema } from '@/lib/schemas'
import { ApiError } from '@/api/client'
import type { Role } from '@/types'

type Values = z.infer<typeof resetSchema>

export default function ResetPassword() {
  const { token = '' } = useParams()
  const [params] = useSearchParams()
  const role = (params.get('role') as Role) || 'patient'
  const [showPw, setShowPw] = useState(false)
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const toast = useToast()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(resetSchema) })

  const onSubmit = async (values: Values) => {
    setSubmitting(true)
    try {
      await authApi.resetPassword(role, token, values.password)
      setDone(true)
      setTimeout(() => navigate('/login'), 2200)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Reset failed.'
      toast.error('Could not reset password', message)
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <AuthLayout title="Password updated">
        <div className="space-y-5 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-success-soft text-success">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <p className="text-sm text-muted-foreground">
            Your password has been changed. Redirecting you to sign in…
          </p>
          <Link to="/login">
            <Button fullWidth>Sign in now</Button>
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Set a new password" subtitle="Choose a strong password you haven't used before.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="New password" htmlFor="password" error={errors.password?.message} required>
          <Input
            id="password"
            type={showPw ? 'text' : 'password'}
            placeholder="At least 8 characters"
            leftIcon={<Lock className="h-4.5 w-4.5" />}
            invalid={!!errors.password}
            rightIcon={
              <button type="button" onClick={() => setShowPw((s) => !s)} tabIndex={-1} className="hover:text-foreground">
                {showPw ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            }
            {...register('password')}
          />
        </Field>
        <Field label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword?.message} required>
          <Input
            id="confirmPassword"
            type={showPw ? 'text' : 'password'}
            placeholder="Re-enter password"
            leftIcon={<Lock className="h-4.5 w-4.5" />}
            invalid={!!errors.confirmPassword}
            {...register('confirmPassword')}
          />
        </Field>
        <Button type="submit" size="lg" fullWidth loading={submitting}>
          Update password
        </Button>
      </form>
    </AuthLayout>
  )
}
