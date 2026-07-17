import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Store,
  MapPin,
  Phone,
  Mail,
  BadgeCheck,
  Star,
  FileText,
  Clock,
  Info,
  LocateFixed,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader, Badge, LoadingState, Field, Input, Switch, Button, Alert } from '@/components/ui'
import { pharmacyApi } from '@/api/pharmacy'
import { ApiError } from '@/api/client'
import { useToast } from '@/context/ToastContext'

export default function PharmacyFacilityPage() {
  const toast = useToast()
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['pharmacy', 'me'], queryFn: pharmacyApi.me })

  const [form, setForm] = useState({
    name: '',
    address: '',
    contactNo: '',
    open: '09:00',
    close: '21:00',
    isOpen: true,
  })
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (data) {
      setForm({
        name: data.name ?? '',
        address: data.address ?? '',
        contactNo: data.contactNo ?? '',
        open: data.openingHours?.open ?? '09:00',
        close: data.openingHours?.close ?? '21:00',
        isOpen: data.isOpen ?? true,
      })
    }
  }, [data])

  const detectLocation = () => {
    if (!navigator.geolocation) return toast.error('Location unavailable', 'Your browser does not support geolocation.')
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocating(false)
        toast.success('Location captured', 'Save changes to update your facility location.')
      },
      () => {
        setLocating(false)
        toast.error('Could not get location', 'Check your browser location permissions.')
      },
    )
  }

  const save = useMutation({
    mutationFn: () =>
      pharmacyApi.updateProfile({
        name: form.name,
        address: form.address,
        contactNo: form.contactNo,
        isOpen: form.isOpen,
        openingHours: { open: form.open, close: form.close },
        ...(coords ? { geoLocation: { coordinates: [coords.lng, coords.lat] } } : {}),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pharmacy'] })
      toast.success('Facility details updated')
      setCoords(null)
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not update facility details.'),
  })

  if (isLoading) return <LoadingState label="Loading facility details…" />

  const p = data

  return (
    <div>
      <PageHeader title="Facility" description="Manage your registered facility details on HealSync." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card padded className="lg:col-span-1 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-glow">
            <Store className="h-8 w-8" />
          </div>
          <h2 className="mt-4 font-display text-lg font-bold text-foreground">{p?.name}</h2>
          <div className="mt-3 flex items-center justify-center gap-2">
            {p?.verified ? (
              <Badge tone="success" icon={<BadgeCheck className="h-3.5 w-3.5" />}>Email verified</Badge>
            ) : (
              <Badge tone="warning">Unverified</Badge>
            )}
            <Badge tone="neutral" dot>{form.isOpen ? 'Open' : 'Closed'}</Badge>
          </div>
          {typeof p?.rating === 'number' && (
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-surface-2/60 px-3 py-1 text-sm">
              <Star className="h-4 w-4 fill-warning text-warning" />
              <span className="font-semibold text-foreground">{p.rating.toFixed(1)}</span>
              <span className="text-muted-foreground">({p.totalRatings ?? 0})</span>
            </div>
          )}
          <div className="mt-6 rounded-xl border border-border bg-surface-2/40 p-4 text-left">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">License</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{p?.verification?.licenseNo || 'Not on file'}</p>
          </div>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Contact & details" icon={<Info className="h-5 w-5" />} />
            <div className="space-y-4 px-5 pb-5 sm:px-6 sm:pb-6">
              {error && <Alert tone="danger">{error}</Alert>}
              <Field label="Name" required>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} leftIcon={<Store className="h-4.5 w-4.5" />} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Email">
                  <Input value={p?.email || ''} readOnly leftIcon={<Mail className="h-4.5 w-4.5" />} />
                </Field>
                <Field label="Contact">
                  <Input value={form.contactNo} onChange={(e) => setForm({ ...form, contactNo: e.target.value })} leftIcon={<Phone className="h-4.5 w-4.5" />} />
                </Field>
              </div>
              <Field label="Address">
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} leftIcon={<MapPin className="h-4.5 w-4.5" />} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Opens at">
                  <Input type="time" value={form.open} onChange={(e) => setForm({ ...form, open: e.target.value })} leftIcon={<Clock className="h-4.5 w-4.5" />} />
                </Field>
                <Field label="Closes at">
                  <Input type="time" value={form.close} onChange={(e) => setForm({ ...form, close: e.target.value })} leftIcon={<Clock className="h-4.5 w-4.5" />} />
                </Field>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border bg-surface-2/40 p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Currently open</p>
                  <p className="text-xs text-muted-foreground">Toggle off if temporarily closed.</p>
                </div>
                <Switch checked={form.isOpen} onChange={(v) => setForm({ ...form, isOpen: v })} />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border bg-surface-2/40 p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Facility location</p>
                  <p className="text-xs text-muted-foreground">
                    {coords ? `New: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : 'Used for "nearby pharmacy" search results.'}
                  </p>
                </div>
                <Button variant="outline" size="sm" leftIcon={<LocateFixed className="h-4 w-4" />} loading={locating} onClick={detectLocation}>
                  Use current location
                </Button>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => { setError(null); save.mutate() }} loading={save.isPending}>
                  Save changes
                </Button>
              </div>
            </div>
          </Card>

          <Alert tone="info" title="Changing your license or GST number?">
            Update those from a future dedicated verification flow — changing them resets your verification status to pending.
          </Alert>
        </div>
      </div>
    </div>
  )
}
