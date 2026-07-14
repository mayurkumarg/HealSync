import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  HeartPulse,
  Droplet,
  BellRing,
  Share2,
  FolderHeart,
  ArrowRight,
  Sparkles,
  Pill,
  Plus,
  CalendarClock,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { ComingSoon } from '@/components/shared/ComingSoon'
import { Card, CardHeader, Badge, Button, EmptyState, Skeleton } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { remindersApi } from '@/api/reminders'
import { vitalsApi } from '@/api/vitals'
import { accessApi } from '@/api/access'
import { documentsApi } from '@/api/documents'
import { friendlyDay, formatTime } from '@/lib/format'
import { reminderTypeMeta, priorityTone } from '@/features/reminders/meta'

export default function DashboardPage() {
  const { user } = useAuth()
  if (user && user.role !== 'patient') return <ComingSoon />

  const upcoming = useQuery({ queryKey: ['reminders', 'upcoming'], queryFn: remindersApi.upcoming })
  const bp = useQuery({ queryKey: ['vitals', 'bp'], queryFn: vitalsApi.getBp })
  const sugar = useQuery({ queryKey: ['vitals', 'sugar'], queryFn: vitalsApi.getSugar })
  const grants = useQuery({ queryKey: ['access', 'list'], queryFn: accessApi.list })
  const docs = useQuery({ queryKey: ['documents'], queryFn: documentsApi.list })

  const latestBp = bp.data?.readings?.at(-1)
  const latestSugar = sugar.data?.readings?.at(-1)
  const activeShares = grants.data?.filter((g) => g.isActive).length ?? 0
  const firstName = user?.name?.split(' ')[0] || 'there'

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
              <QuickAction to="/app/assistant" icon={<Sparkles className="h-5 w-5" />} label="Ask AI" />
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Health wallet"
              subtitle={`${docs.data?.documents.length ?? 0} documents`}
              icon={<FolderHeart className="h-5 w-5" />}
            />
            <div className="px-5 pb-5 sm:px-6 sm:pb-6">
              {docs.isLoading ? (
                <Skeleton className="h-12 w-full rounded-xl" />
              ) : (
                <Link to="/app/documents">
                  <Button variant="outline" fullWidth rightIcon={<ArrowRight className="h-4 w-4" />}>
                    Open wallet
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
