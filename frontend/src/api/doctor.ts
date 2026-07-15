import { api } from './client'
import { mockAiReply } from '@/lib/mock'
import type { AccessiblePatient, Doctor, MedicalDocument, PatientRecords } from '@/types'

export const doctorApi = {
  me: async (): Promise<Doctor> => {
    const { data } = await api.get('/doctor/me')
    return data.data
  },

  /** Patients this doctor has active access to (from the shared access list). */
  listPatients: async (): Promise<AccessiblePatient[]> => {
    const { data } = await api.get('/access/list')
    return (data.data ?? []).filter((a: AccessiblePatient) => a.isActive)
  },

  getPatientRecords: async (patientId: string): Promise<PatientRecords> => {
    const { data } = await api.get(`/doctor-access/patient/${patientId}/records`)
    return data.data
  },

  getPatientDocuments: async (patientId: string): Promise<MedicalDocument[]> => {
    const { data } = await api.get(`/documents/patient/${patientId}`)
    return data.data ?? []
  },

  // ---- Access acquisition ----
  requestAccess: async (body: { patientPhone: string; reason?: string; expiryDuration: string }) => {
    const { data } = await api.post('/doctor-access/request-access', { accessType: 'view', ...body })
    return data.data as { requestId: string; patientName: string; patientPhone: string; via: string }
  },

  approveRequest: async (body: { requestId: string; otp: string }) => {
    const { data } = await api.post('/access/approve-doctor-request', body)
    return data.data
  },

  claim: async (body: { token?: string; shortCode?: string }) => {
    const { data } = await api.post('/access/claim', body)
    return data.data
  },

  /** Upload a document for a patient (needs Supabase/OCR configured). */
  uploadForPatient: async (patientId: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    form.append('patientId', patientId)
    const { data } = await api.post('/documents/ai/upload-for-patient', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  /** Doctor AI summary for a patient — falls back to a canned reply if Ollama is offline. */
  chat: async (question: string, patientId: string): Promise<{ answer: string; isMock: boolean }> => {
    try {
      const { data } = await api.post('/doctor/chat', { question, patientId })
      const answer: string = data.answer ?? ''
      if (!answer.trim() || /trouble connecting|ollama/i.test(answer)) {
        return { answer: mockAiReply(question), isMock: true }
      }
      return { answer, isMock: false }
    } catch {
      return { answer: mockAiReply(question), isMock: true }
    }
  },
}
