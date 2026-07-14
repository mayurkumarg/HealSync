import { api } from './client'
import type { Role } from '@/types'

// Per-role endpoint map. Pharmacy registers at POST /pharmacy (no /sign-up), the rest use /sign-up.
const ROLE_BASE: Record<Role, string> = {
  patient: '/auth',
  doctor: '/doctor',
  hospital: '/hospital',
  pharmacy: '/pharmacy',
}

function signupPath(role: Role) {
  return role === 'pharmacy' ? '/pharmacy' : `${ROLE_BASE[role]}/sign-up`
}

export interface LoginResponse {
  status: string
  message: string
  token: string
}

export const authApi = {
  login: async (role: Role, body: { email: string; password: string }) => {
    const { data } = await api.post<LoginResponse>(`${ROLE_BASE[role]}/login`, body)
    return data
  },

  signup: async (role: Role, body: Record<string, unknown>) => {
    const { data } = await api.post(signupPath(role), body)
    return data
  },

  forgotPassword: async (role: Role, email: string) => {
    const { data } = await api.post(`${ROLE_BASE[role]}/forgot-password`, { email })
    return data
  },

  resetPassword: async (role: Role, token: string, password: string) => {
    const { data } = await api.post(`${ROLE_BASE[role]}/reset-password/${token}`, { password })
    return data
  },
}
