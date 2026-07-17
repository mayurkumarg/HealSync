import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CalendarClock,
  Video,
  Phone,
  MessageSquare,
  Building2,
  CheckCircle2,
  XCircle,
  ClipboardCheck,
  Settings2,
  History,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Card,
  CardHeader,
  Badge,
  Button,
  EmptyState,
  Skeleton,
  Tabs,
  TabsList,
  TabsTrigger,
  Switch,
  Field,
  Input,
  ConfirmDialog,
} from '@/components/ui'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/context/AuthContext'
import { doctorApi } from '@/api/doctor'
import { consultationsApi } from '@/api/consultations'
import { ApiError } from '@/api/client'
import { CompleteConsultationDrawer } from './CompleteConsultationDrawer'
import { formatDateTime, currency, titleCase } from '@/lib/format'
import type { Consultation, ConsultationStatus } from '@/types'

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

export default function DoctorConsultationsPage() {
  const toast = useToast()
  const qc = useQueryClient()
  const { user } = useAuth()
  const [scope, setScope] = useState<'today' | 'upcoming' | 'past'>('today')
  const [completing, setCompleting] = useState<Consultation | null>(null)
  const [toCancel, setToCancel] = useState<Consultation | null>(null)

  const profile = useQuery({ queryKey: ['doctor', 'me'], queryFn: doctorApi.me })
  const list = useQuery({ queryKey: ['consultations', 'doctor', scope], queryFn: () => consultationsApi.doctorList(scope) })

  const [settings, setSettings] = useState({ enabled: false, fee: '', avgMinutes: '20' })
  useEffect(() => {
    if (profile.data) {
      setSettings({
        enabled: profile.data.consultation?.enabled ?? false,
        fee: profile.data.consultation?.fee != null ? String(profile.data.consultation.fee) : '',
        avgMinutes: profile.data.consultation?.avgMinutes != null ? String(profile.data.consultation.avgMinutes) : '20',
      })
    }
  }, [profile.data])

  const saveSettings = useMutation({
    mutationFn: () =>
      consultationsApi.updateSettings({
        enabled: settings.enabled,
        fee: settings.fee ? Number(settings.fee) : null,
        avgMinutes: Number(settings.avgMinutes) || 20,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctor', 'me'] })
      toast.success('Consultation settings saved')
    },
    onError: (err) => toast.error('Could not save', err instanceof ApiError ? err.message : 'Please try again.'),
  })

  const confirm = useMutation({
    mutationFn: (id: string) => consultationsApi.confirm(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['consultations'] })
      toast.success('Consultation confirmed')
    },
    onError: () => toast.error('Could not confirm'),
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

  const consultations = list.data ?? []

  return (
    <div>
      <PageHeader
        title="Consultations"
        description="Manage your consultation queue, confirm bookings and record visit notes."
      />

      <Card className="mb-6">
        <CardHeader title="Consultation availability" subtitle={`${user?.name ? `Dr. ${user.name}` : 'Your'} booking settings`} icon={<Settings2 className="h-5 w-5" />} />
        <div className="grid gap-4 px-5 pb-5 sm:grid-cols-[auto_1fr_1fr] sm:items-end sm:px-6 sm:pb-6">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-2/40 p-3.5">
            <Switch checked={settings.enabled} onChange={(v) => setSettings({ ...settings, enabled: v })} />
            <div>
              <p className="text-sm font-medium text-foreground">Open for bookings</p>
              <p className="text-xs text-muted-foreground">Patients can find and book you</p>
            </div>
          </div>
          <Field label="Consultation fee (₹)">
            <Input type="number" min="0" value={settings.fee} onChange={(e) => setSettings({ ...settings, fee: e.target.value })} placeholder="Optional" />
          </Field>
          <Field label="Typical duration (minutes)">
            <Input type="number" min="5" max="120" value={settings.avgMinutes} onChange={(e) => setSettings({ ...settings, avgMinutes: e.target.value })} />
          </Field>
        </div>
        <div className="flex justify-end px-5 pb-5 sm:px-6 sm:pb-6">
          <Button size="sm" loading={saveSettings.isPending} onClick={() => saveSettings.mutate()}>
            Save settings
          </Button>
        </div>
      </Card>

      <Tabs value={scope} onValueChange={(v) => setScope(v as typeof scope)} className="mb-5">
        <TabsList>
          <TabsTrigger value="today" icon={<CalendarClock className="h-4 w-4" />}>Today</TabsTrigger>
          <TabsTrigger value="upcoming" icon={<CalendarClock className="h-4 w-4" />}>Upcoming</TabsTrigger>
          <TabsTrigger value="past" icon={<History className="h-4 w-4" />}>Past</TabsTrigger>
        </TabsList>
      </Tabs>

      {list.isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
        </div>
      ) : consultations.length === 0 ? (
        <EmptyState
          icon={<CalendarClock className="h-7 w-7" />}
          title="Nothing here"
          description={scope === 'today' ? 'No consultations scheduled for today.' : `No ${scope} consultations.`}
        />
      ) : (
        <div className="space-y-3">
          {consultations.map((c) => {
            const patient = typeof c.patientId === 'object' ? c.patientId : null
            const mode = MODE_META[c.mode] ?? MODE_META.video
            return (
              <Card key={c._id} padded>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-foreground">{patient?.name || 'Patient'}</p>
                      <Badge tone={STATUS_TONE[c.status]}>{titleCase(c.status)}</Badge>
                    </div>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5" />{formatDateTime(c.scheduledAt)}</span>
                      <span className="flex items-center gap-1.5">{mode.icon}{mode.label}</span>
                      {c.fee != null && <span>{currency(c.fee)}</span>}
                    </p>
                    {c.reason && <p className="mt-1.5 text-sm text-muted-foreground">“{c.reason}”</p>}
                    {patient?.phone_no && <p className="mt-1 text-xs text-muted-foreground">{patient.phone_no} · {patient.email}</p>}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {c.status === 'requested' && (
                      <Button size="sm" leftIcon={<CheckCircle2 className="h-4 w-4" />} loading={confirm.isPending} onClick={() => confirm.mutate(c._id)}>
                        Confirm
                      </Button>
                    )}
                    {['requested', 'confirmed'].includes(c.status) && (
                      <>
                        <Button size="sm" variant="outline" leftIcon={<ClipboardCheck className="h-4 w-4" />} onClick={() => setCompleting(c)}>
                          Complete
                        </Button>
                        <Button size="sm" variant="outline" leftIcon={<XCircle className="h-4 w-4" />} className="text-danger hover:bg-danger-soft/60" onClick={() => setToCancel(c)}>
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <CompleteConsultationDrawer consultation={completing} open={!!completing} onClose={() => setCompleting(null)} />

      <ConfirmDialog
        open={!!toCancel}
        onClose={() => setToCancel(null)}
        onConfirm={() => toCancel && cancel.mutate(toCancel._id)}
        title="Cancel this consultation?"
        description="The patient will be notified. This cannot be undone."
        confirmLabel="Cancel consultation"
        loading={cancel.isPending}
      />
    </div>
  )
}
