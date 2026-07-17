import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, XCircle, QrCode } from 'lucide-react'
import { Card, Button, Spinner } from '@/components/ui'
import { doctorApi } from '@/api/doctor'
import { ApiError } from '@/api/client'

/** Landing page for the "Claim Access as Doctor" link from a patient's scanned QR/access page
 * (backend/controllers/access/scanWeb.js). Auto-claims the token from the query string once the
 * doctor is signed in — ProtectedRoute/RoleRoute already handle bouncing through login first. */
export default function ClaimAccessPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token')
  const [state, setState] = useState<'claiming' | 'success' | 'error'>('claiming')
  const [message, setMessage] = useState('')
  const attempted = useRef(false)

  useEffect(() => {
    if (attempted.current) return
    attempted.current = true

    if (!token) {
      setState('error')
      setMessage('This link is missing an access token.')
      return
    }

    doctorApi
      .claim({ token })
      .then(() => {
        setState('success')
        setMessage('You now have access to this patient’s records.')
      })
      .catch((err) => {
        setState('error')
        setMessage(err instanceof ApiError ? err.message : 'Could not claim this access code.')
      })
  }, [token])

  return (
    <div className="grid min-h-[70vh] place-items-center">
      <Card padded className="max-w-md text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary-soft text-primary">
          {state === 'claiming' && <Spinner size={28} />}
          {state === 'success' && <CheckCircle2 className="h-8 w-8 text-success" />}
          {state === 'error' && <XCircle className="h-8 w-8 text-danger" />}
        </div>
        <h1 className="mt-4 font-display text-lg font-bold text-foreground">
          {state === 'claiming' && 'Claiming access…'}
          {state === 'success' && 'Access claimed'}
          {state === 'error' && 'Could not claim access'}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{state === 'claiming' ? 'One moment.' : message}</p>
        {state !== 'claiming' && (
          <Button className="mt-6" fullWidth leftIcon={<QrCode className="h-4 w-4" />} onClick={() => navigate('/app/doctor/patients')}>
            Go to my patients
          </Button>
        )}
      </Card>
    </div>
  )
}
