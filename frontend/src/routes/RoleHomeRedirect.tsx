import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { roleHome } from './nav'

/** Sends the signed-in user from /app to their role's home page. */
export function RoleHomeRedirect() {
  const { user } = useAuth()
  return <Navigate to={user ? roleHome(user.role) : '/app/dashboard'} replace />
}
