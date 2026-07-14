import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  QrCode,
  Copy,
  Check,
  Share2,
  Phone,
  ShieldCheck,
  Clock,
  History,
  Ban,
  Eye,
  UserCog,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { ComingSoon } from '@/components/shared/ComingSoon'
import {
  Card,
  CardHeader,
  Button,
  Badge,
  Select,
  Input,
  Field,
  EmptyState,
  Modal,
  ConfirmDialog,
  Skeleton,
} from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { accessApi } from '@/api/access'
import { ApiError } from '@/api/client'
import { countdown, timeAgo, titleCase } from '@/lib/format'
import type { AccessGrant, AccessTokenResult } from '@/types'

const DURATIONS = [
  { label: '1 hour', value: '1hour' },
  { label: '6 hours', value: '6hours' },
  { label: '12 hours', value: '12hours' },
  { label: '24 hours', value: '24hours' },
  { label: '3 days', value: '3days' },
  { label: '7 days', value: '7days' },
]

export default function SharingPage() {
  const { user } = useAuth()
  if (user && user.role !== 'patient') return <ComingSoon />

  const toast = useToast()
  const qc = useQueryClient()
  const [duration, setDuration] = useState('24hours')
  const [tokenResult, setTokenResult] = useState<AccessTokenResult | null>(null)
  const [phone, setPhone] = useState('')
  const [phoneDuration, setPhoneDuration] = useState('7days')
  const [copied, setCopied] = useState(false)
  const [revoking, setRevoking] = useState<AccessGrant | null>(null)

  const grants = useQuery({ queryKey: ['access', 'list'], queryFn: accessApi.list })
  const logs = useQuery({ queryKey: ['access', 'logs'], queryFn: accessApi.activityLogs })

  const generate = useMutation({
    mutationFn: () => accessApi.generate({ expiryDuration: duration }),
    onSuccess: (data) => {
      setTokenResult(data)
      toast.success('Access code generated')
    },
    onError: (err) => toast.error('Could not generate', err instanceof ApiError ? err.message : ''),
  })

  const grantByPhone = useMutation({
    mutationFn: () => accessApi.grantByPhone({ doctorPhone: phone, expiryDuration: phoneDuration }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['access'] })
      toast.success('Access granted', 'The doctor can now view your records.')
      setPhone('')
    },
    onError: (err) => toast.error('Could not grant access', err instanceof ApiError ? err.message : ''),
  })

  const revoke = useMutation({
    mutationFn: (g: AccessGrant) => accessApi.revoke({ accessId: g._id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['access'] })
      toast.success('Access revoked')
      setRevoking(null)
    },
    onError: (err) => toast.error('Could not revoke', err instanceof ApiError ? err.message : ''),
  })

  const copyCode = () => {
    if (!tokenResult) return
    navigator.clipboard.writeText(tokenResult.shortCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const activeGrants = (grants.data ?? []).filter((g) => g.isActive)

  const doctorName = (g: AccessGrant) => (typeof g.doctorId === 'object' ? g.doctorId.name : 'Doctor')

  return (
    <div>
      <PageHeader
        title="Access & Sharing"
        description="Grant doctors time-boxed access to your records — by QR, code or phone. Revoke anytime."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Generate QR/code */}
        <Card>
          <CardHeader title="Share via QR or code" subtitle="Show this to a doctor to grant access" icon={<QrCode className="h-5 w-5" />} />
          <div className="px-5 pb-5 sm:px-6 sm:pb-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <Field label="Access duration" className="flex-1">
                <Select options={DURATIONS} value={duration} onChange={(e) => setDuration(e.target.value)} />
              </Field>
              <Button leftIcon={<QrCode className="h-4 w-4" />} loading={generate.isPending} onClick={() => generate.mutate()}>
                Generate
              </Button>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-success" />
              View-only access. Auto-revokes when it expires.
            </p>
          </div>
        </Card>

        {/* Grant by phone */}
        <Card>
          <CardHeader title="Grant by phone number" subtitle="If your doctor is on HealSync" icon={<Phone className="h-5 w-5" />} />
          <div className="px-5 pb-5 sm:px-6 sm:pb-6">
            <div className="space-y-3">
              <Field label="Doctor's phone number">
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit number"
                  leftIcon={<Phone className="h-4.5 w-4.5" />}
                />
              </Field>
              <div className="flex gap-3">
                <Select options={DURATIONS} value={phoneDuration} onChange={(e) => setPhoneDuration(e.target.value)} className="flex-1" />
                <Button loading={grantByPhone.isPending} onClick={() => phone && grantByPhone.mutate()} disabled={!phone}>
                  Grant access
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Active grants */}
      <Card className="mt-6">
        <CardHeader
          title="Who has access"
          subtitle={`${activeGrants.length} active grant${activeGrants.length === 1 ? '' : 's'}`}
          icon={<Share2 className="h-5 w-5" />}
        />
        <div className="px-5 pb-5 sm:px-6 sm:pb-6">
          {grants.isLoading ? (
            <div className="space-y-3">
              {[0, 1].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : activeGrants.length === 0 ? (
            <EmptyState
              icon={<ShieldCheck className="h-7 w-7" />}
              title="No one has access right now"
              description="When you share your records, active grants appear here with a live countdown."
            />
          ) : (
            <ul className="space-y-2.5">
              {activeGrants.map((g) => (
                <li
                  key={g._id}
                  className="flex flex-col gap-3 rounded-xl border border-border bg-surface-2/40 p-3.5 sm:flex-row sm:items-center"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
                    <UserCog className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">{doctorName(g)}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" /> View access
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> {countdown(g.expiresAt)}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Ban className="h-4 w-4" />}
                    className="border-danger/30 text-danger hover:bg-danger-soft/60"
                    onClick={() => setRevoking(g)}
                  >
                    Revoke
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      {/* Activity log */}
      <Card className="mt-6">
        <CardHeader title="Activity log" subtitle="Every access event, for your peace of mind" icon={<History className="h-5 w-5" />} />
        <div className="px-5 pb-5 sm:px-6 sm:pb-6">
          {logs.isLoading ? (
            <Skeleton className="h-24 w-full rounded-xl" />
          ) : (logs.data?.length ?? 0) === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <ol className="relative space-y-4 border-l border-border pl-5">
              {logs.data!.slice(0, 8).map((log) => (
                <li key={log._id} className="relative">
                  <span className="absolute -left-[1.55rem] top-1 h-3 w-3 rounded-full border-2 border-surface bg-primary" />
                  <p className="text-sm font-medium text-foreground">{titleCase(log.action)}</p>
                  <p className="text-xs text-muted-foreground">
                    {log.doctorId?.name ? `${log.doctorId.name} · ` : ''}
                    {timeAgo(log.timestamp)}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </Card>

      {/* QR modal */}
      <Modal
        open={!!tokenResult}
        onClose={() => setTokenResult(null)}
        title="Your access code"
        description="Show the QR or share the 6-digit code with your doctor."
        icon={<QrCode className="h-5 w-5" />}
      >
        {tokenResult && (
          <div className="space-y-5 pb-4">
            <div className="mx-auto w-fit rounded-2xl border border-border bg-white p-4">
              <img src={tokenResult.qrDataUrl} alt="Access QR code" className="h-48 w-48" />
            </div>
            <div className="rounded-xl border border-border bg-surface-2/40 p-4 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Access code</p>
              <div className="mt-1 flex items-center justify-center gap-3">
                <span className="font-display text-3xl font-extrabold tracking-[0.3em] text-primary">
                  {tokenResult.shortCode}
                </span>
                <Button variant="ghost" size="icon" onClick={copyCode}>
                  {copied ? <Check className="h-5 w-5 text-success" /> : <Copy className="h-5 w-5" />}
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {tokenResult.expiresAt ? countdown(tokenResult.expiresAt) : 'Valid until revoked'}
              <Badge tone="success" dot>
                View only
              </Badge>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!revoking}
        onClose={() => setRevoking(null)}
        onConfirm={() => revoking && revoke.mutate(revoking)}
        title="Revoke access?"
        description={`${revoking ? doctorName(revoking) : 'This doctor'} will immediately lose access to your records.`}
        confirmLabel="Revoke access"
        loading={revoke.isPending}
      />
    </div>
  )
}
