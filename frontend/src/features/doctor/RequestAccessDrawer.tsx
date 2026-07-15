import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Phone, KeyRound, ShieldCheck, ArrowLeft } from 'lucide-react'
import { Drawer, Field, Input, Textarea, Select, Button, Alert } from '@/components/ui'
import { useToast } from '@/context/ToastContext'
import { doctorApi } from '@/api/doctor'
import { ApiError } from '@/api/client'

const DURATIONS = [
  { label: '6 hours', value: '6hours' },
  { label: '12 hours', value: '12hours' },
  { label: '24 hours', value: '24hours' },
  { label: '3 days', value: '3days' },
  { label: '7 days', value: '7days' },
]

export function RequestAccessDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast()
  const qc = useQueryClient()
  const [step, setStep] = useState<1 | 2>(1)
  const [phone, setPhone] = useState('')
  const [reason, setReason] = useState('')
  const [duration, setDuration] = useState('24hours')
  const [otp, setOtp] = useState('')
  const [requestId, setRequestId] = useState('')
  const [maskedPhone, setMaskedPhone] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setStep(1)
      setPhone('')
      setReason('')
      setDuration('24hours')
      setOtp('')
      setRequestId('')
      setError(null)
    }
  }, [open])

  const request = useMutation({
    mutationFn: () => doctorApi.requestAccess({ patientPhone: phone, reason, expiryDuration: duration }),
    onSuccess: (data) => {
      setRequestId(data.requestId)
      setMaskedPhone(data.patientPhone)
      setStep(2)
      toast.success('OTP sent to patient', 'Ask the patient for the code they received.')
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not send request.'),
  })

  const approve = useMutation({
    mutationFn: () => doctorApi.approveRequest({ requestId, otp }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctor', 'patients'] })
      toast.success('Access granted', 'You can now view this patient’s records.')
      onClose()
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Invalid or expired OTP.'),
  })

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Request patient access"
      description="The patient approves by sharing the one-time code sent to their phone."
      footer={
        step === 1 ? (
          <>
            <Button variant="ghost" onClick={onClose} disabled={request.isPending}>
              Cancel
            </Button>
            <Button onClick={() => phone && request.mutate()} loading={request.isPending} disabled={!phone}>
              Send request
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => setStep(1)} disabled={approve.isPending}>
              Back
            </Button>
            <Button onClick={() => otp && approve.mutate()} loading={approve.isPending} disabled={otp.length < 4}>
              Verify & grant
            </Button>
          </>
        )
      }
    >
      <div className="space-y-4">
        {error && <Alert tone="danger">{error}</Alert>}

        {step === 1 ? (
          <>
            <Field label="Patient's phone number" required>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit number"
                leftIcon={<Phone className="h-4.5 w-4.5" />}
              />
            </Field>
            <Field label="Access duration">
              <Select options={DURATIONS} value={duration} onChange={(e) => setDuration(e.target.value)} />
            </Field>
            <Field label="Reason for access" hint="Shown to the patient and kept in the audit log.">
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Follow-up consultation" rows={3} />
            </Field>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-success" />
              View-only access. Auto-revokes when it expires.
            </p>
          </>
        ) : (
          <>
            <Alert tone="info" title="OTP sent">
              A 6-digit code was sent to <span className="font-semibold">{maskedPhone}</span>. Enter it below to
              complete the grant.
            </Alert>
            <Field label="One-time code" required>
              <Input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6-digit code"
                leftIcon={<KeyRound className="h-4.5 w-4.5" />}
                className="tracking-[0.3em]"
              />
            </Field>
          </>
        )}
      </div>
    </Drawer>
  )
}
