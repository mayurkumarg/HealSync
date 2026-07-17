import { api } from './client'
import type { Consultation, ConsultationSettings, DoctorListing } from '@/types'

export const consultationsApi = {
  // ---- Patient: discovery + booking ----
  listDoctors: async (params: { specialization?: string; search?: string } = {}): Promise<DoctorListing[]> => {
    const { data } = await api.get('/consultations/doctors', { params })
    return data.data ?? []
  },

  getSlots: async (doctorId: string, date: string): Promise<string[]> => {
    const { data } = await api.get(`/consultations/doctors/${doctorId}/slots`, { params: { date } })
    return data.data ?? []
  },

  book: async (body: { doctorId: string; scheduledAt: string; reason?: string; mode?: string }): Promise<Consultation> => {
    const { data } = await api.post('/consultations', body)
    return data.data
  },

  mine: async (scope: 'upcoming' | 'past' | 'all' = 'all'): Promise<Consultation[]> => {
    const { data } = await api.get('/consultations/mine', { params: { scope } })
    return data.data ?? []
  },

  // ---- Doctor: settings + workflow ----
  updateSettings: async (body: { enabled?: boolean; fee?: number | null; avgMinutes?: number }): Promise<ConsultationSettings> => {
    const { data } = await api.patch('/consultations/doctor/settings', body)
    return data.data
  },

  doctorList: async (scope: 'today' | 'upcoming' | 'past' | 'all' = 'all'): Promise<Consultation[]> => {
    const { data } = await api.get('/consultations/doctor/list', { params: { scope } })
    return data.data ?? []
  },

  confirm: async (id: string): Promise<Consultation> => {
    const { data } = await api.patch(`/consultations/${id}/confirm`)
    return data.data
  },

  complete: async (id: string, body: { notes?: string; prescriptionText?: string }): Promise<Consultation> => {
    const { data } = await api.patch(`/consultations/${id}/complete`, body)
    return data.data
  },

  // ---- Shared ----
  cancel: async (id: string, reason?: string): Promise<Consultation> => {
    const { data } = await api.patch(`/consultations/${id}/cancel`, { reason })
    return data.data
  },
}
