import { User, Stethoscope, Building2, Pill } from 'lucide-react'
import type { Role } from '@/types'
import { cn } from '@/lib/cn'

const roles: { value: Role; label: string; icon: React.ReactNode }[] = [
  { value: 'patient', label: 'Patient', icon: <User className="h-4 w-4" /> },
  { value: 'doctor', label: 'Doctor', icon: <Stethoscope className="h-4 w-4" /> },
  { value: 'hospital', label: 'Hospital', icon: <Building2 className="h-4 w-4" /> },
  { value: 'pharmacy', label: 'Pharmacy', icon: <Pill className="h-4 w-4" /> },
]

export function RoleSelector({ value, onChange }: { value: Role; onChange: (r: Role) => void }) {
  return (
    <div className="mb-6">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">I am a</p>
      <div className="grid grid-cols-4 gap-2">
        {roles.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => onChange(r.value)}
            className={cn(
              'flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-medium transition-all duration-200',
              value === r.value
                ? 'border-primary bg-primary-soft text-primary shadow-soft'
                : 'border-border bg-surface text-muted-foreground hover:border-primary/40 hover:text-foreground',
            )}
          >
            {r.icon}
            {r.label}
          </button>
        ))}
      </div>
    </div>
  )
}
