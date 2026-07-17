import { api } from './client'
import type { MedicalDocument } from '@/types'

export const documentsApi = {
  list: async (): Promise<MedicalDocument[]> => {
    const { data } = await api.get('/documents')
    return data.data ?? []
  },

  remove: async (id: string) => {
    await api.delete(`/documents/${id}`)
  },

  upload: async (file: File) => {
    const form = new FormData()
    form.append('file', file)
    const { data } = await api.post('/documents/ai/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },
}
