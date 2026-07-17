import { useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  HeartPulse,
  Droplet,
  FileText,
  ClipboardList,
  BellRing,
  LayoutDashboard,
  Phone,
  Mail,
  Clock,
  Upload,
  Sparkles,
  Send,
  Bot,
  Eye,
} from 'lucide-react'
import { VitalsTrendChart } from '@/components/shared/VitalsTrendChart'
import { CriticalInfoBanner } from '@/components/shared/CriticalInfoBanner'
import {
  Card,
  CardHeader,
  Button,
  Badge,
  Avatar,
  Tabs,
  TabsList,
  TabsTrigger,
  LoadingState,
  EmptyState,
} from '@/components/ui'
import { useToast } from '@/context/ToastContext'
import { doctorApi } from '@/api/doctor'
import { formatDate, titleCase, friendlyDay } from '@/lib/format'
import { reminderTypeMeta, priorityTone } from '@/features/reminders/meta'
import type { ChatSource } from '@/types'

type Tab = 'overview' | 'vitals' | 'documents' | 'forms' | 'reminders'

export default function PatientRecordsPage() {
  const { patientId = '' } = useParams()
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [tab, setTab] = useState<Tab>('overview')

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['doctor', 'records', patientId],
    queryFn: () => doctorApi.getPatientRecords(patientId),
  })

  const upload = useMutation({
    mutationFn: (file: File) => doctorApi.uploadForPatient(patientId, file),
    onSuccess: () => {
      refetch()
      toast.success('Document uploaded', 'The document was processed and added to the patient’s wallet.')
    },
    onError: () => toast.error('Upload unavailable', 'Document storage/OCR needs configuration in this environment.'),
  })

  if (isLoading) return <LoadingState label="Loading patient records…" />
  if (isError || !data) {
    return (
      <div>
        <BackLink />
        <EmptyState
          icon={<Eye className="h-7 w-7" />}
          title="Can't load these records"
          description="Your access may have expired. Return to your patients and request access again."
          className="mt-6"
        />
      </div>
    )
  }

  const { patient, documents, healthForms, bpData, sugarData, reminders, accessInfo } = data

  return (
    <div>
      <BackLink />

      {/* Patient header */}
      <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={patient.name || patient.email} size="lg" />
          <div className="min-w-0">
            <h1 className="font-display text-xl font-extrabold tracking-tight text-foreground">
              {patient.name || 'Patient'}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {patient.phone_no && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> {patient.phone_no}
                </span>
              )}
              {patient.email && (
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> {patient.email}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <Badge tone="success" dot>
            View access
          </Badge>
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {accessInfo.expiresAt ? `Expires ${formatDate(accessInfo.expiresAt)}` : 'Until revoked'}
          </span>
        </div>
      </div>

      <div className="mt-4">
        <CriticalInfoBanner entries={healthForms} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="lg:col-span-2">
          <div className="mb-5 flex items-center justify-between gap-3">
            <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
              <TabsList className="flex-wrap">
                <TabsTrigger value="overview" icon={<LayoutDashboard className="h-4 w-4" />}>Overview</TabsTrigger>
                <TabsTrigger value="vitals" icon={<HeartPulse className="h-4 w-4" />}>Vitals</TabsTrigger>
                <TabsTrigger value="documents" icon={<FileText className="h-4 w-4" />}>Documents</TabsTrigger>
                <TabsTrigger value="forms" icon={<ClipboardList className="h-4 w-4" />}>Forms</TabsTrigger>
                <TabsTrigger value="reminders" icon={<BellRing className="h-4 w-4" />}>Reminders</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {tab === 'overview' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <MiniStat label="Documents" value={documents.length} icon={<FileText className="h-5 w-5" />} />
              <MiniStat label="Health forms" value={healthForms.length} icon={<ClipboardList className="h-5 w-5" />} />
              <MiniStat label="BP readings" value={bpData?.readings?.length ?? 0} icon={<HeartPulse className="h-5 w-5" />} />
              <MiniStat label="Sugar readings" value={sugarData?.readings?.length ?? 0} icon={<Droplet className="h-5 w-5" />} />
              <Card padded className="sm:col-span-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Upload a document for this patient</p>
                    <p className="text-xs text-muted-foreground">Add a report or prescription to their record.</p>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => {
                    const f = e.target.files?.[0]; if (f) upload.mutate(f); e.target.value = ''
                  }} />
                  <Button leftIcon={<Upload className="h-4 w-4" />} loading={upload.isPending} onClick={() => fileRef.current?.click()}>
                    Upload
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {tab === 'vitals' && (
            <div className="space-y-5">
              <Card>
                <CardHeader title="Blood pressure" icon={<HeartPulse className="h-5 w-5" />} subtitle={medLine(bpData)} />
                <div className="px-3 pb-4 sm:px-5">
                  <VitalsTrendChart kind="bp" readings={bpData?.readings ?? []} />
                </div>
              </Card>
              <Card>
                <CardHeader title="Blood sugar" icon={<Droplet className="h-5 w-5" />} subtitle={medLine(sugarData)} />
                <div className="px-3 pb-4 sm:px-5">
                  <VitalsTrendChart kind="sugar" readings={sugarData?.readings ?? []} />
                </div>
              </Card>
            </div>
          )}

          {tab === 'documents' && (
            documents.length === 0 ? (
              <EmptyState icon={<FileText className="h-7 w-7" />} title="No documents" description="This patient hasn't uploaded any documents yet." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {documents.map((d) => (
                  <Card key={d._id} padded>
                    <div className="flex items-start gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">{d.fileName || titleCase(d.type)}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(d.uploadedAt || '')}</p>
                      </div>
                    </div>
                    <Badge tone="neutral" className="mt-3">{titleCase(d.type)}</Badge>
                    {d.nlp?.summary && <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{d.nlp.summary}</p>}
                  </Card>
                ))}
              </div>
            )
          )}

          {tab === 'forms' && (
            healthForms.length === 0 ? (
              <EmptyState icon={<ClipboardList className="h-7 w-7" />} title="No health forms" description="No questionnaire entries recorded for this patient." />
            ) : (
              <div className="space-y-3">
                {healthForms.map((f) => (
                  <Card key={f._id} padded>
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-foreground">{titleCase(f.category)}</p>
                      <span className="text-xs text-muted-foreground">{formatDate(f.createdAt || '')}</span>
                    </div>
                    {f.data && Object.keys(f.data).length > 0 && (
                      <dl className="mt-2 space-y-1 text-sm">
                        {Object.entries(f.data).map(([k, v]) => (
                          <div key={k} className="flex gap-2">
                            <dt className="font-medium text-foreground">{k}:</dt>
                            <dd className="truncate text-muted-foreground">{v}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                    {f.description && <p className="mt-1.5 text-sm text-muted-foreground">{f.description}</p>}
                    {f.createdBy?.name && <p className="mt-2 text-xs text-muted-foreground">Recorded by {f.createdBy.name}</p>}
                  </Card>
                ))}
              </div>
            )
          )}

          {tab === 'reminders' && (
            reminders.length === 0 ? (
              <EmptyState icon={<BellRing className="h-7 w-7" />} title="No reminders" description="This patient has no reminders set." />
            ) : (
              <div className="space-y-2.5">
                {reminders.map((r) => {
                  const meta = reminderTypeMeta(r.reminderType)
                  return (
                    <Card key={r._id} padded className="flex items-center gap-3">
                      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${meta.badge}`}>{meta.icon}</div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-foreground">{r.title}</p>
                        <p className="text-xs text-muted-foreground">{friendlyDay(r.reminderDateTime)} · {meta.label}</p>
                      </div>
                      <Badge tone={priorityTone(r.priority)}>{r.priority}</Badge>
                    </Card>
                  )
                })}
              </div>
            )
          )}
        </div>

        {/* AI summary panel */}
        <div className="lg:col-span-1">
          <AiSummaryPanel patientId={patientId} patientName={patient.name} />
        </div>
      </div>
    </div>
  )
}

function BackLink() {
  return (
    <Link to="/app/doctor/patients" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
      <ArrowLeft className="h-4 w-4" /> Back to patients
    </Link>
  )
}

function MiniStat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <Card padded className="flex items-center gap-3">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">{icon}</div>
      <div>
        <p className="font-display text-2xl font-extrabold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </Card>
  )
}

function medLine(p?: { drugName?: string | null; dosage?: string | null } | null) {
  if (!p?.drugName) return 'No medication recorded'
  return `${p.drugName}${p.dosage ? ` · ${p.dosage}` : ''}`
}

function AiSummaryPanel({ patientId, patientName }: { patientId: string; patientName?: string }) {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string; sources?: ChatSource[] }[]>([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)

  const ask = async (q: string) => {
    const question = q.trim()
    if (!question || thinking) return
    const history = messages.map(({ role, content }) => ({ role, content }))
    setMessages((m) => [...m, { role: 'user', content: question }])
    setInput('')
    setThinking(true)
    try {
      const { answer, sources } = await doctorApi.chat(question, patientId, history)
      setMessages((m) => [...m, { role: 'assistant', content: answer, sources }])
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Sorry, I could not reach the AI assistant. Please try again.' }])
    } finally {
      setThinking(false)
    }
  }

  return (
    <Card className="flex h-full min-h-[24rem] flex-col overflow-hidden">
      <CardHeader title="AI summary" subtitle={`Ask about ${patientName || 'this patient'}`} icon={<Sparkles className="h-5 w-5" />} />
      <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-2">
        {messages.length === 0 ? (
          <div className="space-y-2">
            {['Summarize this patient', 'Any concerning trends?', 'What medications are they on?'].map((s) => (
              <button
                key={s}
                onClick={() => ask(s)}
                className="w-full rounded-xl border border-border bg-surface-2/40 px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:border-primary/40"
              >
                {s}
              </button>
            ))}
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${m.role === 'user' ? 'bg-surface-2 text-foreground' : 'bg-gradient-to-br from-primary to-accent text-white'}`}>
                {m.role === 'user' ? <span className="text-[10px] font-bold">You</span> : <Bot className="h-4 w-4" />}
              </div>
              <div className={`max-w-[85%] ${m.role === 'user' ? '' : 'space-y-1.5'}`}>
                <div className={`rounded-xl px-3 py-2 text-sm ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'border border-border bg-surface-2/60 text-foreground'}`}>
                  {m.content}
                </div>
                {m.role === 'assistant' && m.sources && m.sources.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {m.sources.map((s, j) => (
                      <span
                        key={j}
                        title={s.date ? formatDate(s.date) : undefined}
                        className="inline-flex max-w-full items-center gap-1 rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] text-muted-foreground"
                      >
                        <FileText className="h-2.5 w-2.5 shrink-0 text-primary" />
                        <span className="truncate">{s.title}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {thinking && (
          <div className="flex gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent text-white"><Bot className="h-4 w-4" /></div>
            <div className="flex items-center gap-1 rounded-xl border border-border bg-surface-2/60 px-3 py-2.5">
              {[0, 1, 2].map((i) => <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60" style={{ animationDelay: `${i * 0.15}s` }} />)}
            </div>
          </div>
        )}
      </div>
      <div className="border-t border-border p-3">
        <form onSubmit={(e) => { e.preventDefault(); ask(input) }} className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this patient…"
            className="h-10 flex-1 rounded-xl border border-input bg-surface px-3.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring/60"
          />
          <Button type="submit" size="icon" disabled={!input.trim() || thinking}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Card>
  )
}
