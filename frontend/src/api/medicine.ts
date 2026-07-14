import { api } from './client'
import type { MedicineSearchResult } from '@/types'

export const medicineApi = {
  searchNearby: async (params: {
    medicine: string
    lat?: number
    lng?: number
    radius?: number
  }): Promise<MedicineSearchResult[]> => {
    const { data } = await api.get('/medicine/search-nearby', { params })
    return data.data ?? []
  },
}
