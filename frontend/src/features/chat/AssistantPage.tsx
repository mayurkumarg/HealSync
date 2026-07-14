import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Send, User, Bot } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { ComingSoon } from '@/components/shared/ComingSoon'
import { Card, Button, Badge } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { chatApi } from '@/api/chat'
import type { ChatMessage } from '@/types'

const SUGGESTIONS = [
  'What was my last cholesterol level?',
  'Summarize my recent reports',
  'How is my blood pressure trending?',
  'What medications am I on?',
]

export default function AssistantPage() {
  const { user } = useAuth()
  if (user && user.role !== 'patient') return <ComingSoon />

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  const send = async (text: string) => {
    const q = text.trim()
    if (!q || thinking) return
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: q, createdAt: Date.now() }
    setMessages((m) => [...m, userMsg])
    setInput('')
    setThinking(true)
    const { answer } = await chatApi.ask(q)
    setMessages((m) => [
      ...m,
      { id: crypto.randomUUID(), role: 'assistant', content: answer, createdAt: Date.now() },
    ])
    setThinking(false)
  }

  return (
    <div>
      <PageHeader
        title="AI Health Assistant"
        description="Ask questions about your records — HealSync answers using only your data."
        action={<Badge tone="primary" icon={<Sparkles className="h-3.5 w-3.5" />}>Beta</Badge>}
      />

      <Card className="flex h-[calc(100vh-16rem)] min-h-[28rem] flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-glow">
                <Sparkles className="h-8 w-8" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold text-foreground">How can I help with your health?</h3>
              <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
                I can summarize reports, recall test values, and explain trends — grounded in your records.
              </p>
              <div className="mt-6 grid w-full max-w-lg gap-2.5 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-xl border border-border bg-surface-2/40 px-4 py-3 text-left text-sm text-foreground transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => <Bubble key={m.id} message={m} />)
          )}
          {thinking && <TypingBubble />}
          <div ref={endRef} />
        </div>

        {/* Composer */}
        <div className="border-t border-border p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              send(input)
            }}
            className="flex items-center gap-2.5"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your health records…"
              className="h-11 flex-1 rounded-xl border border-input bg-surface px-4 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring/60"
            />
            <Button type="submit" size="icon" disabled={!input.trim() || thinking}>
              <Send className="h-4.5 w-4.5" />
            </Button>
          </form>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            AI can make mistakes. Always confirm with your doctor.
          </p>
        </div>
      </Card>
    </div>
  )
}

function Bubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
          isUser ? 'bg-surface-2 text-foreground' : 'bg-gradient-to-br from-primary to-accent text-white'
        }`}
      >
        {isUser ? <User className="h-4.5 w-4.5" /> : <Bot className="h-4.5 w-4.5" />}
      </div>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'border border-border bg-surface-2/60 text-foreground'
        }`}
      >
        {message.content}
      </div>
    </motion.div>
  )
}

function TypingBubble() {
  return (
    <div className="flex gap-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-white">
        <Bot className="h-4.5 w-4.5" />
      </div>
      <div className="flex items-center gap-1 rounded-2xl border border-border bg-surface-2/60 px-4 py-3.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  )
}
