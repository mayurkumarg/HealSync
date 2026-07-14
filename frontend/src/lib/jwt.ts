/** Decode a JWT payload without verifying it (client-side identity hydration only). */
export interface JwtPayload {
  id?: string
  email?: string
  username?: string
  type?: string
  iat?: number
  exp?: number
}

export function decodeJwt(token: string): JwtPayload | null {
  try {
    const payload = token.split('.')[1]
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decodeURIComponent(escape(json)))
  } catch {
    return null
  }
}

export function isJwtExpired(token: string): boolean {
  const p = decodeJwt(token)
  if (!p?.exp) return false
  return Date.now() >= p.exp * 1000
}
