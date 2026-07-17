import { useQuery } from '@tanstack/react-query'
import { History, HeartPulse, Droplet, FolderHeart, Stethoscope, ClipboardList } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { ComingSoon } from '@/components/shared/ComingSoon'
import { Card, EmptyState, LoadingState, Alert } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { timelineApi } from '@/api/timeline'
import { formatDateTime } from '@/lib/format'
import type { TimelineEvent, TimelineEventType } from '@/types'

const EVENT_META: Record<TimelineEventType, { icon: React.ReactNode; badge: string }> = {
  bp_reading: { icon: <HeartPulse className="h-4 w-4" />, badge: 'bg-danger-soft text-danger' },
  sugar_reading: { icon: <Droplet className="h-4 w-4" />, badge: 'bg-accent-soft text-accent' },
  document: { icon: <FolderHeart className="h-4 w-4" />, badge: 'bg-primary-soft text-primary' },
  consultation: { icon: <Stethoscope className="h-4 w-4" />, badge: 'bg-success-soft text-success' },
  form_entry: { icon: <ClipboardList className="h-4 w-4" />, badge: 'bg-warning-soft text-warning' },
}

export default function TimelinePage() {
  const { user } = useAuth()
  if (user && user.role !== 'patient') return <ComingSoon />

  const { data, isLoading, isError } = useQuery({ queryKey: ['timeline', 'mine'], queryFn: timelineApi.mine })

  return (
    <div>
      <PageHeader
        title="Health Timeline"
        description="A chronological view of your vitals, documents, consultations and health records."
      />

      {isLoading ? (
        <LoadingState label="Loading your timeline…" />
      ) : isError ? (
        <Alert tone="danger" title="Can't load your timeline">
          Something went wrong fetching your history. Try refreshing the page.
        </Alert>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={<History className="h-7 w-7" />}
          title="Nothing here yet"
          description="Once you log vitals, upload documents, or complete a consultation, your history will show up here."
        />
      ) : (
        <TimelineList events={data} />
      )}
    </div>
  )
}

function TimelineList({ events }: { events: TimelineEvent[] }) {
  return (
    <Card padded>
      <ol className="space-y-0">
        {events.map((e, i) => {
          const meta = EVENT_META[e.type]
          return (
            <li key={`${e.type}-${e.date}-${i}`} className="relative flex gap-4 pb-6 last:pb-0">
              {i < events.length - 1 && (
                <span className="absolute left-4 top-9 h-[calc(100%-2rem)] w-px -translate-x-1/2 bg-border" />
              )}
              <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${meta.badge}`}>{meta.icon}</div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-sm font-semibold text-foreground">{e.title}</p>
                {e.detail && <p className="mt-0.5 text-sm text-muted-foreground">{e.detail}</p>}
                <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(e.date)}</p>
              </div>
            </li>
          )
        })}
      </ol>
    </Card>
  )
}
