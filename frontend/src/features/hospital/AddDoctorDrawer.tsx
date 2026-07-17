import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Drawer, Field, Input, Button, Alert } from '@/components/ui'
import { useToast } from '@/context/ToastContext'
import { hospitalApi } from '@/api/hospital'
import { ApiError } from '@/api/client'

const EMPTY = { name: '', username: '', email: '', phone_no: '', specialization: '', licenseNo: '', password: '' }

export function AddDoctorDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast()
  const qc = useQueryClient()
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState<string | null>(null)

  const set = (k: keyof typeof EMPTY, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const create = useMutation({
    mutationFn: () => hospitalApi.createDoctor(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hospital'] })
      toast.success('Doctor added', `A verification email was sent to ${form.email}.`)
      setForm(EMPTY)
      onClose()
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : 'Could not add doctor.'
      // Backend creates the doctor first, then emails. If email isn't configured it errors but the
      // doctor exists — surface that helpfully and still refresh the list.
      if (/email service|email server|email sending/i.test(msg)) {
        qc.invalidateQueries({ queryKey: ['hospital'] })
        toast.warning('Doctor added', 'Verification email could not be sent (email not configured). You can verify them from the list.')
        setForm(EMPTY)
        onClose()
      } else {
        setError(msg)
      }
    },
  })

  const submit = () => {
    setError(null)
    if (!form.name || !form.username || !form.email || !form.phone_no || !form.password) {
      return setError('Please fill in all required fields.')
    }
    if (form.password.length < 8) return setError('Password must be at least 8 characters.')
    create.mutate()
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Add a doctor"
      description="Create a doctor account under your facility. They'll verify via email before signing in."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={create.isPending}>Cancel</Button>
          <Button onClick={submit} loading={create.isPending}>Create doctor</Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert tone="danger">{error}</Alert>}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Full name" required><Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Dr. Full name" /></Field>
          <Field label="Username" required><Input value={form.username} onChange={(e) => set('username', e.target.value)} placeholder="dr.rahul" /></Field>
        </div>
        <Field label="Email" required><Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="doctor@example.com" /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Phone" required><Input type="tel" value={form.phone_no} onChange={(e) => set('phone_no', e.target.value)} placeholder="10-digit" /></Field>
          <Field label="Specialization"><Input value={form.specialization} onChange={(e) => set('specialization', e.target.value)} placeholder="Cardiology" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="License no."><Input value={form.licenseNo} onChange={(e) => set('licenseNo', e.target.value)} placeholder="MCI-XXXXX" /></Field>
          <Field label="Temp. password" required><Input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="Min 8 characters" /></Field>
        </div>
        <p className="rounded-xl border border-border bg-surface-2/40 p-3 text-xs text-muted-foreground">
          The doctor receives a verification link by email and can change this password after signing in.
        </p>
      </div>
    </Drawer>
  )
}
