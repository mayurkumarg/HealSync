import { api } from './client'
import type { TimelineEvent } from '@/types'

export const timelineApi = {
  mine: async (): Promise<TimelineEvent[]> => {
    const { data } = await api.get('/timeline/mine')
    return data.data ?? []
  },
}
