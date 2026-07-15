import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Users, Clock, UserPlus, QrCode, ArrowRight, Sparkles, Stethoscope, ShieldCheck } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { Card, CardHeader, Button, Badge, EmptyState, Avatar, Skeleton } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { doctorApi } from '@/api/doctor'
import { countdown } from '@/lib/format'
import { RequestAccessDrawer } from './RequestAccessDrawer'
import { ClaimCodeModal } from './ClaimCodeModal'

export default function DoctorDashboard() {
  const { user } = useAuth()
  const [requestOpen, setRequestOpen] = useState(false)
  const [claimOpen, setClaimOpen] = useState(false)
  const { data, isLoading } = useQuery({ queryKey: ['doctor', 'patients'], queryFn: doctorApi.listPatients })

  const expiringSoon = useMemo(() => {
    return (data ?? []).filter((a) => {
      if (!a.expiresAt) return false
      const ms = new Date(a.expiresAt).getTime() - Date.now()
      return ms > 0 && ms < 24 * 3600 * 1000
    }).length
  }, [data])

  const name = user?.name?.replace(/^dr\.?\s*/i, '') || 'Doctor'

  return (
    <div>
      <PageHeader
        title={`Welcome, Dr. ${name}`}
        description="Your patients and clinical tools at a glance."
        action={
          <div className="flex gap-2.5">
            <Button variant="outline" leftIcon={<QrCode className="h-4 w-4" />} onClick={() => setClaimOpen(true)}>
              Claim code
            </Button>
            <Button leftIcon={<UserPlus className="h-4 w-4" />} onClick={() => setRequestOpen(true)}>
              Request access
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Patients with access"
          value={data?.length ?? 0}
          hint="Active grants"
          icon={<Users className="h-5 w-5" />}
          tone="primary"
        />
        <StatCard
          label="Expiring soon"
          value={expiringSoon}
          hint="Within 24 hours"
          icon={<Clock className="h-5 w-5" />}
          tone="warning"
        />
        <StatCard
          label="AI summaries"
          value="Ready"
          hint="Per-patient insights"
          icon={<Sparkles className="h-5 w-5" />}
          tone="accent"
        />
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Your patients"
          subtitle="Recently granted access"
          icon={<Stethoscope className="h-5 w-5" />}
          action={
            <Link to="/app/doctor/patients">
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                View all
              </Button>
            </Link>
          }
        />
        <div className="px-5 pb-5 sm:px-6 sm:pb-6">
          {isLoading ? (
            <div className="space-y-3">
              {[0, 1].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : (data?.length ?? 0) === 0 ? (
            <EmptyState
              icon={<ShieldCheck className="h-7 w-7" />}
              title="No patient access yet"
              description="Request access from a patient by phone, or claim a code they've shared."
              action={
                <Button leftIcon={<UserPlus className="h-4 w-4" />} onClick={() => setRequestOpen(true)}>
                  Request access
                </Button>
              }
            />
          ) : (
            <ul className="space-y-2.5">
              {data!.slice(0, 5).map((a) => (
                <li key={a._id}>
                  <Link
                    to={`/app/doctor/patients/${a.patientId._id}`}
                    className="flex items-center gap-3 rounded-xl border border-border bg-surface-2/40 p-3 transition-colors hover:bg-surface-2"
                  >
                    <Avatar name={a.patientId?.name || a.patientId?.email} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{a.patientId?.name || 'Patient'}</p>
                      <p className="text-xs text-muted-foreground">{a.patientId?.phone_no}</p>
                    </div>
                    <Badge tone="success">{countdown(a.expiresAt)}</Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      <RequestAccessDrawer open={requestOpen} onClose={() => setRequestOpen(false)} />
      <ClaimCodeModal open={claimOpen} onClose={() => setClaimOpen(false)} />
    </div>
  )
}
