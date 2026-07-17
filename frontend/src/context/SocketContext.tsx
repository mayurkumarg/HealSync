import { createContext, useContext, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { io, type Socket } from 'socket.io-client'
import { useQueryClient } from '@tanstack/react-query'
import { SOCKET_URL } from '@/api/client'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'

interface ReminderNotification {
  reminderId: string
  title: string
  description?: string
  reminderType: string
  reminderDateTime: string
  priority: string
  location?: string
  sentAt: string
}

const Ctx = createContext<Socket | null>(null)

/** Connects to the backend's Socket.IO server (service/socket.js) once a patient is signed in,
 * so due-reminder pushes (service/reminderScheduler.js -> sendReminderNotification) surface as a
 * live toast instead of only appearing next time the Reminders page is polled/refetched. */
export function SocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const toast = useToast()
  const qc = useQueryClient()
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!user || user.role !== 'patient') {
      socketRef.current?.disconnect()
      socketRef.current = null
      return
    }

    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] })
    socketRef.current = socket

    socket.on('connect', () => socket.emit('user-connect', user.id))

    socket.on('reminder-notification', (data: ReminderNotification) => {
      toast.info(data.title, data.description || 'Reminder due now')
      qc.invalidateQueries({ queryKey: ['reminders'] })
      qc.invalidateQueries({ queryKey: ['notifications'] })
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.role])

  return <Ctx.Provider value={socketRef.current}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSocket() {
  return useContext(Ctx)
}
