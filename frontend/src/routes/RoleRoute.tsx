import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '@/context/AuthContext'
import { roleHome } from './nav'
import type { Role } from '@/types'

/**
 * Restricts a route subtree to specific roles. A signed-in user whose role isn't allowed is
 * redirected to their own role's home — this is what enforces the hard doctor/hospital split
 * (and keeps patients out of provider areas) on the client, matching the backend's isolation.
 */
export function RoleRoute({ allow, children }: { allow: Role[]; children: ReactNode }) {
  const { user } = useAuth()
  if (!user) return null // ProtectedRoute handles the unauthenticated case upstream
  if (!allow.includes(user.role)) {
    return <Navigate to={roleHome(user.role)} replace />
  }
  return <>{children}</>
}
