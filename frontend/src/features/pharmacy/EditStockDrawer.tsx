import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Drawer, Field, Input, Button, Alert } from '@/components/ui'
import { useToast } from '@/context/ToastContext'
import { pharmacyApi } from '@/api/pharmacy'
import { ApiError } from '@/api/client'
import type { Medicine, PharmacyStock } from '@/types'

function medicineName(m: string | Medicine | undefined) {
  if (!m) return ''
  return typeof m === 'string' ? m : m.brandName
}

export function EditStockDrawer({
  stock,
  open,
  onClose,
}: {
  stock: PharmacyStock | null
  open: boolean
  onClose: () => void
}) {
  const toast = useToast()
  const qc = useQueryClient()
  const [form, setForm] = useState({ quantity: '', price: '', expiryDate: '', batchNo: '' })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && stock) {
      setError(null)
      setForm({
        quantity: String(stock.quantity),
        price: String(stock.price),
        expiryDate: stock.expiryDate ? stock.expiryDate.slice(0, 10) : '',
        batchNo: stock.batchNo ?? '',
      })
    }
  }, [open, stock])

  const update = useMutation({
    mutationFn: () =>
      pharmacyApi.updateStock(stock!._id, {
        quantity: Number(form.quantity),
        price: Number(form.price),
        expiryDate: form.expiryDate,
        batchNo: form.batchNo || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pharmacy'] })
      toast.success('Stock updated')
      onClose()
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not update stock.'),
  })

  const submit = () => {
    setError(null)
    if (!form.quantity || !form.price || !form.expiryDate) {
      return setError('Please fill in all required fields.')
    }
    if (Number(form.quantity) < 0 || Number(form.price) < 0) {
      return setError('Quantity and price must be positive numbers.')
    }
    update.mutate()
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Edit stock"
      description={medicineName(stock?.medicineId)}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={update.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} loading={update.isPending}>
            Save changes
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert tone="danger">{error}</Alert>}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Quantity" required>
            <Input type="number" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          </Field>
          <Field label="Price" required>
            <Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Expiry date" required>
            <Input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
          </Field>
          <Field label="Batch no.">
            <Input value={form.batchNo} onChange={(e) => setForm({ ...form, batchNo: e.target.value })} />
          </Field>
        </div>
      </div>
    </Drawer>
  )
}
