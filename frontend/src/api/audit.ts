import { api } from './client'
import type { RecordAccessEntry } from '@/types'

export const auditApi = {
  mine: async (): Promise<RecordAccessEntry[]> => {
    const { data } = await api.get('/audit/mine')
    return data.data ?? []
  },
}
