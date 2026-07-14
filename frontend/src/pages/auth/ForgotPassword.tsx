import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Mail, MailCheck } from 'lucide-react'
import { z } from 'zod'
import { AuthLayout } from './AuthLayout'
import { RoleSelector } from './RoleSelector'
import { Button, Field, Input } from '@/components/ui'
import { authApi } from '@/api/auth'
import { useToast } from '@/context/ToastContext'
import { forgotSchema } from '@/lib/schemas'
import { ApiError } from '@/api/client'
import type { Role } from '@/types'

type Values = z.infer<typeof forgotSchema>

export default function ForgotPassword() {
  const [role, setRole] = useState<Role>('patient')
  const [sent, setSent] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const toast = useToast()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(forgotSchema) })

  const onSubmit = async (values: Values) => {
    setSubmitting(true)
    try {
      await authApi.forgotPassword(role, values.email)
      setSent(values.email)
    } catch (err) {
      // Don't leak whether an email exists; still show the success state unless it's a real server error.
      if (err instanceof ApiError && err.status && err.status >= 500) {
        toast.error('Something went wrong', err.message)
      } else {
        setSent(values.email)
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <AuthLayout title="Check your inbox">
        <div className="space-y-5">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-success-soft text-success">
            <MailCheck className="h-8 w-8" />
          </div>
          <p className="text-center text-sm text-muted-foreground">
            If an account exists for <span className="font-semibold text-foreground">{sent}</span>, we've
            sent a password reset link. It expires in 10 minutes.
          </p>
          <Link to="/login">
            <Button variant="outline" fullWidth leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Back to sign in
            </Button>
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your account email and we'll send you a reset link."
      footer={
        <Link to="/login" className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
      }
    >
      <RoleSelector value={role} onChange={setRole} />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="Email address" htmlFor="email" error={errors.email?.message} required>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            leftIcon={<Mail className="h-4.5 w-4.5" />}
            invalid={!!errors.email}
            {...register('email')}
          />
        </Field>
        <Button type="submit" size="lg" fullWidth loading={submitting}>
          Send reset link
        </Button>
      </form>
    </AuthLayout>
  )
}
