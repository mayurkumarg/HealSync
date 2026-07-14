import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { CheckCircle2, XCircle } from 'lucide-react'
import { AuthLayout } from './AuthLayout'
import { Button, Spinner } from '@/components/ui'
import { api } from '@/api/client'
import type { Role } from '@/types'

const BASE: Record<Role, string> = {
  patient: '/auth',
  doctor: '/doctor',
  hospital: '/hospital',
  pharmacy: '/pharmacy',
}

export default function VerifyEmail() {
  const { token = '' } = useParams()
  const [params] = useSearchParams()
  const role = (params.get('role') as Role) || 'patient'
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')

  useEffect(() => {
    let active = true
    api
      .get(`${BASE[role]}/verify/${token}`)
      .then(() => active && setStatus('ok'))
      .catch(() => active && setStatus('error'))
    return () => {
      active = false
    }
  }, [token, role])

  return (
    <AuthLayout title="Email verification">
      <div className="space-y-5 text-center">
        {status === 'loading' && (
          <>
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary-soft">
              <Spinner size={30} />
            </div>
            <p className="text-sm text-muted-foreground">Verifying your email address…</p>
          </>
        )}
        {status === 'ok' && (
          <>
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-success-soft text-success">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <p className="text-sm text-muted-foreground">
              Your email is verified. You can now sign in to your account.
            </p>
            <Link to="/login">
              <Button fullWidth size="lg">
                Continue to sign in
              </Button>
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-danger-soft text-danger">
              <XCircle className="h-8 w-8" />
            </div>
            <p className="text-sm text-muted-foreground">
              This verification link is invalid or has expired. Please sign up again to receive a new one.
            </p>
            <Link to="/signup">
              <Button variant="outline" fullWidth>
                Back to sign up
              </Button>
            </Link>
          </>
        )}
      </div>
    </AuthLayout>
  )
}
