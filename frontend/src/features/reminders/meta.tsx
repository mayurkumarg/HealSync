import type { ReactNode } from 'react'
import { CalendarDays, Pill, FileText, Stethoscope, FlaskConical, Bell } from 'lucide-react'
import type { Priority, ReminderStatus, ReminderType } from '@/types'

interface TypeMeta {
  icon: ReactNode
  badge: string
  label: string
}

export function reminderTypeMeta(type: ReminderType): TypeMeta {
  const map: Record<ReminderType, TypeMeta> = {
    appointment: { icon: <CalendarDays className="h-5 w-5" />, badge: 'bg-accent-soft text-accent', label: 'Appointment' },
    medication: { icon: <Pill className="h-5 w-5" />, badge: 'bg-primary-soft text-primary', label: 'Medication' },
    prescription: { icon: <FileText className="h-5 w-5" />, badge: 'bg-primary-soft text-primary', label: 'Prescription' },
    report: { icon: <FileText className="h-5 w-5" />, badge: 'bg-warning-soft text-warning', label: 'Report' },
    'lab-test': { icon: <FlaskConical className="h-5 w-5" />, badge: 'bg-success-soft text-success', label: 'Lab test' },
    'follow-up': { icon: <Stethoscope className="h-5 w-5" />, badge: 'bg-accent-soft text-accent', label: 'Follow-up' },
    other: { icon: <Bell className="h-5 w-5" />, badge: 'bg-surface-2 text-muted-foreground', label: 'Other' },
  }
  return map[type] ?? map.other
}

export function priorityTone(p: Priority): 'neutral' | 'primary' | 'warning' | 'danger' {
  const map: Record<Priority, 'neutral' | 'primary' | 'warning' | 'danger'> = {
    low: 'neutral',
    medium: 'primary',
    high: 'warning',
    critical: 'danger',
  }
  return map[p] ?? 'neutral'
}

export function statusTone(s: ReminderStatus): 'neutral' | 'primary' | 'success' | 'warning' {
  const map: Record<ReminderStatus, 'neutral' | 'primary' | 'success' | 'warning'> = {
    pending: 'primary',
    sent: 'warning',
    completed: 'success',
    dismissed: 'neutral',
    expired: 'neutral',
  }
  return map[s] ?? 'neutral'
}

export const REMINDER_TYPES: { label: string; value: ReminderType }[] = [
  { label: 'Appointment', value: 'appointment' },
  { label: 'Medication', value: 'medication' },
  { label: 'Prescription', value: 'prescription' },
  { label: 'Report', value: 'report' },
  { label: 'Lab test', value: 'lab-test' },
  { label: 'Follow-up', value: 'follow-up' },
  { label: 'Other', value: 'other' },
]

export const PRIORITIES: { label: string; value: Priority }[] = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Critical', value: 'critical' },
]

export const NOTIFY_OPTIONS = [
  { label: 'At time of event', value: 'on-time' },
  { label: '15 minutes before', value: '15-minutes-before' },
  { label: '1 hour before', value: '1-hour-before' },
  { label: '1 day before', value: '1-day-before' },
]
