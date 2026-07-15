import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QrCode } from 'lucide-react'
import { Modal, Field, Input, Button, Alert } from '@/components/ui'
import { useToast } from '@/context/ToastContext'
import { doctorApi } from '@/api/doctor'
import { ApiError } from '@/api/client'

/** Doctor enters the 6-digit code (or token) the patient generated from their Sharing page. */
export function ClaimCodeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast()
  const qc = useQueryClient()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setCode('')
      setError(null)
    }
  }, [open])

  const claim = useMutation({
    mutationFn: () => {
      const value = code.trim()
      // 6-digit numeric = shortCode, otherwise treat as a raw token.
      return /^\d{6}$/.test(value) ? doctorApi.claim({ shortCode: value }) : doctorApi.claim({ token: value })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctor', 'patients'] })
      toast.success('Access claimed', 'The patient’s records are now available to you.')
      onClose()
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not claim this code.'),
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={<QrCode className="h-5 w-5" />}
      title="Claim access code"
      description="Enter the code the patient shared with you (from their QR or Sharing page)."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={claim.isPending}>
            Cancel
          </Button>
          <Button onClick={() => code.trim() && claim.mutate()} loading={claim.isPending} disabled={!code.trim()}>
            Claim access
          </Button>
        </>
      }
    >
      <div className="space-y-4 pb-2">
        {error && <Alert tone="danger">{error}</Alert>}
        <Field label="Access code" required>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="6-digit code or token"
            className="tracking-[0.2em]"
            autoFocus
          />
        </Field>
      </div>
    </Modal>
  )
}
