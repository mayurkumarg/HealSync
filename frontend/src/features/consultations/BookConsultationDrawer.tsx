import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Video, Phone, MessageSquare, Building2, Clock, ShieldCheck } from 'lucide-react'
import { Drawer, Field, Textarea, Button, Alert, Badge } from '@/components/ui'
import { useToast } from '@/context/ToastContext'
import { consultationsApi } from '@/api/consultations'
import { ApiError } from '@/api/client'
import { cn } from '@/lib/cn'
import { currency } from '@/lib/format'
import type { ConsultationMode, DoctorListing } from '@/types'

const MODES: { value: ConsultationMode; label: string; icon: React.ReactNode }[] = [
  { value: 'video', label: 'Video', icon: <Video className="h-4 w-4" /> },
  { value: 'audio', label: 'Audio', icon: <Phone className="h-4 w-4" /> },
  { value: 'chat', label: 'Chat', icon: <MessageSquare className="h-4 w-4" /> },
  { value: 'in_person', label: 'In person', icon: <Building2 className="h-4 w-4" /> },
]

function nextDays(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return d
  })
}

export function BookConsultationDrawer({ doctor, open, onClose }: { doctor: DoctorListing | null; open: boolean; onClose: () => void }) {
  const toast = useToast()
  const qc = useQueryClient()
  const days = useMemo(() => nextDays(14), [])
  const [selectedDate, setSelectedDate] = useState(days[0])
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [mode, setMode] = useState<ConsultationMode>('video')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setSelectedDate(days[0])
      setSelectedSlot(null)
      setMode('video')
      setReason('')
      setError(null)
    }
  }, [open, days])

  const dateKey = selectedDate.toISOString().slice(0, 10)
  const slots = useQuery({
    queryKey: ['consultation-slots', doctor?._id, dateKey],
    queryFn: () => consultationsApi.getSlots(doctor!._id, dateKey),
    enabled: open && !!doctor,
  })

  const book = useMutation({
    mutationFn: () => consultationsApi.book({ doctorId: doctor!._id, scheduledAt: selectedSlot!, reason, mode }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['consultations'] })
      toast.success('Consultation requested', `Dr. ${doctor?.name} will confirm shortly.`)
      onClose()
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not book this slot.'),
  })

  const submit = () => {
    setError(null)
    if (!selectedSlot) return setError('Please pick an available time slot.')
    book.mutate()
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={doctor ? `Book with Dr. ${doctor.name}` : 'Book consultation'}
      description={doctor?.specialization || undefined}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={book.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} loading={book.isPending} disabled={!selectedSlot}>
            Request consultation
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {error && <Alert tone="danger">{error}</Alert>}

        {doctor?.consultation.fee != null && (
          <div className="flex items-center justify-between rounded-xl border border-border bg-surface-2/40 p-3.5 text-sm">
            <span className="text-muted-foreground">Consultation fee</span>
            <span className="font-semibold text-foreground">{currency(doctor.consultation.fee)}</span>
          </div>
        )}

        <Field label="Choose a date">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {days.map((d) => {
              const active = d.toDateString() === selectedDate.toDateString()
              return (
                <button
                  key={d.toISOString()}
                  onClick={() => {
                    setSelectedDate(d)
                    setSelectedSlot(null)
                  }}
                  className={cn(
                    'flex shrink-0 flex-col items-center rounded-xl border px-3 py-2 text-center transition-colors',
                    active ? 'border-primary bg-primary-soft text-primary' : 'border-border text-muted-foreground hover:border-primary/40',
                  )}
                >
                  <span className="text-[10px] font-medium uppercase tracking-wide">{d.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                  <span className="text-base font-bold">{d.getDate()}</span>
                </button>
              )
            })}
          </div>
        </Field>

        <Field label="Available times" hint={slots.data?.length === 0 && !slots.isLoading ? 'No open slots this day — try another date.' : undefined}>
          {slots.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading slots…</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {(slots.data ?? []).map((iso) => {
                const active = selectedSlot === iso
                return (
                  <button
                    key={iso}
                    onClick={() => setSelectedSlot(iso)}
                    className={cn(
                      'flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-sm font-medium transition-colors',
                      active ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-foreground hover:border-primary/40',
                    )}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                  </button>
                )
              })}
            </div>
          )}
        </Field>

        <Field label="Consultation mode">
          <div className="grid grid-cols-4 gap-2">
            {MODES.map((m) => (
              <button
                key={m.value}
                onClick={() => setMode(m.value)}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-xs font-medium transition-colors',
                  mode === m.value ? 'border-primary bg-primary-soft text-primary' : 'border-border text-muted-foreground hover:border-primary/40',
                )}
              >
                {m.icon}
                {m.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Reason for visit" hint="Helps the doctor prepare for your consultation.">
          <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Briefly describe your symptoms or concern…" />
        </Field>

        {doctor?.verification?.status === 'verified' && (
          <Badge tone="success">Hospital-verified doctor</Badge>
        )}

        <div className="flex items-start gap-2.5 rounded-xl border border-border bg-surface-2/40 p-3.5 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>
            Booking gives Dr. {doctor?.name} view access to your health records for 7 days around this
            appointment, so they can prepare and follow up. You can see and revoke this anytime from
            Access & Sharing.
          </span>
        </div>
      </div>
    </Drawer>
  )
}
