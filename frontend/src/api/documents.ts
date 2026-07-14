import { api } from './client'
import { MOCK_DOCUMENTS } from '@/lib/mock'
import type { MedicalDocument } from '@/types'

export interface DocumentsResult {
  documents: MedicalDocument[]
  isSample: boolean
}

export const documentsApi = {
  /**
   * Reads from Mongo (no external keys needed). If the request fails outright
   * (e.g. server down), fall back to seeded sample documents so the gallery stays viewable.
   * A genuinely empty result is returned as-is so the page can show its real empty state.
   */
  list: async (): Promise<DocumentsResult> => {
    try {
      const { data } = await api.get('/documents')
      return { documents: data.data ?? [], isSample: false }
    } catch {
      return { documents: MOCK_DOCUMENTS, isSample: true }
    }
  },

  remove: async (id: string) => {
    await api.delete(`/documents/${id}`)
  },

  /** Upload needs Supabase storage + OCR keys; surfaces a clear error when unconfigured. */
  upload: async (file: File) => {
    const form = new FormData()
    form.append('file', file)
    const { data } = await api.post('/documents/ai/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },
}
