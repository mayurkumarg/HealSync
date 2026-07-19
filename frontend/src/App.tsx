import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { RoleRoute } from '@/routes/RoleRoute'
import { RoleHomeRedirect } from '@/routes/RoleHomeRedirect'
import { LoadingState } from '@/components/ui/Spinner'

const Landing = lazy(() => import('@/pages/Landing'))
const Login = lazy(() => import('@/pages/auth/Login'))
const Signup = lazy(() => import('@/pages/auth/Signup'))
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'))
const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword'))
const VerifyEmail = lazy(() => import('@/pages/auth/VerifyEmail'))
const NotFound = lazy(() => import('@/pages/NotFound'))

// Patient
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'))
const VitalsPage = lazy(() => import('@/features/vitals/VitalsPage'))
const RemindersPage = lazy(() => import('@/features/reminders/RemindersPage'))
const HealthRecordsPage = lazy(() => import('@/features/records/HealthRecordsPage'))
const ConsultationsPage = lazy(() => import('@/features/consultations/ConsultationsPage'))
const SharingPage = lazy(() => import('@/features/access/SharingPage'))
const PharmacyPage = lazy(() => import('@/features/pharmacy/PharmacyPage'))
const AssistantPage = lazy(() => import('@/features/chat/AssistantPage'))
const ProfilePage = lazy(() => import('@/features/profile/ProfilePage'))

// Doctor
const DoctorDashboard = lazy(() => import('@/features/doctor/DoctorDashboard'))
const DoctorPatients = lazy(() => import('@/features/doctor/DoctorPatients'))
const PatientRecordsPage = lazy(() => import('@/features/doctor/PatientRecordsPage'))
const ClaimAccessPage = lazy(() => import('@/features/doctor/ClaimAccessPage'))
const DoctorConsultationsPage = lazy(() => import('@/features/doctor/DoctorConsultationsPage'))

// Hospital
const HospitalDashboard = lazy(() => import('@/features/hospital/HospitalDashboard'))
const DoctorManagement = lazy(() => import('@/features/hospital/DoctorManagement'))
const FacilityPage = lazy(() => import('@/features/hospital/FacilityPage'))

// Pharmacy
const PharmacyDashboard = lazy(() => import('@/features/pharmacy/PharmacyDashboard'))
const StockManagement = lazy(() => import('@/features/pharmacy/StockManagement'))
const PharmacyFacilityPage = lazy(() => import('@/features/pharmacy/PharmacyFacilityPage'))

export default function App() {
  return (
    <Suspense fallback={<LoadingState className="min-h-screen" />}>
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
          <Route path="records" element={<RoleRoute allow={['patient']}><HealthRecordsPage /></RoleRoute>} />
          {/* Health Records merges the former Health Wallet, Health Background and Timeline pages.
              Keep the old paths working (bookmarks, external links) by redirecting into the hub. */}
          <Route path="documents" element={<Navigate to="/app/records" replace />} />
          <Route path="health-forms" element={<Navigate to="/app/records?tab=background" replace />} />
          <Route path="timeline" element={<Navigate to="/app/records?tab=timeline" replace />} />
          <Route path="consultations" element={<RoleRoute allow={['patient']}><ConsultationsPage /></RoleRoute>} />
          <Route path="sharing" element={<RoleRoute allow={['patient']}><SharingPage /></RoleRoute>} />
          <Route path="pharmacy" element={<RoleRoute allow={['patient']}><PharmacyPage /></RoleRoute>} />
          <Route path="assistant" element={<RoleRoute allow={['patient']}><AssistantPage /></RoleRoute>} />

          {/* Doctor */}
          <Route path="doctor" element={<RoleRoute allow={['doctor']}><DoctorDashboard /></RoleRoute>} />
          <Route path="doctor/patients" element={<RoleRoute allow={['doctor']}><DoctorPatients /></RoleRoute>} />
          <Route path="doctor/patients/:patientId" element={<RoleRoute allow={['doctor']}><PatientRecordsPage /></RoleRoute>} />
          <Route path="doctor/claim-access" element={<RoleRoute allow={['doctor']}><ClaimAccessPage /></RoleRoute>} />
          <Route path="doctor/consultations" element={<RoleRoute allow={['doctor']}><DoctorConsultationsPage /></RoleRoute>} />

          {/* Hospital */}
          <Route path="hospital" element={<RoleRoute allow={['hospital']}><HospitalDashboard /></RoleRoute>} />
          <Route path="hospital/doctors" element={<RoleRoute allow={['hospital']}><DoctorManagement /></RoleRoute>} />
          <Route path="hospital/facility" element={<RoleRoute allow={['hospital']}><FacilityPage /></RoleRoute>} />

          {/* Pharmacy */}
          <Route path="pharmacy-portal" element={<RoleRoute allow={['pharmacy']}><PharmacyDashboard /></RoleRoute>} />
          <Route path="pharmacy-portal/stock" element={<RoleRoute allow={['pharmacy']}><StockManagement /></RoleRoute>} />
          <Route path="pharmacy-portal/facility" element={<RoleRoute allow={['pharmacy']}><PharmacyFacilityPage /></RoleRoute>} />

          {/* Shared */}
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}
