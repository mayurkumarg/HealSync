import { api } from './client'
import type { BpProfile, SugarProfile, Medication } from '@/types'

// BP and Sugar share an identical route shape under /user/{BP|Sugar}.
export const vitalsApi = {
  getBp: async (): Promise<BpProfile | null> => {
    const { data } = await api.get('/user/BP')
    return data.data ?? null
  },
  getSugar: async (): Promise<SugarProfile | null> => {
    const { data } = await api.get('/user/Sugar')
    return data.data ?? null
  },

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
