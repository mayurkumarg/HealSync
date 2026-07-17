import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Stethoscope,
  Search,
  CalendarClock,
  Video,
  Phone,
  MessageSquare,
  Building2,
  History,
  XCircle,
  FileText,
  Sparkles,
  Pill,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Card,
  CardHeader,
  Badge,
  Button,
  SearchBar,
  EmptyState,
  Skeleton,
  Tabs,
  TabsList,
  TabsTrigger,
  ConfirmDialog,
} from '@/components/ui'
import { useToast } from '@/context/ToastContext'
import { consultationsApi } from '@/api/consultations'
import { BookConsultationDrawer } from './BookConsultationDrawer'
import { formatDateTime, currency, titleCase } from '@/lib/format'
import type { Consultation, ConsultationStatus, DoctorListing } from '@/types'

const MODE_META: Record<string, { icon: React.ReactNode; label: string }> = {
  video: { icon: <Video className="h-3.5 w-3.5" />, label: 'Video' },
  audio: { icon: <Phone className="h-3.5 w-3.5" />, label: 'Audio' },
  chat: { icon: <MessageSquare className="h-3.5 w-3.5" />, label: 'Chat' },
  in_person: { icon: <Building2 className="h-3.5 w-3.5" />, label: 'In person' },
}

const STATUS_TONE: Record<ConsultationStatus, 'primary' | 'success' | 'warning' | 'danger' | 'neutral'> = {
  requested: 'warning',
  confirmed: 'primary',
  completed: 'success',
  cancelled: 'danger',
  no_show: 'neutral',
}

