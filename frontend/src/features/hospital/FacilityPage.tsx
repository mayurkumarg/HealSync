import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, MapPin, Phone, Mail, BadgeCheck, Star, FileText, Info, LocateFixed } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader, Badge, LoadingState, Field, Input, Select, Switch, Button, Alert } from '@/components/ui'
import { hospitalApi } from '@/api/hospital'
import { ApiError } from '@/api/client'
import { useToast } from '@/context/ToastContext'
import { titleCase } from '@/lib/format'

const FACILITY_TYPES = [
  { label: 'Hospital', value: 'hospital' },
  { label: 'Clinic', value: 'clinic' },
  { label: 'Lab', value: 'lab' },
  { label: 'Diagnostic center', value: 'diagnostic_center' },
]

export default function FacilityPage() {
  const toast = useToast()
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['hospital', 'me'], queryFn: hospitalApi.me })

  const [form, setForm] = useState({ name: '', type: 'hospital', address: '', contactNo: '', isOpen: true })
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (data) {
      setForm({
        name: data.name ?? '',
        type: data.type ?? 'hospital',
        address: data.address ?? '',
        contactNo: data.contactNo ?? '',
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
      hospitalApi.updateProfile({
        name: form.name,
        type: form.type,
        address: form.address,
        contactNo: form.contactNo,
        isOpen: form.isOpen,
        ...(coords ? { geoLocation: { coordinates: [coords.lng, coords.lat] } } : {}),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hospital'] })
      toast.success('Facility details updated')
      setCoords(null)
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not update facility details.'),
  })

  if (isLoading) return <LoadingState label="Loading facility details…" />

  const h = data

  return (
    <div>
      <PageHeader title="Facility" description="Manage your registered facility details on HealSync." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card padded className="lg:col-span-1 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-glow">
            <Building2 className="h-8 w-8" />
          </div>
          <h2 className="mt-4 font-display text-lg font-bold text-foreground">{h?.name}</h2>
          <p className="text-sm capitalize text-muted-foreground">{h?.type}</p>
          <div className="mt-3 flex items-center justify-center gap-2">
            {h?.verified ? (
              <Badge tone="success" icon={<BadgeCheck className="h-3.5 w-3.5" />}>Verified</Badge>
            ) : (
              <Badge tone="warning">Pending verification</Badge>
            )}
            <Badge tone="neutral" dot>{form.isOpen ? 'Open' : 'Closed'}</Badge>
          </div>
          {typeof h?.rating === 'number' && (
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-surface-2/60 px-3 py-1 text-sm">
              <Star className="h-4 w-4 fill-warning text-warning" />
              <span className="font-semibold text-foreground">{h.rating.toFixed(1)}</span>
              <span className="text-muted-foreground">({h.totalRatings ?? 0})</span>
            </div>
          )}
          <div className="mt-6 rounded-xl border border-border bg-surface-2/40 p-4 text-left">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">Registration no.</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{h?.verification?.registrationNo || 'Not on file'}</p>
          </div>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Contact & details" icon={<Info className="h-5 w-5" />} />
            <div className="space-y-4 px-5 pb-5 sm:px-6 sm:pb-6">
              {error && <Alert tone="danger">{error}</Alert>}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name" required>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} leftIcon={<Building2 className="h-4.5 w-4.5" />} />
                </Field>
                <Field label="Type">
                  <Select
                    options={FACILITY_TYPES}
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Email">
                  <Input value={h?.email || ''} readOnly leftIcon={<Mail className="h-4.5 w-4.5" />} />
                </Field>
                <Field label="Contact">
                  <Input value={form.contactNo} onChange={(e) => setForm({ ...form, contactNo: e.target.value })} leftIcon={<Phone className="h-4.5 w-4.5" />} />
                </Field>
              </div>
              <Field label="Address">
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} leftIcon={<MapPin className="h-4.5 w-4.5" />} />
              </Field>
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
                    {coords ? `New: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : 'Used for patient/doctor "nearby" search results.'}
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

          <Alert tone="info" title="Changing your registration number?">
            That resets your verification status to pending — {h?.type ? titleCase(h.type) : 'facility'} details otherwise save immediately.
          </Alert>
        </div>
      </div>
    </div>
  )
}
