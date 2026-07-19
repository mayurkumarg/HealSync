import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  HeartPulse,
  Droplet,
  BellRing,
  Share2,
  FolderHeart,
  ArrowRight,
  Pill,
  Plus,
  CalendarClock,
  Stethoscope,
  Rocket,
  CheckCircle2,
  Circle,
  X,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { ComingSoon } from '@/components/shared/ComingSoon'
import { CriticalInfoBanner } from '@/components/shared/CriticalInfoBanner'
import { Card, CardHeader, Badge, Button, EmptyState, Skeleton, Alert } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { remindersApi } from '@/api/reminders'
import { vitalsApi } from '@/api/vitals'
import { accessApi } from '@/api/access'
import { documentsApi } from '@/api/documents'
import { consultationsApi } from '@/api/consultations'
import { formEntryApi } from '@/api/formEntry'
import { friendlyDay, formatTime, formatDateTime } from '@/lib/format'
import { reminderTypeMeta, priorityTone } from '@/features/reminders/meta'

export default function DashboardPage() {
  const { user } = useAuth()
  if (user && user.role !== 'patient') return <ComingSoon />

  const upcoming = useQuery({ queryKey: ['reminders', 'upcoming'], queryFn: remindersApi.upcoming })
  const bp = useQuery({ queryKey: ['vitals', 'bp'], queryFn: vitalsApi.getBp })
  const sugar = useQuery({ queryKey: ['vitals', 'sugar'], queryFn: vitalsApi.getSugar })
  const grants = useQuery({ queryKey: ['access', 'list'], queryFn: accessApi.list })
  const docs = useQuery({ queryKey: ['documents'], queryFn: documentsApi.list })
  const consultations = useQuery({ queryKey: ['consultations', 'mine', 'upcoming'], queryFn: () => consultationsApi.mine('upcoming') })
  const nextConsultation = consultations.data?.[0]
  const formEntries = useQuery({ queryKey: ['form-entries', user?.id], queryFn: () => formEntryApi.list(user!.id), enabled: !!user })

  const latestBp = bp.data?.readings?.at(-1)
  const latestSugar = sugar.data?.readings?.at(-1)
  const activeShares = grants.data?.filter((g) => g.isActive).length ?? 0
  const firstName = user?.name?.split(' ')[0] || 'there'
  const anyError = [upcoming, bp, sugar, grants, docs, consultations].some((q) => q.isError)

  const onboardingKey = `healsync_onboarding_dismissed_${user?.id}`
  const [onboardingDismissed, setOnboardingDismissed] = useState(() => localStorage.getItem(onboardingKey) === '1')
  const stillLoading = [upcoming, bp, sugar, grants, docs].some((q) => q.isLoading)
  const checklist = [
    { label: 'Log your first vital reading', done: !!latestBp || !!latestSugar, to: '/app/vitals' },
    { label: 'Set a reminder', done: (upcoming.data?.length ?? 0) > 0, to: '/app/reminders' },
    { label: 'Upload a health document', done: (docs.data?.length ?? 0) > 0, to: '/app/records' },
    { label: 'Share access with a doctor', done: activeShares > 0, to: '/app/sharing' },
  ]
  const showOnboarding = !onboardingDismissed && !stillLoading && checklist.every((c) => !c.done)
  const dismissOnboarding = () => {
    localStorage.setItem(onboardingKey, '1')
    setOnboardingDismissed(true)
  }

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Here's a snapshot of your health today."
        action={
          <Link to="/app/reminders">
            <Button leftIcon={<Plus className="h-4 w-4" />}>Add reminder</Button>
          </Link>
        }
      />

      {anyError && (
        <Alert tone="danger" title="Some data couldn't load" className="mb-6">
          Part of your dashboard failed to load. Try refreshing the page.
        </Alert>
      )}

      {showOnboarding && (
        <Card padded className="mb-6 bg-gradient-to-br from-primary/5 to-accent/5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                <Rocket className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-foreground">Get started with HealSync</h3>
                <p className="text-xs text-muted-foreground">A few quick steps to set up your health profile</p>
              </div>
            </div>
            <button
              onClick={dismissOnboarding}
              aria-label="Dismiss"
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {checklist.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="flex items-center gap-2.5 rounded-xl border border-border bg-surface-2/40 p-3 text-sm transition-colors hover:border-primary/40"
              >
                {item.done ? (
                  <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-success" />
                ) : (
                  <Circle className="h-4.5 w-4.5 shrink-0 text-muted-foreground" />
                )}
                <span className={item.done ? 'text-muted-foreground line-through' : 'text-foreground'}>{item.label}</span>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {formEntries.data && formEntries.data.length > 0 && (
        <div className="mb-6">
          <CriticalInfoBanner entries={formEntries.data} />
        </div>
      )}

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Blood pressure"
          value={latestBp ? `${latestBp.systolic}/${latestBp.diastolic}` : '—'}
          hint={latestBp ? latestBp.category : 'No readings yet'}
          icon={<HeartPulse className="h-5 w-5" />}
          tone="danger"
        />
        <StatCard
          label="Blood sugar"
          value={latestSugar ? `${latestSugar.level}` : '—'}
          hint={latestSugar ? `mg/dL · ${latestSugar.type}` : 'No readings yet'}
          icon={<Droplet className="h-5 w-5" />}
          tone="accent"
        />
        <StatCard
          label="Upcoming reminders"
          value={upcoming.data?.length ?? 0}
          hint="Next 7 days"
          icon={<BellRing className="h-5 w-5" />}
          tone="warning"
        />
        <StatCard
          label="Active shares"
          value={activeShares}
          hint="Doctors with access"
          icon={<Share2 className="h-5 w-5" />}
          tone="success"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Upcoming reminders */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Upcoming reminders"
            subtitle="Stay on top of your care schedule"
            icon={<CalendarClock className="h-5 w-5" />}
            action={
              <Link to="/app/reminders">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  View all
                </Button>
              </Link>
            }
          />
          <div className="px-5 pb-5 sm:px-6 sm:pb-6">
            {upcoming.isLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : upcoming.data && upcoming.data.length > 0 ? (
              <ul className="space-y-2.5">
                {upcoming.data.slice(0, 4).map((r) => {
                  const meta = reminderTypeMeta(r.reminderType)
                  return (
                    <li
                      key={r._id}
                      className="flex items-center gap-3 rounded-xl border border-border bg-surface-2/40 p-3 transition-colors hover:bg-surface-2"
                    >
                      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${meta.badge}`}>
                        {meta.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{r.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {friendlyDay(r.reminderDateTime)} · {formatTime(r.reminderDateTime)}
                        </p>
                      </div>
                      <Badge tone={priorityTone(r.priority)}>{r.priority}</Badge>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <EmptyState
                icon={<BellRing className="h-7 w-7" />}
                title="No upcoming reminders"
                description="Create a reminder for medications, appointments or lab tests."
                action={
                  <Link to="/app/reminders">
                    <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>
                      New reminder
                    </Button>
                  </Link>
                }
              />
            )}
          </div>
        </Card>

        {/* Quick actions + wallet */}
        <div className="space-y-6">
          <Card padded>
            <h3 className="font-display text-base font-bold text-foreground">Quick actions</h3>
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <QuickAction to="/app/sharing" icon={<Share2 className="h-5 w-5" />} label="Share records" />
              <QuickAction to="/app/pharmacy" icon={<Pill className="h-5 w-5" />} label="Find medicine" />
              <QuickAction to="/app/vitals" icon={<HeartPulse className="h-5 w-5" />} label="Log vitals" />
              <QuickAction to="/app/consultations" icon={<Stethoscope className="h-5 w-5" />} label="Consult a doctor" />
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Next consultation"
              subtitle={nextConsultation ? undefined : 'Nothing scheduled'}
              icon={<Stethoscope className="h-5 w-5" />}
            />
            <div className="px-5 pb-5 sm:px-6 sm:pb-6">
              {consultations.isLoading ? (
                <Skeleton className="h-12 w-full rounded-xl" />
              ) : nextConsultation ? (
                <div className="rounded-xl border border-border bg-surface-2/40 p-3.5">
                  <p className="text-sm font-semibold text-foreground">
                    Dr. {typeof nextConsultation.doctorId === 'object' ? nextConsultation.doctorId.name : 'Doctor'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(nextConsultation.scheduledAt)}</p>
                  <Badge tone={nextConsultation.status === 'confirmed' ? 'primary' : 'warning'} className="mt-2">
                    {nextConsultation.status === 'confirmed' ? 'Confirmed' : 'Awaiting confirmation'}
                  </Badge>
                </div>
              ) : (
                <Link to="/app/consultations">
                  <Button variant="outline" fullWidth rightIcon={<ArrowRight className="h-4 w-4" />}>
                    Book a consultation
                  </Button>
                </Link>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Health records"
              subtitle={`${docs.data?.length ?? 0} documents`}
              icon={<FolderHeart className="h-5 w-5" />}
            />
            <div className="px-5 pb-5 sm:px-6 sm:pb-6">
              {docs.isLoading ? (
                <Skeleton className="h-12 w-full rounded-xl" />
              ) : (
                <Link to="/app/records">
                  <Button variant="outline" fullWidth rightIcon={<ArrowRight className="h-4 w-4" />}>
                    Open records
                  </Button>
                </Link>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function QuickAction({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-surface-2/40 p-4 text-center transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft"
    >
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary-soft text-primary transition-transform group-hover:scale-110">
        {icon}
      </span>
      <span className="text-xs font-medium text-foreground">{label}</span>
    </Link>
  )
}
