import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Stethoscope,
  BadgeCheck,
  Clock,
  UserPlus,
  ArrowRight,
  Building2,
  Activity,
  ShieldCheck,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { Card, CardHeader, Button, Progress, Skeleton, EmptyState } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { hospitalApi } from '@/api/hospital'
import { AddDoctorDrawer } from './AddDoctorDrawer'

export default function HospitalDashboard() {
  const { user } = useAuth()
  const [addOpen, setAddOpen] = useState(false)

  const stats = useQuery({ queryKey: ['hospital', 'stats'], queryFn: hospitalApi.doctorStats })
  const profile = useQuery({ queryKey: ['hospital', 'me'], queryFn: hospitalApi.me })

  const s = stats.data
  const total = s?.totalDoctors ?? 0
  const topSpecs = (s?.specializations ?? []).filter((x) => x._id).slice(0, 5)
  const maxSpec = Math.max(1, ...topSpecs.map((x) => x.count))

  return (
    <div>
      <PageHeader
        title={user?.name || 'Hospital'}
        description="Your facility overview and clinical team at a glance."
        action={<Button leftIcon={<UserPlus className="h-4 w-4" />} onClick={() => setAddOpen(true)}>Add doctor</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total doctors" value={total} icon={<Stethoscope className="h-5 w-5" />} tone="primary" hint="On your team" />
        <StatCard label="Verified" value={s?.verifiedDoctors ?? 0} icon={<BadgeCheck className="h-5 w-5" />} tone="success" hint="Approved" />
        <StatCard label="Pending" value={s?.pendingDoctors ?? 0} icon={<Clock className="h-5 w-5" />} tone="warning" hint="Awaiting review" />
        <StatCard label="Rejected" value={s?.rejectedDoctors ?? 0} icon={<ShieldCheck className="h-5 w-5" />} tone="danger" hint="Not approved" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Specializations */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Specializations"
            subtitle="Doctor distribution across your team"
            icon={<Activity className="h-5 w-5" />}
            action={
              <Link to="/app/hospital/doctors">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>Manage</Button>
              </Link>
            }
          />
          <div className="px-5 pb-5 sm:px-6 sm:pb-6">
            {stats.isLoading ? (
              <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-8 w-full rounded-lg" />)}</div>
            ) : topSpecs.length === 0 ? (
              <EmptyState
                icon={<Stethoscope className="h-7 w-7" />}
                title="No doctors yet"
                description="Add your first doctor to start building your clinical team."
                action={<Button size="sm" leftIcon={<UserPlus className="h-4 w-4" />} onClick={() => setAddOpen(true)}>Add doctor</Button>}
              />
            ) : (
              <ul className="space-y-4">
                {topSpecs.map((spec) => (
                  <li key={spec._id}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{spec._id}</span>
                      <span className="text-muted-foreground">{spec.count}</span>
                    </div>
                    <Progress value={spec.count} max={maxSpec} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        {/* Facility card */}
        <Card padded>
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate font-display text-base font-bold text-foreground">{profile.data?.name || 'Facility'}</h3>
              <p className="text-xs capitalize text-muted-foreground">{profile.data?.type || '—'}</p>
            </div>
          </div>
          <dl className="mt-5 space-y-3 text-sm">
            <Row label="Contact" value={profile.data?.contactNo || '—'} />
            <Row label="Reg. no" value={profile.data?.verification?.registrationNo || '—'} />
            <Row label="Status" value={profile.data?.verified ? 'Verified' : 'Pending'} />
          </dl>
          <Link to="/app/hospital/facility" className="mt-5 block">
            <Button variant="outline" fullWidth rightIcon={<ArrowRight className="h-4 w-4" />}>Facility details</Button>
          </Link>
        </Card>
      </div>

      <AddDoctorDrawer open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium text-foreground">{value}</dd>
    </div>
  )
}
