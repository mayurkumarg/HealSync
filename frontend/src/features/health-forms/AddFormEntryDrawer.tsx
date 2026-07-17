import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { Drawer, Field, Input, Textarea, Select, Button, Alert } from '@/components/ui'
import { useToast } from '@/context/ToastContext'
import { formEntryApi } from '@/api/formEntry'
import { ApiError } from '@/api/client'
import type { FormEntryCategory } from '@/types'

const CATEGORIES: { label: string; value: FormEntryCategory }[] = [
  { label: 'Allergies', value: 'allergies' },
  { label: 'Chronic conditions', value: 'chronic_conditions' },
  { label: 'Family history', value: 'family_history' },
  { label: 'Past surgeries', value: 'past_surgeries' },
  { label: 'Current medications', value: 'current_medications' },
  { label: 'Lifestyle', value: 'lifestyle' },
  { label: 'Immunizations', value: 'immunizations' },
  { label: 'Other', value: 'other' },
]

type Row = { key: string; value: string }

export function AddFormEntryDrawer({ open, onClose, patientId }: { open: boolean; onClose: () => void; patientId: string }) {
  const toast = useToast()
  const qc = useQueryClient()
  const [category, setCategory] = useState<FormEntryCategory>('allergies')
  const [description, setDescription] = useState('')
  const [rows, setRows] = useState<Row[]>([{ key: '', value: '' }])
  const [error, setError] = useState<string | null>(null)

  const setRow = (i: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))

  const create = useMutation({
    mutationFn: () => {
      const data = Object.fromEntries(rows.filter((r) => r.key.trim()).map((r) => [r.key.trim(), r.value.trim()]))
      return formEntryApi.create({ formType: category, data, patientId, description })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['form-entries'] })
      toast.success('Entry added')
      setCategory('allergies')
      setDescription('')
      setRows([{ key: '', value: '' }])
      onClose()
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not add entry.'),
  })

  const submit = () => {
    setError(null)
    const hasRow = rows.some((r) => r.key.trim())
    if (!hasRow && !description.trim()) {
      return setError('Add at least one field or a description.')
    }
    create.mutate()
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Add health record"
      description="Record allergies, conditions, medications or other health background."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={create.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} loading={create.isPending}>
            Save entry
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert tone="danger">{error}</Alert>}
        <Field label="Category" required>
          <Select options={CATEGORIES} value={category} onChange={(e) => setCategory(e.target.value as FormEntryCategory)} />
        </Field>

        <Field label="Details" hint="Add each fact as a label and value, e.g. Allergy / Penicillin.">
          <div className="space-y-2">
            {rows.map((row, i) => (
              <div key={i} className="flex gap-2">
                <Input placeholder="Label" value={row.key} onChange={(e) => setRow(i, { key: e.target.value })} className="w-2/5" />
                <Input placeholder="Value" value={row.value} onChange={(e) => setRow(i, { value: e.target.value })} className="flex-1" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-danger hover:bg-danger-soft/60"
                  onClick={() => setRows((rs) => rs.filter((_, idx) => idx !== i))}
                  disabled={rows.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setRows((rs) => [...rs, { key: '', value: '' }])}>
              Add field
            </Button>
          </div>
        </Field>

        <Field label="Notes">
          <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Any additional context…" />
        </Field>
      </div>
    </Drawer>
  )
}
