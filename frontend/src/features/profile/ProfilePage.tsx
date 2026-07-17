import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Mail,
  Phone,
  AtSign,
  IdCard,
  Palette,
  Bell,
  ShieldCheck,
  LogOut,
  Moon,
  Sun,
  Fingerprint,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader, Avatar, Badge, Switch, Button, Field, Input, Alert } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { useToast } from '@/context/ToastContext'
import { userApi } from '@/api/user'
import { ApiError } from '@/api/client'
import { ROLE_LABEL } from '@/routes/nav'

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const toast = useToast()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const isPatient = user?.role === 'patient'

  const profile = useQuery({ queryKey: ['user', 'me'], queryFn: userApi.me, enabled: isPatient })

  const [account, setAccount] = useState({ name: '', phone_no: '' })
  const [prefs, setPrefs] = useState({ email: true, push: true, sms: false })

  useEffect(() => {
    if (profile.data) {
      setAccount({ name: profile.data.name ?? '', phone_no: profile.data.phone_no ?? '' })
      setPrefs({
        email: profile.data.notificationPrefs?.email ?? true,
        push: profile.data.notificationPrefs?.push ?? true,
        sms: profile.data.notificationPrefs?.sms ?? false,
      })
    }
  }, [profile.data])

  const saveAccount = useMutation({
    mutationFn: () => userApi.updateProfile({ name: account.name, phone_no: account.phone_no }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user', 'me'] })
      toast.success('Account details updated')
    },
    onError: (err) => toast.error('Could not save', err instanceof ApiError ? err.message : 'Please try again.'),
  })

  const savePrefs = useMutation({
    mutationFn: () => userApi.updateProfile({ notificationPrefs: prefs }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user', 'me'] })
      toast.success('Preferences saved')
    },
    onError: (err) => toast.error('Could not save', err instanceof ApiError ? err.message : 'Please try again.'),
  })

  if (!user) return null

  return (
    <div>
      <PageHeader title="Profile & Settings" description="Manage your account, appearance and notifications." />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Identity */}
        <div className="lg:col-span-1">
          <Card padded className="text-center">
            <Avatar name={user.name || user.email} size="lg" className="mx-auto" />
            <h2 className="mt-4 font-display text-lg font-bold text-foreground">{user.name || 'Your account'}</h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <Badge tone="primary" className="mt-3">
              {ROLE_LABEL[user.role]}
            </Badge>
            <div className="mt-6 rounded-xl border border-border bg-surface-2/40 p-4 text-left">
              <div className="flex items-center gap-2 text-sm">
                <Fingerprint className="h-4 w-4 text-success" />
                <span className="font-medium text-foreground">Encrypted account</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Your data is protected with AES-256 encryption and permission-based access.
              </p>
            </div>
          </Card>
        </div>

        {/* Settings */}
        <div className="space-y-6 lg:col-span-2">
          {/* Account details */}
          <Card>
            <CardHeader title="Account details" subtitle="Your personal information" icon={<IdCard className="h-5 w-5" />} />
            <div className="grid gap-4 px-5 pb-5 sm:grid-cols-2 sm:px-6 sm:pb-6">
              <Field label="Full name">
                {isPatient ? (
                  <Input value={account.name} onChange={(e) => setAccount({ ...account, name: e.target.value })} leftIcon={<IdCard className="h-4.5 w-4.5" />} />
                ) : (
                  <Input value={user.name || ''} readOnly leftIcon={<IdCard className="h-4.5 w-4.5" />} />
                )}
              </Field>
              <Field label="Username">
                <Input value={user.username || '—'} readOnly leftIcon={<AtSign className="h-4.5 w-4.5" />} />
              </Field>
              <Field label="Email">
                <Input value={user.email || ''} readOnly leftIcon={<Mail className="h-4.5 w-4.5" />} />
              </Field>
              <Field label="Phone">
                {isPatient ? (
                  <Input value={account.phone_no} onChange={(e) => setAccount({ ...account, phone_no: e.target.value })} leftIcon={<Phone className="h-4.5 w-4.5" />} />
                ) : (
                  <Input value={user.phone_no || '—'} readOnly leftIcon={<Phone className="h-4.5 w-4.5" />} />
                )}
              </Field>
            </div>
            {isPatient && (
              <div className="flex justify-end px-5 pb-5 sm:px-6 sm:pb-6">
                <Button size="sm" loading={saveAccount.isPending} onClick={() => saveAccount.mutate()}>
                  Save changes
                </Button>
              </div>
            )}
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader title="Appearance" subtitle="Choose how HealSync looks" icon={<Palette className="h-5 w-5" />} />
            <div className="px-5 pb-5 sm:px-6 sm:pb-6">
              <div className="grid grid-cols-2 gap-3">
                <ThemeCard active={theme === 'light'} onClick={() => setTheme('light')} icon={<Sun className="h-5 w-5" />} label="Light" />
                <ThemeCard active={theme === 'dark'} onClick={() => setTheme('dark')} icon={<Moon className="h-5 w-5" />} label="Dark" />
              </div>
            </div>
          </Card>

          {/* Notifications */}
          {isPatient ? (
            <Card>
              <CardHeader title="Notifications" subtitle="How you'd like to be reminded" icon={<Bell className="h-5 w-5" />} />
              <div className="divide-y divide-border px-5 pb-2 sm:px-6">
                <PrefRow
                  label="Email notifications"
                  desc="Reminders and health updates by email"
                  checked={prefs.email}
                  onChange={(v) => setPrefs({ ...prefs, email: v })}
                />
                <PrefRow
                  label="Push notifications"
                  desc="Real-time alerts in the app"
                  checked={prefs.push}
                  onChange={(v) => setPrefs({ ...prefs, push: v })}
                />
                <PrefRow
                  label="SMS notifications"
                  desc="Critical reminders via text message"
                  checked={prefs.sms}
                  onChange={(v) => setPrefs({ ...prefs, sms: v })}
                  disabled
                  badge="Coming soon"
                />
              </div>
              <div className="px-5 py-4 sm:px-6">
                <Button size="sm" loading={savePrefs.isPending} onClick={() => savePrefs.mutate()}>
                  Save preferences
                </Button>
              </div>
            </Card>
          ) : (
            <Card>
              <CardHeader title="Notifications" subtitle="How you'd like to be reminded" icon={<Bell className="h-5 w-5" />} />
              <div className="px-5 pb-5 sm:px-6 sm:pb-6">
                <Alert tone="info">Notification preferences for provider accounts are coming in a future update.</Alert>
              </div>
            </Card>
          )}

          {/* Security */}
          <Card>
            <CardHeader title="Security" subtitle="Keep your account safe" icon={<ShieldCheck className="h-5 w-5" />} />
            <div className="flex flex-col gap-3 px-5 pb-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:pb-6">
              <div>
                <p className="text-sm font-medium text-foreground">Password</p>
                <p className="text-xs text-muted-foreground">Change your password via a secure email link.</p>
              </div>
              <Button variant="outline" onClick={() => navigate('/forgot-password')}>
                Change password
              </Button>
            </div>
          </Card>

          {/* Sign out */}
          <Card padded className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-medium text-foreground">Sign out</p>
              <p className="text-xs text-muted-foreground">You'll need to sign in again to access your workspace.</p>
            </div>
            <Button
              variant="outline"
              leftIcon={<LogOut className="h-4 w-4" />}
              className="border-danger/30 text-danger hover:bg-danger-soft/60"
              onClick={() => {
                logout()
                navigate('/login')
              }}
            >
              Sign out
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}

function ThemeCard({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl border p-4 transition-all ${
        active ? 'border-primary bg-primary-soft text-primary shadow-soft' : 'border-border text-muted-foreground hover:border-primary/40'
      }`}
    >
      <span className={`grid h-10 w-10 place-items-center rounded-lg ${active ? 'bg-primary text-primary-foreground' : 'bg-surface-2'}`}>
        {icon}
      </span>
      <span className="font-medium">{label}</span>
    </button>
  )
}

function PrefRow({
  label,
  desc,
  checked,
  onChange,
  disabled,
  badge,
}: {
  label: string
  desc: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
  badge?: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground">{label}</p>
          {badge && <Badge tone="neutral">{badge}</Badge>}
        </div>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  )
}
