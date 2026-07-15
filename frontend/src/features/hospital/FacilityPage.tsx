import { useQuery } from '@tanstack/react-query'
import { Building2, MapPin, Phone, Mail, BadgeCheck, Star, FileText, Clock, Info } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader, Badge, LoadingState, Alert } from '@/components/ui'
import { hospitalApi } from '@/api/hospital'
import { titleCase } from '@/lib/format'

export default function FacilityPage() {
  const { data, isLoading } = useQuery({ queryKey: ['hospital', 'me'], queryFn: hospitalApi.me })

  if (isLoading) return <LoadingState label="Loading facility details…" />

  const h = data

  return (
    <div>
      <PageHeader title="Facility" description="Your registered facility details on HealSync." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card padded className="lg:col-span-1 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-glow">
            <Building2 className="h-8 w-8" />
          </div>
          <h2 className="mt-4 font-display text-lg font-bold text-foreground">{h?.name}</h2>
          <p className="text-sm capitalize text-muted-foreground">{h?.type}</p>
          <div className="mt-3 flex items-center justify-center gap-2">
            {h?.verified ? (
              <Badge tone="success" icon={<BadgeCheck className="h-3.5 w-3.5" />}>Verified</Badge>
            ) : (
              <Badge tone="warning">Pending verification</Badge>
            )}
            {h?.isOpen && <Badge tone="neutral" dot>Open</Badge>}
          </div>
          {typeof h?.rating === 'number' && (
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-surface-2/60 px-3 py-1 text-sm">
              <Star className="h-4 w-4 fill-warning text-warning" />
              <span className="font-semibold text-foreground">{h.rating.toFixed(1)}</span>
              <span className="text-muted-foreground">({h.totalRatings ?? 0})</span>
            </div>
          )}
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Contact & registration" icon={<Info className="h-5 w-5" />} />
            <div className="grid gap-4 px-5 pb-5 sm:grid-cols-2 sm:px-6 sm:pb-6">
              <Detail icon={<Mail className="h-4 w-4" />} label="Email" value={h?.email} />
              <Detail icon={<Phone className="h-4 w-4" />} label="Contact" value={h?.contactNo} />
              <Detail icon={<MapPin className="h-4 w-4" />} label="Address" value={h?.address} className="sm:col-span-2" />
              <Detail icon={<FileText className="h-4 w-4" />} label="Registration no." value={h?.verification?.registrationNo} />
              <Detail icon={<Clock className="h-4 w-4" />} label="Type" value={h?.type ? titleCase(h.type) : '—'} />
            </div>
          </Card>

          <Alert tone="info" title="Read-only">
            Editing facility details isn't available yet — this will arrive in a future update. Contact
            support to change registration information.
          </Alert>
        </div>
      </div>
    </div>
  )
}

function Detail({
  icon,
  label,
  value,
  className,
}: {
  icon: React.ReactNode
  label: string
  value?: string | null
  className?: string
}) {
  return (
    <div className={className}>
      <p className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="text-sm text-foreground">{value || '—'}</p>
    </div>
  )
}
