import type { Role } from '@/types'

export interface SignupField {
  name: string
  label: string
  type?: 'text' | 'email' | 'tel' | 'password' | 'select'
  placeholder?: string
  autoComplete?: string
  options?: { label: string; value: string }[]
  half?: boolean // render two-per-row on sm+
  rules: Record<string, unknown>
}

const password: SignupField = {
  name: 'password',
  label: 'Password',
  type: 'password',
  placeholder: 'At least 8 characters',
  autoComplete: 'new-password',
  half: true,
  rules: { required: 'Password is required', minLength: { value: 8, message: 'Min 8 characters' } },
}
const confirm: SignupField = {
  name: 'confirmPassword',
  label: 'Confirm password',
  type: 'password',
  placeholder: 'Re-enter password',
  autoComplete: 'new-password',
  half: true,
  rules: { required: 'Please confirm your password' },
}
const email: SignupField = {
  name: 'email',
  label: 'Email address',
  type: 'email',
  placeholder: 'you@example.com',
  autoComplete: 'email',
  rules: {
    required: 'Email is required',
    pattern: { value: /\S+@\S+\.\S+/, message: 'Enter a valid email' },
  },
}
const phone = (name = 'phone_no', label = 'Phone number'): SignupField => ({
  name,
  label,
  type: 'tel',
  placeholder: '10-digit number',
  autoComplete: 'tel',
  half: true,
  rules: {
    required: 'Phone number is required',
    pattern: { value: /^\d{10,15}$/, message: 'Digits only (10–15)' },
  },
})

export const signupFields: Record<Role, SignupField[]> = {
  patient: [
    { name: 'name', label: 'Full name', placeholder: 'Your full name', autoComplete: 'name', half: true, rules: { required: 'Name is required', minLength: { value: 2, message: 'Too short' } } },
    { name: 'username', label: 'Username', placeholder: 'Choose a username', half: true, rules: { required: 'Username is required', minLength: { value: 3, message: 'Min 3 characters' }, pattern: { value: /^\S+$/, message: 'No spaces' } } },
    email,
    phone(),
    password,
    confirm,
  ],
  doctor: [
    { name: 'name', label: 'Full name', placeholder: 'Dr. Your full name', autoComplete: 'name', half: true, rules: { required: 'Name is required' } },
    { name: 'username', label: 'Username', placeholder: 'Choose a username', half: true, rules: { required: 'Username is required', minLength: { value: 3, message: 'Min 3 characters' } } },
    email,
    phone(),
    { name: 'specialization', label: 'Specialization', placeholder: 'Cardiology', half: true, rules: { required: 'Specialization is required' } },
    { name: 'licenseNo', label: 'Medical license no.', placeholder: 'MCI-XXXXX', half: true, rules: { required: 'License number is required' } },
    password,
    confirm,
  ],
  hospital: [
    { name: 'name', label: 'Facility name', placeholder: 'City Care Hospital', rules: { required: 'Facility name is required' } },
    {
      name: 'type',
      label: 'Facility type',
      type: 'select',
      half: true,
      options: [
        { label: 'Hospital', value: 'hospital' },
        { label: 'Clinic', value: 'clinic' },
        { label: 'Lab', value: 'lab' },
        { label: 'Diagnostic center', value: 'diagnostic_center' },
      ],
      rules: { required: 'Select a type' },
    },
    phone('contactNo', 'Contact number'),
    email,
    { name: 'address', label: 'Address', placeholder: 'Street, city, state', rules: { required: 'Address is required' } },
    { name: 'registrationNo', label: 'Registration no.', placeholder: 'REG-XXXXX', half: true, rules: { required: 'Registration number is required' } },
    password,
    confirm,
  ],
  pharmacy: [
    { name: 'name', label: 'Pharmacy name', placeholder: 'Wellness Pharmacy', rules: { required: 'Pharmacy name is required' } },
    phone('contactNo', 'Contact number'),
    email,
    { name: 'address', label: 'Address', placeholder: 'Street, city, state', rules: { required: 'Address is required' } },
    { name: 'licenseNo', label: 'Drug license no.', placeholder: 'DL-XXXXX', half: true, rules: { required: 'License number is required' } },
    password,
    confirm,
  ],
}

export const roleNeedsLocation = (role: Role) => role === 'hospital' || role === 'pharmacy'

/** Assemble the request body in the exact shape each backend signup endpoint expects. */
export function buildSignupBody(
  role: Role,
  values: Record<string, string>,
  coords: { lat: number; lng: number } | null,
): Record<string, unknown> {
  const geo = coords ? { type: 'Point', coordinates: [coords.lng, coords.lat] } : undefined

  if (role === 'hospital') {
    return {
      name: values.name,
      email: values.email,
      password: values.password,
      contactNo: values.contactNo,
      address: values.address,
      type: values.type,
      verification: { registrationNo: values.registrationNo },
      geoLocation: geo,
    }
  }
  if (role === 'pharmacy') {
    return {
      name: values.name,
      email: values.email,
      password: values.password,
      contactNo: values.contactNo,
      address: values.address,
      verification: { licenseNo: values.licenseNo },
      geoLocation: geo,
    }
  }
  if (role === 'doctor') {
    return {
      name: values.name,
      username: values.username,
      email: values.email,
      password: values.password,
      phone_no: values.phone_no,
      specialization: values.specialization,
      licenseNo: values.licenseNo,
    }
  }
  // patient
  return {
    name: values.name,
    username: values.username,
    email: values.email,
    password: values.password,
    phone_no: values.phone_no,
  }
}
