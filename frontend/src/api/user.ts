import { api } from './client'
import type { PatientProfile } from '@/types'

export const userApi = {
  me: async (): Promise<PatientProfile> => {
    const { data } = await api.get('/auth/me')
    return data.data
  },

  updateProfile: async (body: {
    name?: string
    phone_no?: string
    notificationPrefs?: { email?: boolean; push?: boolean; sms?: boolean }
  }): Promise<PatientProfile> => {
    const { data } = await api.patch('/auth/me', body)
    return data.data
  },
}
