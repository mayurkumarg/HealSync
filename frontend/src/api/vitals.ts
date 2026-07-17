import { api } from './client'
import type { BpProfile, SugarProfile, Medication } from '@/types'

/**
 * The backend's GET /user/{BP|Sugar} deliberately splits into two mutually-exclusive shapes
 * behind an `include` query param (medication document vs. readings list — see
 * getBpReading.js/getSugarReading.js), and 404s when either side is empty. The rest of the
 * frontend wants one merged object (document fields + readings[]), so fetch both and combine —
 * treating "no profile yet" as null and "no readings yet" as an empty array rather than errors.
 */
async function fetchVitalsProfile<T extends Medication & { readings: unknown[] }>(base: '/user/BP' | '/user/Sugar'): Promise<T | null> {
  const [docRes, readingsRes] = await Promise.allSettled([
    api.get(base, { params: { include: 'document' } }),
    api.get(base, { params: { include: 'readings', limit: 500 } }),
  ])

  if (docRes.status !== 'fulfilled') return null
  const document = docRes.value.data.document
  if (!document) return null

  const readings = readingsRes.status === 'fulfilled' ? readingsRes.value.data.readings ?? [] : []
  return { ...document, readings } as T
}

// BP and Sugar share an identical route shape under /user/{BP|Sugar}.
export const vitalsApi = {
  getBp: async (): Promise<BpProfile | null> => fetchVitalsProfile<BpProfile>('/user/BP'),
  getSugar: async (): Promise<SugarProfile | null> => fetchVitalsProfile<SugarProfile>('/user/Sugar'),

  initBp: async (body: Medication): Promise<BpProfile> => {
    const { data } = await api.post('/user/BP', body)
    return data.data
  },
  initSugar: async (body: Medication): Promise<SugarProfile> => {
    const { data } = await api.post('/user/Sugar', body)
    return data.data
  },

  addBpReading: async (body: { systolic: number; diastolic: number; pulse?: number; recordedAt: string }) => {
    const { data } = await api.post('/user/BP/BPReadings', body)
    return data.data
  },
  addSugarReading: async (body: { level: number; type: string; recordedAt: string }) => {
    const { data } = await api.post('/user/Sugar/SugarReadings', body)
    return data.data
  },

  updateBpMedication: async (body: Medication) => {
    const { data } = await api.patch('/user/BP?type=document', body)
    return data.data
  },
  updateSugarMedication: async (body: Medication) => {
    const { data } = await api.patch('/user/Sugar?type=document', body)
    return data.data
  },

  deleteBpReading: async (id: string) => {
    await api.delete(`/user/BP?type=reading&id=${id}`)
  },
  deleteSugarReading: async (id: string) => {
    await api.delete(`/user/Sugar?type=reading&id=${id}`)
  },
}
