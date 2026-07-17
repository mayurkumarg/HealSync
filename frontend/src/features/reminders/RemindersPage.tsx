import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Check, X, Pencil, Trash2, BellRing, MapPin, Clock } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { ComingSoon } from '@/components/shared/ComingSoon'
import {
  Card,
  Button,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  EmptyState,
  Skeleton,
  ConfirmDialog,
  Tooltip,
  Alert,
} from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { remindersApi } from '@/api/reminders'
import { friendlyDay, formatTime } from '@/lib/format'
import { ReminderDrawer } from './ReminderDrawer'
import { reminderTypeMeta, priorityTone, statusTone } from './meta'
import type { Reminder } from '@/types'

type Tab = 'upcoming' | 'all' | 'completed'

export default function RemindersPage() {
  const { user } = useAuth()
  if (user && user.role !== 'patient') return <ComingSoon />

  const toast = useToast()
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('upcoming')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Reminder | null>(null)
  const [toDelete, setToDelete] = useState<Reminder | null>(null)

  const { data, isLoading, isError } = useQuery({ queryKey: ['reminders', 'list'], queryFn: remindersApi.list })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['reminders'] })

  const complete = useMutation({
    mutationFn: remindersApi.complete,
    onSuccess: () => {
      invalidate()
      toast.success('Marked as completed')
    },
  })
  const dismiss = useMutation({
    mutationFn: remindersApi.dismiss,
    onSuccess: () => {
      invalidate()
      toast.info('Reminder dismissed')
    },
  })
  const remove = useMutation({
    mutationFn: remindersApi.remove,
    onSuccess: () => {
      invalidate()
      toast.success('Reminder deleted')
      setToDelete(null)
    },
  })

  const filtered = useMemo(() => {
    const list = data ?? []
    if (tab === 'completed') return list.filter((r) => r.status === 'completed' || r.status === 'dismissed')
    if (tab === 'upcoming')
      return list
        .filter((r) => r.status === 'pending' && new Date(r.reminderDateTime) >= new Date(Date.now() - 864e5))
        .sort((a, b) => +new Date(a.reminderDateTime) - +new Date(b.reminderDateTime))
    return [...list].sort((a, b) => +new Date(b.reminderDateTime) - +new Date(a.reminderDateTime))
  }, [data, tab])

  const openNew = () => {
    setEditing(null)
    setDrawerOpen(true)
  }
  const openEdit = (r: Reminder) => {
    setEditing(r)
    setDrawerOpen(true)
  }

  return (
    <div>
      <PageHeader
        title="Reminders"
        description="Medications, appointments, lab tests and follow-ups — all in one place."
        action={<Button leftIcon={<Plus className="h-4 w-4" />} onClick={openNew}>New reminder</Button>}
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="mb-5">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <Alert tone="danger" title="Can't load reminders">
          Something went wrong fetching your reminders. Try refreshing the page.
        </Alert>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<BellRing className="h-7 w-7" />}
          title={tab === 'completed' ? 'Nothing completed yet' : 'No reminders here'}
          description={
            tab === 'completed'
              ? 'Completed and dismissed reminders will appear here.'
              : 'Create your first reminder to stay on top of your care.'
          }
          action={
            tab !== 'completed' && (
              <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={openNew}>
                New reminder
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const meta = reminderTypeMeta(r.reminderType)
            const done = r.status === 'completed' || r.status === 'dismissed'
            return (
              <Card key={r._id} padded className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${meta.badge}`}>
                  {meta.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={`font-semibold text-foreground ${done ? 'line-through opacity-60' : ''}`}>
                      {r.title}
                    </p>
                    <Badge tone={priorityTone(r.priority)}>{r.priority}</Badge>
                    {done && <Badge tone={statusTone(r.status)}>{r.status}</Badge>}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {friendlyDay(r.reminderDateTime)} · {formatTime(r.reminderDateTime)}
                    </span>
                    <span>{meta.label}</span>
                    {r.location && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        {r.location}
                      </span>
                    )}
                  </div>
                  {r.description && <p className="mt-1.5 text-sm text-muted-foreground">{r.description}</p>}
                </div>
                <div className="flex items-center gap-1.5">
                  {!done && (
                    <>
                      <Tooltip content="Mark completed">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => complete.mutate(r._id)}
                          className="text-success hover:bg-success-soft/60"
                        >
                          <Check className="h-4.5 w-4.5" />
                        </Button>
                      </Tooltip>
                      <Tooltip content="Dismiss">
                        <Button variant="ghost" size="icon" onClick={() => dismiss.mutate(r._id)}>
                          <X className="h-4.5 w-4.5" />
                        </Button>
                      </Tooltip>
                      <Tooltip content="Edit">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(r)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Tooltip>
                    </>
                  )}
                  <Tooltip content="Delete">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setToDelete(r)}
                      className="text-danger hover:bg-danger-soft/60"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </Tooltip>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <ReminderDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} editing={editing} />
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete._id)}
        title="Delete reminder?"
        description={`"${toDelete?.title}" will be permanently removed.`}
        confirmLabel="Delete"
        loading={remove.isPending}
      />
    </div>
  )
}
