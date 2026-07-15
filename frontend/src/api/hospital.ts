import { api } from './client'
import type { Doctor, DoctorStats, Hospital, VerificationStatus } from '@/types'

export const hospitalApi = {
  me: async (): Promise<Hospital> => {
    const { data } = await api.get('/hospital/me')
    return data.data
  },

  listDoctors: async (): Promise<Doctor[]> => {
    const { data } = await api.get('/hospital/doctors')
    return data.data?.doctors ?? []
  },

  doctorStats: async (): Promise<DoctorStats> => {
    const { data } = await api.get('/hospital/doctors/stats')
    return data.data
  },

  createDoctor: async (body: Record<string, unknown>) => {
    const { data } = await api.post('/hospital/create-doctor', body)
    return data
  },

  updateDoctor: async (id: string, body: Record<string, unknown>): Promise<Doctor> => {
    const { data } = await api.put(`/hospital/doctors/${id}`, body)
    return data.data
  },

  deleteDoctor: async (id: string) => {
    const { data } = await api.delete(`/hospital/doctors/${id}`)
    return data
  },

  setVerification: async (id: string, status: VerificationStatus): Promise<Doctor> => {
    const { data } = await api.patch(`/hospital/doctors/${id}/verify`, { status })
    return data.data
  },
}
