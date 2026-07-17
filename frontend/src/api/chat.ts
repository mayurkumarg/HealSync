import { api } from './client'
import type { ChatHistoryTurn, ChatResult } from '@/types'

export const chatApi = {
  /** Patient AI Assistant — Groq-backed RAG chat grounded in the signed-in patient's own
   * records. The backend always replies 200 with a user-friendly `answer` even on failure
   * (rate limits, misconfiguration, etc.), so the UI never needs a client-side mock fallback. */
  ask: async (question: string, history: ChatHistoryTurn[] = []): Promise<ChatResult> => {
    const { data } = await api.post('/chat', { question, history })
    return { answer: data.answer ?? '', sources: data.sources ?? [] }
  },
}
