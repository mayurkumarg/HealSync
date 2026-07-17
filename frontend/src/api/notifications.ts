import { api } from './client'

export type NotificationType =
  | 'reminder'
  | 'update'
  | 'alert'
  | 'document_upload'
  | 'data_package_ready'
  | 'ai_chat_invite'
  | 'form_entry'
  | 'consultation'

export interface AppNotification {
  _id: string
  type: NotificationType
  message: string
  relatedDocument?: string
  sentAt: string
  readStatus: boolean
}

export interface NotificationsResult {
  data: AppNotification[]
  unreadCount: number
}

export const notificationsApi = {
  list: async (): Promise<NotificationsResult> => {
    const { data } = await api.get('/notifications', { params: { limit: 30 } })
    return { data: data.data ?? [], unreadCount: data.unreadCount ?? 0 }
  },

  markRead: async (id: string) => {
    await api.patch(`/notifications/${id}/read`)
  },

  markAllRead: async () => {
    await api.patch('/notifications/read-all')
  },

  remove: async (id: string) => {
    await api.delete(`/notifications/${id}`)
  },
}
