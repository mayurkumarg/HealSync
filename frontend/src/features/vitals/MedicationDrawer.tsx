import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Drawer, Field, Input, Button } from '@/components/ui'
import { useToast } from '@/context/ToastContext'
import { vitalsApi } from '@/api/vitals'
import { ApiError } from '@/api/client'
import type { BpProfile, SugarProfile } from '@/types'

export function MedicationDrawer({
  kind,
  open,
  onClose,
  profile,
}: {
  kind: 'bp' | 'sugar'
  open: boolean
  onClose: () => void
  profile?: BpProfile | SugarProfile | null
}) {
  const toast = useToast()
  const qc = useQueryClient()
  const [form, setForm] = useState({ drugName: '', dosage: '', tabletsPerDay: '', stockAvailable: '' })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setError(null)
      setForm({
        drugName: profile?.drugName ?? '',
        dosage: profile?.dosage ?? '',
        tabletsPerDay: profile?.tabletsPerDay != null ? String(profile.tabletsPerDay) : '',
        stockAvailable: profile?.stockAvailable != null ? String(profile.stockAvailable) : '',
      })
    }
  }, [open, profile])

  const mutation = useMutation({
    mutationFn: async () => {
      const body = {
        drugName: form.drugName.trim() || null,
        dosage: form.dosage.trim() || null,
        tabletsPerDay: form.tabletsPerDay ? Number(form.tabletsPerDay) : null,
        stockAvailable: form.stockAvailable ? Number(form.stockAvailable) : null,
      }
      if (kind === 'bp') await vitalsApi.initBp(body)
      else await vitalsApi.initSugar(body)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vitals', kind] })
      toast.success('Medication saved')
      onClose()
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not save.'),
  })

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`${kind === 'bp' ? 'Blood pressure' : 'Blood sugar'} medication`}
      description="Track your medication and stock for adherence reminders."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate()} loading={mutation.isPending}>
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <p className="rounded-lg bg-danger-soft/60 px-3 py-2 text-sm text-danger">{error}</p>}
        <Field label="Medicine name">
          <Input value={form.drugName} onChange={(e) => setForm({ ...form, drugName: e.target.value })} placeholder="e.g. Amlodipine" />
        </Field>
        <Field label="Dosage">
          <Input value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} placeholder="e.g. 5mg" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Tablets / day">
            <Input type="number" value={form.tabletsPerDay} onChange={(e) => setForm({ ...form, tabletsPerDay: e.target.value })} placeholder="1" />
          </Field>
          <Field label="Stock available">
            <Input type="number" value={form.stockAvailable} onChange={(e) => setForm({ ...form, stockAvailable: e.target.value })} placeholder="30" />
          </Field>
        </div>
        <p className="rounded-xl border border-border bg-surface-2/40 p-3 text-xs text-muted-foreground">
          HealSync automatically decrements your stock as doses are taken and reminds you before you run out.
        </p>
      </div>
    </Drawer>
  )
}
