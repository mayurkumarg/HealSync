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
  PackageSearch,
  Store,
  CalendarClock,
} from 'lucide-react'
import type { Role } from '@/types'

export interface NavItem {
  label: string
  to: string
  icon: ReactNode
  end?: boolean
}

/** A labelled cluster of nav items. `title` is omitted for the primary/overview group. */
export interface NavSection {
  title?: string
  items: NavItem[]
}

const patientNav: NavSection[] = [
  {
    items: [
      { label: 'Dashboard', to: '/app/dashboard', icon: <LayoutDashboard className="h-[1.15rem] w-[1.15rem]" /> },
    ],
  },
  {
    title: 'My Health',
    items: [
      { label: 'Vitals', to: '/app/vitals', icon: <HeartPulse className="h-[1.15rem] w-[1.15rem]" /> },
      { label: 'Health Records', to: '/app/records', icon: <FolderHeart className="h-[1.15rem] w-[1.15rem]" /> },
      { label: 'Reminders', to: '/app/reminders', icon: <BellRing className="h-[1.15rem] w-[1.15rem]" /> },
    ],
  },
  {
    title: 'Care',
    items: [
      { label: 'Consultations', to: '/app/consultations', icon: <CalendarClock className="h-[1.15rem] w-[1.15rem]" /> },
      { label: 'Access & Sharing', to: '/app/sharing', icon: <Share2 className="h-[1.15rem] w-[1.15rem]" /> },
    ],
  },
  {
    title: 'Tools',
    items: [
      { label: 'Find Medicine', to: '/app/pharmacy', icon: <Pill className="h-[1.15rem] w-[1.15rem]" /> },
      { label: 'AI Assistant', to: '/app/assistant', icon: <Sparkles className="h-[1.15rem] w-[1.15rem]" /> },
    ],
  },
]

const doctorNav: NavSection[] = [
  {
    items: [
      { label: 'Dashboard', to: '/app/doctor', icon: <LayoutDashboard className="h-[1.15rem] w-[1.15rem]" />, end: true },
      { label: 'My Patients', to: '/app/doctor/patients', icon: <Users className="h-[1.15rem] w-[1.15rem]" /> },
      { label: 'Consultations', to: '/app/doctor/consultations', icon: <CalendarClock className="h-[1.15rem] w-[1.15rem]" /> },
      { label: 'Profile', to: '/app/profile', icon: <UserCog className="h-[1.15rem] w-[1.15rem]" /> },
    ],
  },
]

const hospitalNav: NavSection[] = [
  {
    items: [
      { label: 'Dashboard', to: '/app/hospital', icon: <LayoutDashboard className="h-[1.15rem] w-[1.15rem]" />, end: true },
      { label: 'Doctors', to: '/app/hospital/doctors', icon: <Stethoscope className="h-[1.15rem] w-[1.15rem]" /> },
      { label: 'Facility', to: '/app/hospital/facility', icon: <Building2 className="h-[1.15rem] w-[1.15rem]" /> },
      { label: 'Profile', to: '/app/profile', icon: <UserCog className="h-[1.15rem] w-[1.15rem]" /> },
    ],
  },
]

const pharmacyNav: NavSection[] = [
  {
    items: [
      { label: 'Dashboard', to: '/app/pharmacy-portal', icon: <LayoutDashboard className="h-[1.15rem] w-[1.15rem]" />, end: true },
      { label: 'Stock', to: '/app/pharmacy-portal/stock', icon: <PackageSearch className="h-[1.15rem] w-[1.15rem]" /> },
      { label: 'Facility', to: '/app/pharmacy-portal/facility', icon: <Store className="h-[1.15rem] w-[1.15rem]" /> },
      { label: 'Profile', to: '/app/profile', icon: <UserCog className="h-[1.15rem] w-[1.15rem]" /> },
    ],
  },
]

const minimalNav: NavSection[] = [
  {
    items: [
      { label: 'Dashboard', to: '/app/dashboard', icon: <LayoutDashboard className="h-[1.15rem] w-[1.15rem]" /> },
      { label: 'Profile', to: '/app/profile', icon: <UserCog className="h-[1.15rem] w-[1.15rem]" /> },
    ],
  },
]

export function navForRole(role: Role): NavSection[] {
  if (role === 'patient') return patientNav
  if (role === 'doctor') return doctorNav
  if (role === 'hospital') return hospitalNav
  if (role === 'pharmacy') return pharmacyNav
  return minimalNav
}

/** Where each role lands after login / on hitting /app. */
export function roleHome(role: Role): string {
  if (role === 'doctor') return '/app/doctor'
  if (role === 'hospital') return '/app/hospital'
  if (role === 'pharmacy') return '/app/pharmacy-portal'
  return '/app/dashboard'
}

export const ROLE_LABEL: Record<Role, string> = {
  patient: 'Patient',
  doctor: 'Doctor',
  hospital: 'Hospital',
  pharmacy: 'Pharmacy',
}
