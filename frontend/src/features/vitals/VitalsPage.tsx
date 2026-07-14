import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { HeartPulse, Droplet, Plus, Pill, Trash2, Activity, Boxes } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { ComingSoon } from '@/components/shared/ComingSoon'
import {
  Card,
  CardHeader,
  Button,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  EmptyState,
  LoadingState,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
} from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { vitalsApi } from '@/api/vitals'
import { formatDate, formatTime } from '@/lib/format'
import { AddReadingModal } from './AddReadingModal'
import { MedicationDrawer } from './MedicationDrawer'
import { useToast } from '@/context/ToastContext'

type Kind = 'bp' | 'sugar'

export default function VitalsPage() {
  const { user } = useAuth()
  if (user && user.role !== 'patient') return <ComingSoon />

  const [kind, setKind] = useState<Kind>('bp')
  const [addOpen, setAddOpen] = useState(false)
  const [medOpen, setMedOpen] = useState(false)
  const toast = useToast()
  const qc = useQueryClient()

  const bp = useQuery({ queryKey: ['vitals', 'bp'], queryFn: vitalsApi.getBp })
  const sugar = useQuery({ queryKey: ['vitals', 'sugar'], queryFn: vitalsApi.getSugar })

  const active = kind === 'bp' ? bp : sugar
  const profile = active.data
  const readings = profile?.readings ?? []

  const deleteReading = useMutation({
    mutationFn: (id: string) => (kind === 'bp' ? vitalsApi.deleteBpReading(id) : vitalsApi.deleteSugarReading(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vitals', kind] })
      toast.success('Reading deleted')
    },
  })

  const chartData = readings.map((r) => ({
    date: formatDate(r.recordedAt, 'MMM d'),
    ...(kind === 'bp'
      ? { systolic: (r as any).systolic, diastolic: (r as any).diastolic }
      : { level: (r as any).level }),
  }))

  const stockLow = (profile?.stockAvailable ?? 99) <= 7

  return (
    <div>
      <PageHeader
        title="Vitals tracking"
        description="Log your readings, watch trends, and keep medication on schedule."
        action={
          <div className="flex gap-2.5">
            <Button variant="outline" leftIcon={<Pill className="h-4 w-4" />} onClick={() => setMedOpen(true)}>
              Medication
            </Button>
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setAddOpen(true)} disabled={!profile}>
              Add reading
            </Button>
          </div>
        }
      />

      <Tabs value={kind} onValueChange={(v) => setKind(v as Kind)} className="mb-6">
        <TabsList>
          <TabsTrigger value="bp" icon={<HeartPulse className="h-4 w-4" />}>
            Blood Pressure
          </TabsTrigger>
          <TabsTrigger value="sugar" icon={<Droplet className="h-4 w-4" />}>
            Blood Sugar
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {active.isLoading ? (
        <LoadingState label="Loading your readings…" />
      ) : !profile ? (
        <EmptyState
          icon={kind === 'bp' ? <HeartPulse className="h-7 w-7" /> : <Droplet className="h-7 w-7" />}
          title={`Set up ${kind === 'bp' ? 'blood pressure' : 'blood sugar'} tracking`}
          description="Add your medication details to start logging readings and tracking adherence."
          action={
            <Button leftIcon={<Pill className="h-4 w-4" />} onClick={() => setMedOpen(true)}>
              Set up tracking
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Chart + readings */}
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader
                title="Trend"
                subtitle={`${readings.length} reading${readings.length === 1 ? '' : 's'} logged`}
                icon={<Activity className="h-5 w-5" />}
              />
              <div className="h-64 px-2 pb-4 sm:px-4">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'rgb(var(--muted-fg))' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: 'rgb(var(--muted-fg))' }} axisLine={false} tickLine={false} width={40} />
                      <RTooltip
                        contentStyle={{
                          background: 'rgb(var(--surface))',
                          border: '1px solid rgb(var(--border))',
                          borderRadius: 12,
                          fontSize: 13,
                          color: 'rgb(var(--fg))',
                        }}
                      />
                      {kind === 'bp' ? (
                        <>
                          <Line type="monotone" dataKey="systolic" stroke="rgb(var(--danger))" strokeWidth={2.5} dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="diastolic" stroke="rgb(var(--accent))" strokeWidth={2.5} dot={{ r: 3 }} />
                        </>
                      ) : (
                        <Line type="monotone" dataKey="level" stroke="rgb(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="grid h-full place-items-center text-sm text-muted-foreground">
                    Add your first reading to see the trend.
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <CardHeader title="Recent readings" subtitle="Your latest measurements" />
              <div className="px-5 pb-5 sm:px-6 sm:pb-6">
                {readings.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No readings yet.</p>
                ) : (
                  <Table>
                    <THead>
                      <TR>
                        <TH>Date</TH>
                        {kind === 'bp' ? (
                          <>
                            <TH>Reading</TH>
                            <TH>Pulse</TH>
                          </>
                        ) : (
                          <>
                            <TH>Level</TH>
                            <TH>Type</TH>
                          </>
                        )}
                        <TH>Status</TH>
                        <TH className="text-right">Action</TH>
                      </TR>
                    </THead>
                    <TBody>
                      {[...readings].reverse().slice(0, 8).map((r: any) => (
                        <TR key={r._id}>
                          <TD>
                            <div className="text-sm font-medium">{formatDate(r.recordedAt)}</div>
                            <div className="text-xs text-muted-foreground">{formatTime(r.recordedAt)}</div>
                          </TD>
                          {kind === 'bp' ? (
                            <>
                              <TD className="font-semibold">
                                {r.systolic}/{r.diastolic}
                              </TD>
                              <TD>{r.pulse ?? '—'}</TD>
                            </>
                          ) : (
                            <>
                              <TD className="font-semibold">{r.level} mg/dL</TD>
                              <TD className="capitalize">{r.type}</TD>
                            </>
                          )}
                          <TD>
                            <Badge tone={statusToTone(r.status ?? r.category)}>{r.category ?? r.status}</Badge>
                          </TD>
                          <TD className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteReading.mutate(r._id)}
                              className="text-danger hover:bg-danger-soft/60"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TD>
                        </TR>
                      ))}
                    </TBody>
                  </Table>
                )}
              </div>
            </Card>
          </div>

          {/* Medication panel */}
          <div className="space-y-6">
            <Card padded>
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary">
                  <Pill className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-foreground">Medication</h3>
                  <p className="text-xs text-muted-foreground">Adherence tracking</p>
                </div>
              </div>
              <dl className="mt-5 space-y-3 text-sm">
                <Row label="Drug" value={profile.drugName || '—'} />
                <Row label="Dosage" value={profile.dosage || '—'} />
                <Row label="Tablets / day" value={profile.tabletsPerDay ?? '—'} />
                <Row label="Taken today" value={profile.todaysIntake ?? 0} />
              </dl>
              <div className="mt-5 flex items-center justify-between rounded-xl border border-border bg-surface-2/40 p-3">
                <div className="flex items-center gap-2 text-sm">
                  <Boxes className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Stock left</span>
                </div>
                <Badge tone={stockLow ? 'danger' : 'success'}>{profile.stockAvailable ?? 0} tablets</Badge>
              </div>
              <Button variant="outline" fullWidth className="mt-4" onClick={() => setMedOpen(true)}>
                Update medication
              </Button>
            </Card>

            {profile.recentSuggestion && (
              <Card padded className="bg-gradient-to-br from-primary/5 to-accent/5">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Latest insight</p>
                <p className="mt-2 text-sm text-foreground">{profile.recentSuggestion}</p>
              </Card>
            )}
          </div>
        </div>
      )}

      <AddReadingModal kind={kind} open={addOpen} onClose={() => setAddOpen(false)} />
      <MedicationDrawer kind={kind} open={medOpen} onClose={() => setMedOpen(false)} profile={profile} />
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  )
}

function statusToTone(s?: string): 'neutral' | 'success' | 'warning' | 'danger' {
  if (!s) return 'neutral'
  const v = s.toLowerCase()
  if (v.includes('normal')) return 'success'
  if (v.includes('elevated') || v.includes('pre') || v.includes('stage 1')) return 'warning'
  if (v.includes('crisis') || v.includes('stage 2') || v.includes('high') || v.includes('diabetic') || v.includes('low'))
    return 'danger'
  return 'neutral'
}
