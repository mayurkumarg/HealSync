import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Drawer, Field, Input, Button, Alert } from '@/components/ui'
import { useToast } from '@/context/ToastContext'
import { pharmacyApi } from '@/api/pharmacy'
import { ApiError } from '@/api/client'

const EMPTY = {
  brandName: '',
  genericName: '',
  manufacturer: '',
  dosageForm: '',
  strength: '',
  quantity: '',
  price: '',
  expiryDate: '',
  batchNo: '',
}

export function AddStockDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast()
  const qc = useQueryClient()
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState<string | null>(null)
  const [matched, setMatched] = useState(false)

  const set = (k: keyof typeof EMPTY, v: string) => setForm((f) => ({ ...f, [k]: v }))

  // If this brand already exists in the shared catalog, autofill (and lock) its details so a
  // pharmacy re-stocking a known medicine doesn't have to re-enter generic/manufacturer/strength.
  const lookupBrand = async () => {
    const brand = form.brandName.trim()
    if (!brand) return
    const results = await pharmacyApi.findMedicine({ brand })
    const hit = results.find((m) => m.brandName.toLowerCase() === brand.toLowerCase())
    if (hit) {
      setForm((f) => ({
        ...f,
        genericName: hit.genericName,
        manufacturer: hit.manufacturer || f.manufacturer,
        dosageForm: hit.dosageForm || f.dosageForm,
        strength: hit.strength || f.strength,
      }))
      setMatched(true)
    } else {
      setMatched(false)
    }
  }

  const create = useMutation({
    mutationFn: () =>
      pharmacyApi.addStock({
        brandName: form.brandName,
        genericName: form.genericName,
        manufacturer: form.manufacturer || undefined,
        dosageForm: form.dosageForm || undefined,
        strength: form.strength || undefined,
        quantity: Number(form.quantity),
        price: Number(form.price),
        expiryDate: form.expiryDate,
        batchNo: form.batchNo || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pharmacy'] })
      toast.success('Stock added')
      setForm(EMPTY)
      setMatched(false)
      onClose()
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not add stock.'),
  })

  const submit = () => {
    setError(null)
    if (!form.brandName || !form.genericName || !form.quantity || !form.price || !form.expiryDate) {
      return setError('Please fill in all required fields.')
    }
    if (Number(form.quantity) < 0 || Number(form.price) < 0) {
      return setError('Quantity and price must be positive numbers.')
    }
    create.mutate()
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Add stock"
      description="Add a medicine to your inventory. Existing catalog brands autofill their details."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={create.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} loading={create.isPending}>
            Add stock
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert tone="danger">{error}</Alert>}
        <Field label="Brand name" required hint={matched ? 'Matched an existing catalog entry.' : undefined}>
          <Input
            value={form.brandName}
            onChange={(e) => {
              set('brandName', e.target.value)
              setMatched(false)
            }}
            onBlur={lookupBrand}
            placeholder="Crocin"
          />
        </Field>
        <Field label="Generic name" required>
          <Input value={form.genericName} onChange={(e) => set('genericName', e.target.value)} placeholder="Paracetamol" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Manufacturer">
            <Input value={form.manufacturer} onChange={(e) => set('manufacturer', e.target.value)} placeholder="GSK" />
          </Field>
          <Field label="Strength">
            <Input value={form.strength} onChange={(e) => set('strength', e.target.value)} placeholder="500mg" />
          </Field>
        </div>
        <Field label="Dosage form">
          <Input value={form.dosageForm} onChange={(e) => set('dosageForm', e.target.value)} placeholder="Tablet" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Quantity" required>
            <Input type="number" min="0" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} placeholder="100" />
          </Field>
          <Field label="Price" required>
            <Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="25.00" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Expiry date" required>
            <Input type="date" value={form.expiryDate} onChange={(e) => set('expiryDate', e.target.value)} />
          </Field>
          <Field label="Batch no.">
            <Input value={form.batchNo} onChange={(e) => set('batchNo', e.target.value)} placeholder="B12345" />
          </Field>
        </div>
      </div>
    </Drawer>
  )
}
