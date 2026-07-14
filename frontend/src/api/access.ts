import { api } from './client'
import type { AccessGrant, AccessTokenResult, ActivityLog } from '@/types'

export const accessApi = {
  generate: async (body: { accessType?: string; expiryDuration: string }): Promise<AccessTokenResult> => {
    const { data } = await api.post('/access/generate', { accessType: 'view', ...body })
    return data.data
  },
  grantByPhone: async (body: { doctorPhone: string; expiryDuration: string }) => {
    const { data } = await api.post('/access/grant-by-phone', { accessType: 'view', ...body })
    return data
  },
  list: async (): Promise<AccessGrant[]> => {
    const { data } = await api.get('/access/list')
    return data.data ?? []
  },
  revoke: async (body: { accessId?: string; doctorId?: string }) => {
    const { data } = await api.post('/access/revoke', body)
    return data
  },
  revokeToken: async (body: { token?: string; shortCode?: string }) => {
    const { data } = await api.post('/access/revoke-token', body)
    return data
  },
  activityLogs: async (): Promise<ActivityLog[]> => {
    const { data } = await api.get('/access/activity-logs')
    return data.data ?? []
  },
  pendingRequests: async (): Promise<AccessGrant[]> => {
    const { data } = await api.get('/access/pending-requests')
    return data.data?.requests ?? []
  },
  approveDoctorRequest: async (body: { requestId: string; otp: string }) => {
    const { data } = await api.post('/access/approve-doctor-request', body)
    return data
  },
}
