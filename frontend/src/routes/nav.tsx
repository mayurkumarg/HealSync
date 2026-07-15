import type { ReactNode } from 'react'
import {
  LayoutDashboard,
  HeartPulse,
  BellRing,
  FolderHeart,
  Share2,
  Pill,
  Sparkles,
  UserCog,
  Users,
  Stethoscope,
  Building2,
} from 'lucide-react'
import type { Role } from '@/types'

export interface NavItem {
  label: string
  to: string
  icon: ReactNode
  end?: boolean
}

const patientNav: NavItem[] = [
  { label: 'Dashboard', to: '/app/dashboard', icon: <LayoutDashboard className="h-[1.15rem] w-[1.15rem]" /> },
  { label: 'Vitals', to: '/app/vitals', icon: <HeartPulse className="h-[1.15rem] w-[1.15rem]" /> },
  { label: 'Reminders', to: '/app/reminders', icon: <BellRing className="h-[1.15rem] w-[1.15rem]" /> },
  { label: 'Health Wallet', to: '/app/documents', icon: <FolderHeart className="h-[1.15rem] w-[1.15rem]" /> },
  { label: 'Access & Sharing', to: '/app/sharing', icon: <Share2 className="h-[1.15rem] w-[1.15rem]" /> },
  { label: 'Find Medicine', to: '/app/pharmacy', icon: <Pill className="h-[1.15rem] w-[1.15rem]" /> },
  { label: 'AI Assistant', to: '/app/assistant', icon: <Sparkles className="h-[1.15rem] w-[1.15rem]" /> },
  { label: 'Profile', to: '/app/profile', icon: <UserCog className="h-[1.15rem] w-[1.15rem]" /> },
]

const doctorNav: NavItem[] = [
  { label: 'Dashboard', to: '/app/doctor', icon: <LayoutDashboard className="h-[1.15rem] w-[1.15rem]" />, end: true },
  { label: 'My Patients', to: '/app/doctor/patients', icon: <Users className="h-[1.15rem] w-[1.15rem]" /> },
  { label: 'Profile', to: '/app/profile', icon: <UserCog className="h-[1.15rem] w-[1.15rem]" /> },
]

const hospitalNav: NavItem[] = [
  { label: 'Dashboard', to: '/app/hospital', icon: <LayoutDashboard className="h-[1.15rem] w-[1.15rem]" />, end: true },
  { label: 'Doctors', to: '/app/hospital/doctors', icon: <Stethoscope className="h-[1.15rem] w-[1.15rem]" /> },
  { label: 'Facility', to: '/app/hospital/facility', icon: <Building2 className="h-[1.15rem] w-[1.15rem]" /> },
  { label: 'Profile', to: '/app/profile', icon: <UserCog className="h-[1.15rem] w-[1.15rem]" /> },
]

const minimalNav: NavItem[] = [
  { label: 'Dashboard', to: '/app/dashboard', icon: <LayoutDashboard className="h-[1.15rem] w-[1.15rem]" /> },
  { label: 'Profile', to: '/app/profile', icon: <UserCog className="h-[1.15rem] w-[1.15rem]" /> },
]

export function navForRole(role: Role): NavItem[] {
  if (role === 'patient') return patientNav
  if (role === 'doctor') return doctorNav
  if (role === 'hospital') return hospitalNav
  return minimalNav
}

/** Where each role lands after login / on hitting /app. */
export function roleHome(role: Role): string {
  if (role === 'doctor') return '/app/doctor'
  if (role === 'hospital') return '/app/hospital'
  return '/app/dashboard'
}

export const ROLE_LABEL: Record<Role, string> = {
  patient: 'Patient',
  doctor: 'Doctor',
  hospital: 'Hospital',
  pharmacy: 'Pharmacy',
}
