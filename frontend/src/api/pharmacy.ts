import { api } from './client'
import type { Medicine, Pharmacy, PharmacyStats, PharmacyStock } from '@/types'

export interface StockListResult {
  data: PharmacyStock[]
  total: number
  page: number
  totalPages: number
}

export const pharmacyApi = {
  me: async (): Promise<Pharmacy> => {
    const { data } = await api.get('/pharmacy/me')
    return data.data
  },

  updateProfile: async (body: Record<string, unknown>): Promise<Pharmacy> => {
    const { data } = await api.patch('/pharmacy/profile', body)
    return data.pharmacy
  },

  stats: async (): Promise<PharmacyStats> => {
    const { data } = await api.get('/pharmacy/stock/stats')
    return data.data
  },

  listStock: async (params: { page?: number; limit?: number } = {}): Promise<StockListResult> => {
    const { data } = await api.get('/pharmacy/stock', { params })
    return { data: data.data ?? [], total: data.total ?? 0, page: data.page ?? 1, totalPages: data.totalPages ?? 1 }
  },

  searchStock: async (q: string): Promise<PharmacyStock[]> => {
    const { data } = await api.get('/pharmacy/stock/search', { params: { q } })
    return data.data ?? []
  },

  lowStock: async (): Promise<PharmacyStock[]> => {
    const { data } = await api.get('/pharmacy/stock/low')
    return data.data ?? []
  },

  expiryAlert: async (): Promise<PharmacyStock[]> => {
    const { data } = await api.get('/pharmacy/stock/expiry')
    return data.data ?? []
  },

  getStock: async (stockId: string): Promise<PharmacyStock> => {
    const { data } = await api.get(`/pharmacy/stock/${stockId}`)
    return data.data
  },

  addStock: async (body: {
    brandName: string
    genericName: string
    manufacturer?: string
    dosageForm?: string
    strength?: string
    quantity: number
    price: number
    expiryDate: string
    batchNo?: string
  }): Promise<PharmacyStock> => {
    const { data } = await api.post('/pharmacy/stock', body)
    return data.data
  },

  updateStock: async (
    stockId: string,
    body: { quantity?: number; price?: number; expiryDate?: string; batchNo?: string },
  ): Promise<PharmacyStock> => {
    const { data } = await api.patch(`/pharmacy/stock/${stockId}`, body)
    return data.data
  },

  deleteStock: async (stockId: string) => {
    const { data } = await api.delete(`/pharmacy/stock/${stockId}`)
    return data
  },

  // ---- Medicine catalog (used for add-stock typeahead) ----
  findMedicine: async (params: { brand?: string; generic?: string; page?: number; limit?: number }): Promise<Medicine[]> => {
    try {
      const { data } = await api.get('/medicine', { params })
      return data.data ?? []
    } catch {
      // Backend returns 404 when a filtered search finds nothing.
      return []
    }
  },
}
