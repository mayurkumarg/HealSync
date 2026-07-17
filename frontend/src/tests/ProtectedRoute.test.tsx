import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/routes/ProtectedRoute'

const useAuthMock = vi.fn()
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}))

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<div>Login page</div>} />
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <div>Protected content</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
  })

  it('shows a loading state while auth is still resolving, not the protected content', () => {
    useAuthMock.mockReturnValue({ isAuthenticated: false, loading: true })
    renderAt('/app')
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
    expect(screen.queryByText('Login page')).not.toBeInTheDocument()
  })

  it('redirects an unauthenticated user to /login instead of rendering children', () => {
    useAuthMock.mockReturnValue({ isAuthenticated: false, loading: false })
    renderAt('/app')
    expect(screen.getByText('Login page')).toBeInTheDocument()
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })

  it('renders the protected content once authenticated', () => {
    useAuthMock.mockReturnValue({ isAuthenticated: true, loading: false })
    renderAt('/app')
    expect(screen.getByText('Protected content')).toBeInTheDocument()
  })
})
