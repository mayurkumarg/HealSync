import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal, Field, Input, Select, Button } from '@/components/ui'
import { useToast } from '@/context/ToastContext'
import { vitalsApi } from '@/api/vitals'
import { ApiError } from '@/api/client'

export function AddReadingModal({
  kind,
  open,
  onClose,
}: {
  kind: 'bp' | 'sugar'
  open: boolean
  onClose: () => void
}) {
  const toast = useToast()
  const qc = useQueryClient()
  const [bp, setBp] = useState({ systolic: '', diastolic: '', pulse: '' })
  const [sugar, setSugar] = useState({ level: '', type: 'fasting' })
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async () => {
      const recordedAt = new Date().toISOString()
      if (kind === 'bp') {
        return vitalsApi.addBpReading({
          systolic: Number(bp.systolic),
          diastolic: Number(bp.diastolic),
          pulse: bp.pulse ? Number(bp.pulse) : undefined,
          recordedAt,
        })
      }
      return vitalsApi.addSugarReading({ level: Number(sugar.level), type: sugar.type, recordedAt })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vitals', kind] })
      toast.success('Reading added')
      reset()
      onClose()
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not add reading.'),
  })

  const reset = () => {
    setBp({ systolic: '', diastolic: '', pulse: '' })
    setSugar({ level: '', type: 'fasting' })
    setError(null)
  }

  const submit = () => {
    setError(null)
    if (kind === 'bp' && (!bp.systolic || !bp.diastolic)) return setError('Systolic and diastolic are required.')
    if (kind === 'sugar' && !sugar.level) return setError('Please enter a sugar level.')
    mutation.mutate()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={kind === 'bp' ? 'Add BP reading' : 'Add sugar reading'}
      description="Recorded at the current date and time."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} loading={mutation.isPending}>
            Save reading
          </Button>
        </>
      }
    >
      <div className="space-y-4 pb-2">
        {error && <p className="rounded-lg bg-danger-soft/60 px-3 py-2 text-sm text-danger">{error}</p>}
        {kind === 'bp' ? (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Systolic (mmHg)" required>
              <Input type="number" placeholder="120" value={bp.systolic} onChange={(e) => setBp({ ...bp, systolic: e.target.value })} />
            </Field>
            <Field label="Diastolic (mmHg)" required>
              <Input type="number" placeholder="80" value={bp.diastolic} onChange={(e) => setBp({ ...bp, diastolic: e.target.value })} />
            </Field>
            <Field label="Pulse (bpm)" className="col-span-2">
              <Input type="number" placeholder="Optional" value={bp.pulse} onChange={(e) => setBp({ ...bp, pulse: e.target.value })} />
            </Field>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Level (mg/dL)" required>
              <Input type="number" placeholder="95" value={sugar.level} onChange={(e) => setSugar({ ...sugar, level: e.target.value })} />
            </Field>
            <Field label="Type" required>
              <Select
                value={sugar.type}
                onChange={(e) => setSugar({ ...sugar, type: e.target.value })}
                options={[
                  { label: 'Fasting', value: 'fasting' },
                  { label: 'Post-meal', value: 'post-meal' },
                  { label: 'Random', value: 'random' },
                ]}
              />
            </Field>
          </div>
        )}
      </div>
    </Modal>
  )
}
