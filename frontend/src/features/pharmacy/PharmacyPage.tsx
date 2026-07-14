import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Pill, MapPin, Search, Store, IndianRupee, Package, Navigation, PhoneCall } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { ComingSoon } from '@/components/shared/ComingSoon'
import { Card, Button, Badge, SearchBar, EmptyState, Switch, LoadingState } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { medicineApi } from '@/api/medicine'
import type { MedicineSearchResult } from '@/types'

function haversineKm(a: [number, number], b: [number, number]) {
  const R = 6371
  const dLat = ((b[1] - a[1]) * Math.PI) / 180
  const dLng = ((b[0] - a[0]) * Math.PI) / 180
  const lat1 = (a[1] * Math.PI) / 180
  const lat2 = (b[1] * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(h))
}

export default function PharmacyPage() {
  const { user } = useAuth()
  if (user && user.role !== 'patient') return <ComingSoon />

  const toast = useToast()
  const [query, setQuery] = useState('')
  const [useLocation, setUseLocation] = useState(false)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [results, setResults] = useState<MedicineSearchResult[] | null>(null)

  const search = useMutation({
    mutationFn: (params: { medicine: string; lat?: number; lng?: number }) => medicineApi.searchNearby(params),
    onSuccess: (data) => setResults(data),
    onError: () => toast.error('Search failed', 'Please try again in a moment.'),
  })

  const runSearch = (loc?: { lat: number; lng: number } | null) => {
    if (!query.trim()) return
    search.mutate({ medicine: query.trim(), ...(loc ? { lat: loc.lat, lng: loc.lng } : {}) })
  }

  const toggleLocation = (on: boolean) => {
    setUseLocation(on)
    if (on && !coords) {
      if (!navigator.geolocation) return toast.error('Location unavailable')
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const c = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          setCoords(c)
          toast.success('Using your location')
        },
        () => {
          setUseLocation(false)
          toast.error('Location denied', 'Enable location to sort by distance.')
        },
      )
    }
  }

  return (
    <div>
      <PageHeader
        title="Find Medicine"
        description="Search nearby pharmacies for availability and price — no more shop-to-shop hunting."
      />

      <Card padded className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <SearchBar
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onClear={() => setQuery('')}
              onKeyDown={(e) => e.key === 'Enter' && runSearch(useLocation ? coords : null)}
              placeholder="Search by brand or generic name (e.g. Crocin, Paracetamol)"
            />
          </div>
          <Button leftIcon={<Search className="h-4 w-4" />} loading={search.isPending} onClick={() => runSearch(useLocation ? coords : null)}>
            Search
          </Button>
        </div>
        <div className="mt-4 flex items-center gap-3 border-t border-border pt-4">
          <Switch checked={useLocation} onChange={toggleLocation} />
          <div className="flex items-center gap-1.5 text-sm text-foreground">
            <MapPin className="h-4 w-4 text-primary" />
            Sort by distance from my location
          </div>
        </div>
      </Card>

      {search.isPending ? (
        <LoadingState label="Searching nearby pharmacies…" />
      ) : results === null ? (
        <EmptyState
          icon={<Pill className="h-7 w-7" />}
          title="Search for a medicine"
          description="Enter a brand or generic name to see which nearby pharmacies have it in stock, with live pricing."
        />
      ) : results.length === 0 ? (
        <EmptyState
          icon={<Store className="h-7 w-7" />}
          title="No pharmacies found"
          description="No nearby pharmacy currently stocks that medicine. Try a different name or turn off the location filter."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results
            .map((r) => ({
              ...r,
              distance:
                coords && r.pharmacy.geoLocation?.coordinates
                  ? haversineKm([coords.lng, coords.lat], r.pharmacy.geoLocation.coordinates)
                  : null,
            }))
            .map((r, i) => (
              <Card key={`${r.medicine._id}-${r.pharmacy._id}-${i}`} hover className="flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display font-bold text-foreground">{r.medicine.brandName}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.medicine.genericName}
                      {r.medicine.strength ? ` · ${r.medicine.strength}` : ''}
                    </p>
                  </div>
                  <Badge tone={r.quantity > 10 ? 'success' : 'warning'} dot>
                    {r.quantity > 10 ? 'In stock' : 'Low stock'}
                  </Badge>
                </div>

                <div className="mt-4 flex items-baseline gap-1">
                  <IndianRupee className="h-4 w-4 text-primary" />
                  <span className="font-display text-2xl font-extrabold text-foreground">{r.price.toFixed(2)}</span>
                </div>

                <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                  <div className="flex items-center gap-2 text-foreground">
                    <Store className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate font-medium">{r.pharmacy.name}</span>
                    {r.pharmacy.isOpen && <span className="h-1.5 w-1.5 rounded-full bg-success" />}
                  </div>
                  {r.pharmacy.address && (
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                      <span className="line-clamp-2">{r.pharmacy.address}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Package className="h-3.5 w-3.5" /> {r.quantity} units
                    </span>
                    {r.distance != null && (
                      <span className="inline-flex items-center gap-1">
                        <Navigation className="h-3.5 w-3.5" /> {r.distance.toFixed(1)} km away
                      </span>
                    )}
                  </div>
                </div>

                {r.pharmacy.contactNo && (
                  <a href={`tel:${r.pharmacy.contactNo}`} className="mt-4">
                    <Button variant="outline" size="sm" fullWidth leftIcon={<PhoneCall className="h-4 w-4" />}>
                      Call pharmacy
                    </Button>
                  </a>
                )}
              </Card>
            ))}
        </div>
      )}
    </div>
  )
}
