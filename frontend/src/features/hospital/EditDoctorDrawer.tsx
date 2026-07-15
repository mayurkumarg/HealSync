import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Drawer, Field, Input, Button, Alert } from '@/components/ui'
import { useToast } from '@/context/ToastContext'
import { hospitalApi } from '@/api/hospital'
import { ApiError } from '@/api/client'
import type { Doctor } from '@/types'

export function EditDoctorDrawer({ doctor, open, onClose }: { doctor: Doctor | null; open: boolean; onClose: () => void }) {
  const toast = useToast()
  const qc = useQueryClient()
  const [form, setForm] = useState({ name: '', phone_no: '', specialization: '', licenseNo: '', experienceYears: '' })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && doctor) {
      setError(null)
      setForm({
        name: doctor.name ?? '',
        phone_no: doctor.phone_no ?? '',
        specialization: doctor.specialization ?? '',
        licenseNo: doctor.licenseNo ?? '',
        experienceYears: doctor.experienceYears != null ? String(doctor.experienceYears) : '',
      })
    }
  }, [open, doctor])

  const update = useMutation({
    mutationFn: () =>
      hospitalApi.updateDoctor(doctor!._id, {
        name: form.name,
        phone_no: form.phone_no,
        specialization: form.specialization,
        licenseNo: form.licenseNo || undefined,
        experienceYears: form.experienceYears ? Number(form.experienceYears) : undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hospital'] })
      toast.success('Doctor updated')
      onClose()
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not update doctor.'),
  })

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Edit doctor"
      description={doctor?.email}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={update.isPending}>Cancel</Button>
          <Button onClick={() => update.mutate()} loading={update.isPending}>Save changes</Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert tone="danger">{error}</Alert>}
        <Field label="Full name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Phone"><Input value={form.phone_no} onChange={(e) => setForm({ ...form, phone_no: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Specialization"><Input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} /></Field>
          <Field label="Experience (yrs)"><Input type="number" value={form.experienceYears} onChange={(e) => setForm({ ...form, experienceYears: e.target.value })} /></Field>
        </div>
        <Field label="License no."><Input value={form.licenseNo} onChange={(e) => setForm({ ...form, licenseNo: e.target.value })} /></Field>
      </div>
    </Drawer>
  )
}
