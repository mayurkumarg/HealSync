import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/routes/ProtectedRoute'

import Landing from '@/pages/Landing'
import Login from '@/pages/auth/Login'
import Signup from '@/pages/auth/Signup'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import ResetPassword from '@/pages/auth/ResetPassword'
import VerifyEmail from '@/pages/auth/VerifyEmail'
import NotFound from '@/pages/NotFound'

import DashboardPage from '@/features/dashboard/DashboardPage'
import VitalsPage from '@/features/vitals/VitalsPage'
import RemindersPage from '@/features/reminders/RemindersPage'
import DocumentsPage from '@/features/documents/DocumentsPage'
import SharingPage from '@/features/access/SharingPage'
import PharmacyPage from '@/features/pharmacy/PharmacyPage'
import AssistantPage from '@/features/chat/AssistantPage'
import ProfilePage from '@/features/profile/ProfilePage'

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/verify/:token" element={<VerifyEmail />} />

      {/* Authenticated app shell */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="vitals" element={<VitalsPage />} />
        <Route path="reminders" element={<RemindersPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="sharing" element={<SharingPage />} />
        <Route path="pharmacy" element={<PharmacyPage />} />
        <Route path="assistant" element={<AssistantPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
