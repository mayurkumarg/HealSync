import { api } from './client'
import type { FormEntry } from '@/types'

export const formEntryApi = {
  list: async (patientId: string): Promise<FormEntry[]> => {
    const { data } = await api.get(`/form-entry/list/${patientId}`)
    return data.data ?? []
  },

  create: async (body: {
    formType: string
    data: Record<string, string>
    description?: string
    patientId?: string
  }): Promise<FormEntry> => {
    const { data } = await api.post('/form-entry/create', body)
    return data.data
  },

  update: async (id: string, body: { data?: Record<string, string>; description?: string }): Promise<FormEntry> => {
    const { data } = await api.put(`/form-entry/${id}`, body)
    return data.data
  },

  remove: async (id: string) => {
    await api.delete(`/form-entry/${id}`)
  },
}
