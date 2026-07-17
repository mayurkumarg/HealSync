import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { RoleRoute } from '@/routes/RoleRoute'

const useAuthMock = vi.fn()
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}))

function renderAt(path: string, allow: ('patient' | 'doctor' | 'hospital' | 'pharmacy')[]) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/app/dashboard" element={<div>Patient home</div>} />
        <Route path="/app/doctor" element={<div>Doctor home</div>} />
        <Route
          path="/app/doctor/patients"
          element={
            <RoleRoute allow={allow}>
              <div>Doctor-only content</div>
            </RoleRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RoleRoute', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
  })

  it('renders nothing when there is no signed-in user (ProtectedRoute handles that upstream)', () => {
    useAuthMock.mockReturnValue({ user: null })
    const { container } = renderAt('/app/doctor/patients', ['doctor'])
    expect(container.textContent).toBe('')
  })

  it('redirects a patient away from a doctor-only route to their own home — the hard role split', () => {
    useAuthMock.mockReturnValue({ user: { id: 'u1', role: 'patient' } })
    renderAt('/app/doctor/patients', ['doctor'])
    expect(screen.getByText('Patient home')).toBeInTheDocument()
    expect(screen.queryByText('Doctor-only content')).not.toBeInTheDocument()
  })

  it('renders the content for a user whose role is in the allow list', () => {
    useAuthMock.mockReturnValue({ user: { id: 'd1', role: 'doctor' } })
    renderAt('/app/doctor/patients', ['doctor'])
    expect(screen.getByText('Doctor-only content')).toBeInTheDocument()
  })
})
