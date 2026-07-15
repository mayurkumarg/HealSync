// Shared domain types mirroring the HealSync backend models.

export type Role = 'patient' | 'doctor' | 'hospital' | 'pharmacy'

export interface AuthUser {
  id: string
  name?: string
  email?: string
  username?: string
  phone_no?: string
  abhaId?: string | null
  role: Role
}

// ---- Reminders ----
export type ReminderType =
  | 'appointment'
  | 'prescription'
  | 'report'
  | 'medication'
  | 'lab-test'
  | 'follow-up'
  | 'other'

export type ReminderStatus = 'pending' | 'sent' | 'completed' | 'dismissed' | 'expired'
export type Priority = 'low' | 'medium' | 'high' | 'critical'

export interface Reminder {
  _id: string
  title: string
  description?: string
  reminderType: ReminderType
  reminderDateTime: string
  notificationTime?: string
  customNotificationMinutes?: number
  status: ReminderStatus
  priority: Priority
  location?: string
  notes?: string
  notificationChannels?: {
    email?: boolean
    sms?: boolean
    pushNotification?: boolean
    inApp?: boolean
  }
  recurringPattern?: { isRecurring?: boolean; frequency?: string }
  createdAt?: string
}

export interface ReminderStats {
  total?: number
  pending?: number
  completed?: number
  upcoming?: number
  [k: string]: number | undefined
}

// ---- Vitals ----
export interface BpReading {
  _id: string
  systolic: number
  diastolic: number
  pulse?: number | null
  category: string
  status: string
  recordedAt: string
}

export interface SugarReading {
  _id: string
  level: number
  type: 'fasting' | 'random' | 'post-meal'
  status: string
  recordedAt: string
}

export interface Medication {
  drugName?: string | null
  dosage?: string | null
  tabletsPerDay?: number | null
  stockAvailable?: number | null
  todaysIntake?: number
}

export interface BpProfile extends Medication {
  _id?: string
  userId?: string
  recentSuggestion?: string | null
  readings: BpReading[]
}

export interface SugarProfile extends Medication {
  _id?: string
  userId?: string
  recentSuggestion?: string | null
  readings: SugarReading[]
}

// ---- Documents ----
export type DocumentType =
  | 'prescription'
  | 'lab_report'
  | 'diagnostic_report'
  | 'imaging_report'
  | 'discharge_summary'
  | 'medical_certificate'
  | 'hospital_bill'
  | 'other_medical_document'

export interface MedicalDocument {
  _id: string
  type: DocumentType
  fileName?: string
  fileUrl?: string
  fileType?: string
  description?: string
  uploadedAt?: string
  status?: string
  ocr?: { text?: string }
  nlp?: { summary?: string; entities?: unknown }
}

// ---- Access control ----
export interface AccessTokenResult {
  shortCode: string
  token: string
  expiresAt: string | null
  expiryDuration: string
  url: string
  qrDataUrl: string
  accessType: string
}

export interface AccessGrant {
  _id: string
  patientId: string | { _id: string; name?: string; email?: string }
  doctorId: string | { _id: string; name?: string; email?: string; specialization?: string }
  accessType: string
  expiryDuration: string
  expiresAt: string | null
  isActive: boolean
  reason?: string | null
  createdAt?: string
}

export interface ActivityLog {
  _id: string
  action: string
  doctorId?: { name?: string; email?: string; specialization?: string }
  details?: { resourceType?: string; ipAddress?: string }
  timestamp: string
}

// ---- Medicine search ----
export interface MedicineSearchResult {
  medicine: {
    _id: string
    brandName: string
    genericName: string
    manufacturer?: string
    dosageForm?: string
    strength?: string
  }
  pharmacy: {
    _id: string
    name: string
    address?: string
    contactNo?: string
    geoLocation?: { coordinates: [number, number] }
    isOpen?: boolean
    rating?: number
  }
  price: number
  quantity: number
  expiryDate: string
}

// ---- Chat ----
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: number
  pending?: boolean
}

// ---- Provider: Doctor & Hospital ----
export type VerificationStatus = 'pending' | 'verified' | 'rejected'

export interface Doctor {
  _id: string
  name: string
  username: string
  email: string
  phone_no: string
  hospitalId?: string | null
  specialization?: string | null
  licenseNo?: string
  experienceYears?: number
  verified: boolean
  verification?: {
    status: VerificationStatus
    verifiedAt?: string | null
    document?: string
  }
  createdAt?: string
}

export interface Hospital {
  _id: string
  name: string
  type: 'hospital' | 'clinic' | 'lab' | 'diagnostic_center'
  address?: string
  contactNo?: string
  email: string
  geoLocation?: { type: string; coordinates: [number, number] }
  verification?: { registrationNo?: string; status?: VerificationStatus }
  servicesOffered?: string[]
  verified: boolean
  isOpen?: boolean
  rating?: number
  totalRatings?: number
  createdAt?: string
}

export interface DoctorStats {
  totalDoctors: number
  verifiedDoctors: number
  pendingDoctors: number
  rejectedDoctors: number
  specializations: { _id: string | null; count: number }[]
}

/** A patient a doctor has access to — a PatientAccess row with populated patient. */
export interface AccessiblePatient {
  _id: string // PatientAccess id
  patientId: { _id: string; name?: string; email?: string; phone_no?: string }
  doctorId: string
  accessType: string
  expiryDuration: string
  expiresAt: string | null
  isActive: boolean
  reason?: string | null
  createdAt?: string
}

/** Full patient records bundle returned to a doctor with access. */
export interface PatientRecords {
  patient: {
    _id: string
    name?: string
    email?: string
    phone_no?: string
    abhaId?: string | null
    createdAt?: string
  }
  healthForms: {
    _id: string
    category: string
    data?: unknown
    description?: string
    createdAt?: string
    createdBy?: { name?: string; email?: string }
  }[]
  documents: MedicalDocument[]
  bpData: BpProfile | null
  sugarData: SugarProfile | null
  reminders: Reminder[]
  accessInfo: {
    accessType: string
    expiresAt: string | null
    grantedAt?: string
    canView: boolean
    canUpload: boolean
    canEdit: boolean
    canDelete: boolean
  }
}
