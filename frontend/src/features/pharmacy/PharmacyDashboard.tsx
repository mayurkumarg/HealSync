import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  IndianRupee,
  PackageSearch,
  AlertTriangle,
  CalendarClock,
  ArrowRight,
  Store,
  PackagePlus,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { Card, CardHeader, Button, Badge, Skeleton, EmptyState, Alert } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { pharmacyApi } from '@/api/pharmacy'
import { currency, formatDate } from '@/lib/format'
import type { Medicine } from '@/types'

function medicineLabel(m: string | Medicine | undefined) {
  if (!m) return 'Unknown medicine'
  if (typeof m === 'string') return m
  return m.brandName || m.genericName
}

export default function PharmacyDashboard() {
  const { user } = useAuth()

  const stats = useQuery({ queryKey: ['pharmacy', 'stats'], queryFn: pharmacyApi.stats })
  const profile = useQuery({ queryKey: ['pharmacy', 'me'], queryFn: pharmacyApi.me })
  const lowStock = useQuery({ queryKey: ['pharmacy', 'stock', 'low'], queryFn: pharmacyApi.lowStock })
  const expiring = useQuery({ queryKey: ['pharmacy', 'stock', 'expiry'], queryFn: pharmacyApi.expiryAlert })
  const anyError = stats.isError || profile.isError || lowStock.isError || expiring.isError

  const s = stats.data
  const value = s?.totalValuePerPharmacy?.[0]
  const distinct = s?.distinctMedicinesPerPharmacy?.[0]
  const lowOut = s?.lowOutCountsPerPharmacy?.[0]
  const expiry = s?.expiringAndExpired?.[0]

  return (
    <div>
      <PageHeader
        title={user?.name || 'Pharmacy'}
        description="Your stock overview and inventory health at a glance."
        action={
          <Link to="/app/pharmacy-portal/stock">
            <Button leftIcon={<PackagePlus className="h-4 w-4" />}>Manage stock</Button>
          </Link>
        }
      />

      {anyError && (
        <Alert tone="danger" title="Some data couldn't load" className="mb-6">
          Part of your dashboard failed to load. Try refreshing the page.
        </Alert>
      )}

      {stats.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Inventory value"
            value={currency(value?.totalValue ?? 0)}
            icon={<IndianRupee className="h-5 w-5" />}
            tone="primary"
            hint={`${value?.itemCount ?? 0} stock entries`}
          />
          <StatCard
            label="Distinct medicines"
            value={distinct?.distinctCount ?? 0}
            icon={<PackageSearch className="h-5 w-5" />}
            tone="accent"
            hint="In your catalog"
          />
          <StatCard
            label="Low / out of stock"
            value={(lowOut?.lowCount ?? 0) + (lowOut?.outOfStockCount ?? 0)}
            icon={<AlertTriangle className="h-5 w-5" />}
            tone="warning"
            hint="Needs restocking"
          />
          <StatCard
            label="Expiring soon"
            value={expiry?.expiringSoonBatches?.length ?? 0}
            icon={<CalendarClock className="h-5 w-5" />}
            tone="danger"
            hint="Within 30 days"
          />
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Low stock */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Low stock alerts"
            subtitle="Medicines running low or already out"
            icon={<AlertTriangle className="h-5 w-5" />}
            action={
              <Link to="/app/pharmacy-portal/stock">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Manage
                </Button>
              </Link>
            }
          />
          <div className="px-5 pb-5 sm:px-6 sm:pb-6">
            {lowStock.isLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-lg" />
                ))}
              </div>
            ) : (lowStock.data ?? []).length === 0 ? (
              <EmptyState
                icon={<PackageSearch className="h-7 w-7" />}
                title="All stocked up"
                description="No medicines are currently low or out of stock."
              />
            ) : (
              <ul className="divide-y divide-border">
                {(lowStock.data ?? []).slice(0, 6).map((item) => (
                  <li key={item._id} className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{medicineLabel(item.medicineId)}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <Badge tone={item.status === 'out_of_stock' ? 'danger' : 'warning'}>
                      {item.status === 'out_of_stock' ? 'Out of stock' : 'Low'}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        {/* Facility summary */}
        <Card padded>
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary">
              <Store className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate font-display text-base font-bold text-foreground">
                {profile.data?.name || 'Pharmacy'}
              </h3>
              <p className="text-xs text-muted-foreground">{profile.data?.isOpen ? 'Open now' : 'Closed'}</p>
            </div>
          </div>
          <dl className="mt-5 space-y-3 text-sm">
            <Row label="Contact" value={profile.data?.contactNo || '—'} />
            <Row label="License" value={profile.data?.verification?.licenseNo || '—'} />
            <Row label="Status" value={profile.data?.verified ? 'Verified' : 'Pending'} />
          </dl>
          <Link to="/app/pharmacy-portal/facility" className="mt-5 block">
            <Button variant="outline" fullWidth rightIcon={<ArrowRight className="h-4 w-4" />}>
              Facility details
            </Button>
          </Link>
        </Card>
      </div>

      {(expiring.data ?? []).length > 0 && (
        <Card className="mt-6">
          <CardHeader
            title="Expiring batches"
            subtitle="Within the next 30 days"
            icon={<CalendarClock className="h-5 w-5" />}
          />
          <div className="px-5 pb-5 sm:px-6 sm:pb-6">
            <ul className="divide-y divide-border">
              {(expiring.data ?? []).slice(0, 6).map((item) => (
                <li key={item._id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{medicineLabel(item.medicineId)}</p>
                    <p className="text-xs text-muted-foreground">Batch: {item.batchNo || '—'} · Qty: {item.quantity}</p>
                  </div>
                  <Badge tone="warning">{formatDate(item.expiryDate)}</Badge>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium text-foreground">{value}</dd>
    </div>
  )
}
