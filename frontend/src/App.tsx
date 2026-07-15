import { Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { RoleRoute } from '@/routes/RoleRoute'
import { RoleHomeRedirect } from '@/routes/RoleHomeRedirect'

import Landing from '@/pages/Landing'
import Login from '@/pages/auth/Login'
import Signup from '@/pages/auth/Signup'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import ResetPassword from '@/pages/auth/ResetPassword'
import VerifyEmail from '@/pages/auth/VerifyEmail'
import NotFound from '@/pages/NotFound'

// Patient
import DashboardPage from '@/features/dashboard/DashboardPage'
import VitalsPage from '@/features/vitals/VitalsPage'
import RemindersPage from '@/features/reminders/RemindersPage'
import DocumentsPage from '@/features/documents/DocumentsPage'
import SharingPage from '@/features/access/SharingPage'
import PharmacyPage from '@/features/pharmacy/PharmacyPage'
import AssistantPage from '@/features/chat/AssistantPage'
import ProfilePage from '@/features/profile/ProfilePage'

// Doctor
import DoctorDashboard from '@/features/doctor/DoctorDashboard'
import DoctorPatients from '@/features/doctor/DoctorPatients'
import PatientRecordsPage from '@/features/doctor/PatientRecordsPage'

// Hospital
import HospitalDashboard from '@/features/hospital/HospitalDashboard'
import DoctorManagement from '@/features/hospital/DoctorManagement'
import FacilityPage from '@/features/hospital/FacilityPage'

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
        {/* Land on the correct home for the signed-in role */}
        <Route index element={<RoleHomeRedirect />} />

        {/* Patient */}
        <Route path="dashboard" element={<RoleRoute allow={['patient']}><DashboardPage /></RoleRoute>} />
        <Route path="vitals" element={<RoleRoute allow={['patient']}><VitalsPage /></RoleRoute>} />
        <Route path="reminders" element={<RoleRoute allow={['patient']}><RemindersPage /></RoleRoute>} />
        <Route path="documents" element={<RoleRoute allow={['patient']}><DocumentsPage /></RoleRoute>} />
        <Route path="sharing" element={<RoleRoute allow={['patient']}><SharingPage /></RoleRoute>} />
        <Route path="pharmacy" element={<RoleRoute allow={['patient']}><PharmacyPage /></RoleRoute>} />
        <Route path="assistant" element={<RoleRoute allow={['patient']}><AssistantPage /></RoleRoute>} />

        {/* Doctor */}
        <Route path="doctor" element={<RoleRoute allow={['doctor']}><DoctorDashboard /></RoleRoute>} />
        <Route path="doctor/patients" element={<RoleRoute allow={['doctor']}><DoctorPatients /></RoleRoute>} />
        <Route path="doctor/patients/:patientId" element={<RoleRoute allow={['doctor']}><PatientRecordsPage /></RoleRoute>} />

        {/* Hospital */}
        <Route path="hospital" element={<RoleRoute allow={['hospital']}><HospitalDashboard /></RoleRoute>} />
        <Route path="hospital/doctors" element={<RoleRoute allow={['hospital']}><DoctorManagement /></RoleRoute>} />
        <Route path="hospital/facility" element={<RoleRoute allow={['hospital']}><FacilityPage /></RoleRoute>} />

        {/* Shared */}
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
