import { api } from './client'
import { mockAiReply } from '@/lib/mock'

export interface ChatResult {
  answer: string
  isMock: boolean
}

export const chatApi = {
  /**
   * Calls the backend AI chat (backed by a local Ollama LLM). If Ollama isn't running / not
   * configured, the request fails or returns an empty answer — fall back to a canned reply so
   * the assistant screen still demonstrates the experience. `isMock` lets the UI flag it.
   */
  ask: async (question: string): Promise<ChatResult> => {
    try {
      const { data } = await api.post('/chat', { question })
      const answer: string = data.answer ?? data.data?.answer ?? ''
      if (!answer.trim() || /trouble connecting|ollama/i.test(answer)) {
        return { answer: mockAiReply(question), isMock: true }
      }
      return { answer, isMock: false }
    } catch {
      return { answer: mockAiReply(question), isMock: true }
    }
  },
}
