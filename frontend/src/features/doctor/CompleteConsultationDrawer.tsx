import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Drawer, Field, Textarea, Button, Alert } from '@/components/ui'
import { useToast } from '@/context/ToastContext'
import { consultationsApi } from '@/api/consultations'
import { ApiError } from '@/api/client'
import type { Consultation } from '@/types'

export function CompleteConsultationDrawer({
  consultation,
  open,
  onClose,
}: {
  consultation: Consultation | null
  open: boolean
  onClose: () => void
}) {
  const toast = useToast()
  const qc = useQueryClient()
  const [notes, setNotes] = useState('')
  const [prescriptionText, setPrescriptionText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const complete = useMutation({
    mutationFn: () => consultationsApi.complete(consultation!._id, { notes, prescriptionText }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['consultations'] })
      toast.success('Consultation completed')
      setNotes('')
      setPrescriptionText('')
      onClose()
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not complete this consultation.'),
  })

  const patient = consultation && typeof consultation.patientId === 'object' ? consultation.patientId : null

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Complete consultation"
      description={patient?.name}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={complete.isPending}>
            Cancel
          </Button>
          <Button onClick={() => { setError(null); complete.mutate() }} loading={complete.isPending}>
            Mark complete
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert tone="danger">{error}</Alert>}
        <Field label="Consultation notes" hint="Diagnosis, observations, follow-up plan — visible to the patient.">
          <Textarea rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Discussed symptoms, examined patient, ECG normal…" />
        </Field>
        <Field label="Prescription" hint="Optional — medication and dosage instructions.">
          <Textarea rows={4} value={prescriptionText} onChange={(e) => setPrescriptionText(e.target.value)} placeholder="Amlodipine 5mg, once daily for 2 weeks…" />
        </Field>
      </div>
    </Drawer>
  )
}