export default function ConsultationsPage() {
  const toast = useToast()
  const qc = useQueryClient()
  const [tab, setTab] = useState<'mine' | 'find'>('mine')
  const [search, setSearch] = useState('')
  const [bookingDoctor, setBookingDoctor] = useState<DoctorListing | null>(null)
  const [toCancel, setToCancel] = useState<Consultation | null>(null)

  const mine = useQuery({ queryKey: ['consultations', 'mine'], queryFn: () => consultationsApi.mine('all') })
  const doctors = useQuery({
    queryKey: ['consultations', 'doctors', search],
    queryFn: () => consultationsApi.listDoctors({ search: search || undefined }),
    enabled: tab === 'find',
  })

  const cancel = useMutation({
    mutationFn: (id: string) => consultationsApi.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['consultations'] })
      toast.success('Consultation cancelled')
      setToCancel(null)
    },
    onError: () => {
      toast.error('Could not cancel')
      setToCancel(null)
    },
  })

  const all = mine.data ?? []
  const upcoming = all.filter((c) => ['requested', 'confirmed'].includes(c.status)).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
  const past = all.filter((c) => ['completed', 'cancelled', 'no_show'].includes(c.status)).sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))

  return (
    <div>
      <PageHeader
        title="Consultations"
        description="Book a video, audio or in-person consultation with a doctor and track your visit history."
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'mine' | 'find')} className="mb-6">
        <TabsList>
          <TabsTrigger value="mine" icon={<CalendarClock className="h-4 w-4" />}>My consultations</TabsTrigger>
          <TabsTrigger value="find" icon={<Search className="h-4 w-4" />}>Find a doctor</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'mine' && (
        <div className="space-y-6">
          <Card>
            <CardHeader title="Upcoming" subtitle={`${upcoming.length} scheduled`} icon={<CalendarClock className="h-5 w-5" />} />
            <div className="px-5 pb-5 sm:px-6 sm:pb-6">
              {mine.isLoading ? (
                <Skeleton className="h-24 w-full rounded-xl" />
              ) : upcoming.length === 0 ? (
                <EmptyState
                  icon={<Stethoscope className="h-6 w-6" />}
                  title="No upcoming consultations"
                  description="Find a doctor and book your first consultation."
                  action={<Button size="sm" onClick={() => setTab('find')}>Find a doctor</Button>}
                />
              ) : (
                <div className="space-y-3">
                  {upcoming.map((c) => (
                    <ConsultationRow key={c._id} c={c} onCancel={() => setToCancel(c)} />
                  ))}
                </div>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="History" subtitle={`${past.length} past`} icon={<History className="h-5 w-5" />} />
            <div className="px-5 pb-5 sm:px-6 sm:pb-6">
              {past.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No past consultations yet.</p>
              ) : (
                <div className="space-y-3">
                  {past.map((c) => (
                    <ConsultationRow key={c._id} c={c} />
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {tab === 'find' && (
        <div>
          <div className="mb-5 max-w-md">
            <SearchBar value={search} onChange={(e) => setSearch(e.target.value)} onClear={() => setSearch('')} placeholder="Search by name or specialization" />
          </div>

          {doctors.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-40 w-full rounded-2xl" />)}
            </div>
          ) : (doctors.data ?? []).length === 0 ? (
            <EmptyState
              icon={<Stethoscope className="h-7 w-7" />}
              title="No doctors available"
              description="No doctors are currently open for consultations. Check back soon."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(doctors.data ?? []).map((d) => (
                <Card key={d._id} padded hover>
                  <div className="flex items-start gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                      <Stethoscope className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-foreground">Dr. {d.name}</p>
                      <p className="text-xs text-muted-foreground">{d.specialization || 'General practice'}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {d.verification?.status === 'verified' && <Badge tone="success">Verified</Badge>}
                    {d.hospitalId?.name && <Badge tone="neutral">{d.hospitalId.name}</Badge>}
                    {d.experienceYears ? <Badge tone="neutral">{d.experienceYears} yrs exp</Badge> : null}
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">
                      {d.consultation.fee != null ? currency(d.consultation.fee) : 'Fee on request'}
                    </span>
                    <Button size="sm" onClick={() => setBookingDoctor(d)}>Book</Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <BookConsultationDrawer doctor={bookingDoctor} open={!!bookingDoctor} onClose={() => setBookingDoctor(null)} />

      <ConfirmDialog
        open={!!toCancel}
        onClose={() => setToCancel(null)}
        onConfirm={() => toCancel && cancel.mutate(toCancel._id)}
        title="Cancel this consultation?"
        description="The doctor will be notified. This cannot be undone."
        confirmLabel="Cancel consultation"
        loading={cancel.isPending}
      />
    </div>
  )
}

function ConsultationRow({ c, onCancel }: { c: Consultation; onCancel?: () => void }) {
  const doctor = typeof c.doctorId === 'object' ? c.doctorId : null
  const mode = MODE_META[c.mode] ?? MODE_META.video

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-foreground">Dr. {doctor?.name || 'Doctor'}</p>
          <Badge tone={STATUS_TONE[c.status]}>{titleCase(c.status)}</Badge>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{doctor?.specialization}</p>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5" />{formatDateTime(c.scheduledAt)}</span>
          <span className="flex items-center gap-1.5">{mode.icon}{mode.label}</span>
        </p>
        {c.reason && <p className="mt-1.5 text-sm text-muted-foreground">“{c.reason}”</p>}
        {c.status === 'completed' && (c.notes || c.prescriptionText) && (
          <div className="mt-3 space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
            {c.notes && (
              <p className="flex items-start gap-1.5 text-sm text-foreground">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                {c.notes}
              </p>
            )}
            {c.prescriptionText && (
              <div>
                <p className="flex items-start gap-1.5 text-sm text-foreground">
                  <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  {c.prescriptionText}
                </p>
                <Link
                  to={`/app/pharmacy?q=${encodeURIComponent(c.prescriptionText.split(/[,.\n]/)[0].trim())}`}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                >
                  <Pill className="h-3.5 w-3.5" />
                  Find this medicine nearby
                </Link>
              </div>
            )}
          </div>
        )}
        {c.status === 'cancelled' && c.cancelReason && (
          <p className="mt-1.5 text-xs text-danger">Cancelled by {c.cancelledBy}: {c.cancelReason}</p>
        )}
      </div>
      {onCancel && ['requested', 'confirmed'].includes(c.status) && (
        <Button variant="outline" size="sm" leftIcon={<XCircle className="h-4 w-4" />} className="shrink-0 self-start text-danger hover:bg-danger-soft/60" onClick={onCancel}>
          Cancel
        </Button>
      )}
    </div>
  )
}
