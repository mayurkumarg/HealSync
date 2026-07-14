import { api } from './client'
import type { Reminder, ReminderStats } from '@/types'

export const remindersApi = {
  list: async (): Promise<Reminder[]> => {
    const { data } = await api.get('/reminders')
    return data.data ?? []
  },
  upcoming: async (): Promise<Reminder[]> => {
    const { data } = await api.get('/reminders/upcoming')
    return data.data ?? []
  },
  stats: async (): Promise<ReminderStats> => {
    const { data } = await api.get('/reminders/stats')
    return data.data ?? {}
  },
  create: async (body: Partial<Reminder>): Promise<Reminder> => {
    const { data } = await api.post('/reminders', body)
    return data.data
  },
  update: async (id: string, body: Partial<Reminder>): Promise<Reminder> => {
    const { data } = await api.put(`/reminders/${id}`, body)
    return data.data
  },
  remove: async (id: string) => {
    await api.delete(`/reminders/${id}`)
  },
  complete: async (id: string) => {
    const { data } = await api.patch(`/reminders/${id}/complete`)
    return data.data
  },
  dismiss: async (id: string) => {
    const { data } = await api.patch(`/reminders/${id}/dismiss`)
    return data.data
  },
}
