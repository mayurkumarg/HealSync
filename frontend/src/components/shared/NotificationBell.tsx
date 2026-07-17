import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bell,
  BellRing,
  FileText,
  ShieldCheck,
  ClipboardList,
  Sparkles,
  Package,
  Info,
  CheckCheck,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '@/api/notifications'
import type { AppNotification, NotificationType } from '@/api/notifications'
import { EmptyState, Skeleton } from '@/components/ui'
import { timeAgo } from '@/lib/format'
import { cn } from '@/lib/cn'

const TYPE_META: Record<NotificationType, { icon: React.ReactNode; tone: string }> = {
  reminder: { icon: <BellRing className="h-4 w-4" />, tone: 'bg-warning-soft text-warning' },
  update: { icon: <Info className="h-4 w-4" />, tone: 'bg-accent-soft text-accent' },
  alert: { icon: <ShieldCheck className="h-4 w-4" />, tone: 'bg-primary-soft text-primary' },
  document_upload: { icon: <FileText className="h-4 w-4" />, tone: 'bg-success-soft text-success' },
  data_package_ready: { icon: <Package className="h-4 w-4" />, tone: 'bg-accent-soft text-accent' },
  ai_chat_invite: { icon: <Sparkles className="h-4 w-4" />, tone: 'bg-primary-soft text-primary' },
  form_entry: { icon: <ClipboardList className="h-4 w-4" />, tone: 'bg-success-soft text-success' },
  consultation: { icon: <BellRing className="h-4 w-4" />, tone: 'bg-primary-soft text-primary' },
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({ queryKey: ['notifications'], queryFn: notificationsApi.list })

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAllRead = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const notifications = data?.data ?? []
  const unreadCount = data?.unreadCount ?? 0

  const onItemClick = (n: AppNotification) => {
    if (!n.readStatus) markRead.mutate(n._id)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative grid h-10 w-10 place-items-center rounded-xl border border-border bg-surface text-foreground transition-colors hover:bg-surface-2"
        aria-label="Notifications"
      >
        <Bell className="h-[1.1rem] w-[1.1rem]" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-danger-foreground">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-50 mt-2 w-[22rem] max-w-[90vw] overflow-hidden rounded-xl border border-border bg-surface shadow-elevated"
          >
            <div className="flex items-center justify-between border-b border-border p-3.5">
              <p className="text-sm font-semibold text-foreground">Notifications</p>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="space-y-2 p-3">
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <EmptyState
                  icon={<Bell className="h-6 w-6" />}
                  title="No notifications yet"
                  description="Reminders, access grants and document updates will show up here."
                  className="py-10"
                />
              ) : (
                <ul className="divide-y divide-border">
                  {notifications.map((n) => {
                    const meta = TYPE_META[n.type] ?? TYPE_META.update
                    return (
                      <li key={n._id}>
                        <button
                          onClick={() => onItemClick(n)}
                          className={cn(
                            'flex w-full items-start gap-3 p-3.5 text-left transition-colors hover:bg-surface-2',
                            !n.readStatus && 'bg-primary-soft/30',
                          )}
                        >
                          <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-lg', meta.tone)}>{meta.icon}</span>
                          <span className="min-w-0 flex-1">
                            <span className={cn('block text-sm', n.readStatus ? 'text-muted-foreground' : 'font-medium text-foreground')}>
                              {n.message}
                            </span>
                            <span className="mt-0.5 block text-xs text-muted-foreground">{timeAgo(n.sentAt)}</span>
                          </span>
                          {!n.readStatus && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
