import { api } from './client'
import type { AccessiblePatient, ChatHistoryTurn, ChatResult, Doctor, MedicalDocument, PatientRecords } from '@/types'

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

  /** Doctor AI Assistant — Groq-backed RAG chat grounded in an authorized patient's records.
   * The backend always replies 200 with a user-friendly `answer` even on failure (rate limits,
   * misconfiguration, etc.) so the UI never needs a client-side mock fallback. */
  chat: async (question: string, patientId: string, history: ChatHistoryTurn[] = []): Promise<ChatResult> => {
    const { data } = await api.post('/doctor/chat', { question, patientId, history })
    return { answer: data.answer ?? '', sources: data.sources ?? [] }
  },
}
