import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Drawer, Field, Input, Textarea, Select, Button, Checkbox } from '@/components/ui'
import { useToast } from '@/context/ToastContext'
import { remindersApi } from '@/api/reminders'
import { ApiError } from '@/api/client'
import { REMINDER_TYPES, PRIORITIES, NOTIFY_OPTIONS } from './meta'
import type { Reminder } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  editing?: Reminder | null
}

const toLocalInput = (iso?: string) => {
  const d = iso ? new Date(iso) : new Date(Date.now() + 3600_000)
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16)
}

export function ReminderDrawer({ open, onClose, editing }: Props) {
  const toast = useToast()
  const qc = useQueryClient()
  const [form, setForm] = useState({
    title: '',
    reminderType: 'medication',
    reminderDateTime: toLocalInput(),
    priority: 'medium',
    notificationTime: '15-minutes-before',
    description: '',
    location: '',
    email: true,
    inApp: true,
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setError(null)
      setForm({
        title: editing?.title ?? '',
        reminderType: editing?.reminderType ?? 'medication',
        reminderDateTime: toLocalInput(editing?.reminderDateTime),
        priority: editing?.priority ?? 'medium',
        notificationTime: editing?.notificationTime ?? '15-minutes-before',
        description: editing?.description ?? '',
        location: editing?.location ?? '',
        email: editing?.notificationChannels?.email ?? true,
        inApp: editing?.notificationChannels?.inApp ?? true,
      })
    }
  }, [open, editing])

  const mutation = useMutation({
    mutationFn: (body: Partial<Reminder>) =>
      editing ? remindersApi.update(editing._id, body) : remindersApi.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reminders'] })
      toast.success(editing ? 'Reminder updated' : 'Reminder created')
      onClose()
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not save reminder.'),
  })

  const submit = () => {
    setError(null)
    if (!form.title.trim()) return setError('Please enter a title.')
    const when = new Date(form.reminderDateTime)
    if (when.getTime() < Date.now()) return setError('Reminder time must be in the future.')
    mutation.mutate({
      title: form.title.trim(),
      reminderType: form.reminderType as Reminder['reminderType'],
      reminderDateTime: when.toISOString(),
      priority: form.priority as Reminder['priority'],
      notificationTime: form.notificationTime,
      description: form.description.trim() || undefined,
      location: form.location.trim() || undefined,
      notificationChannels: { email: form.email, inApp: form.inApp, sms: false, pushNotification: form.inApp },
    })
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={editing ? 'Edit reminder' : 'New reminder'}
      description="Set up a reminder so you never miss what matters."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} loading={mutation.isPending}>
            {editing ? 'Save changes' : 'Create reminder'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <p className="rounded-lg bg-danger-soft/60 px-3 py-2 text-sm text-danger">{error}</p>}
        <Field label="Title" required>
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Take Amlodipine 5mg"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Type">
            <Select
              options={REMINDER_TYPES}
              value={form.reminderType}
              onChange={(e) => setForm({ ...form, reminderType: e.target.value })}
            />
          </Field>
          <Field label="Priority">
            <Select
              options={PRIORITIES}
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Date & time" required>
          <Input
            type="datetime-local"
            value={form.reminderDateTime}
            onChange={(e) => setForm({ ...form, reminderDateTime: e.target.value })}
          />
        </Field>
        <Field label="Notify me">
          <Select
            options={NOTIFY_OPTIONS}
            value={form.notificationTime}
            onChange={(e) => setForm({ ...form, notificationTime: e.target.value })}
          />
        </Field>
        <Field label="Location">
          <Input
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="Optional — clinic, lab, pharmacy…"
          />
        </Field>
        <Field label="Notes">
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Optional details…"
          />
        </Field>
        <div className="space-y-2.5 rounded-xl border border-border bg-surface-2/40 p-4">
          <p className="text-sm font-medium text-foreground">Notification channels</p>
          <Checkbox
            label="Email"
            checked={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.checked })}
          />
          <Checkbox
            label="In-app notification"
            checked={form.inApp}
            onChange={(e) => setForm({ ...form, inApp: e.target.checked })}
          />
        </div>
      </div>
    </Drawer>
  )
}
