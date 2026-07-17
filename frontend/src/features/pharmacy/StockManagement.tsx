import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PackagePlus, Pencil, Trash2, PackageSearch, CalendarClock } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Card,
  Button,
  Badge,
  SearchBar,
  EmptyState,
  Skeleton,
  ConfirmDialog,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
  Tooltip,
  Pagination,
} from '@/components/ui'
import { useToast } from '@/context/ToastContext'
import { pharmacyApi } from '@/api/pharmacy'
import { AddStockDrawer } from './AddStockDrawer'
import { EditStockDrawer } from './EditStockDrawer'
import type { Medicine, PharmacyStock } from '@/types'
import { currency, formatDate } from '@/lib/format'

function medicineName(m: string | Medicine | undefined) {
  if (!m) return 'Unknown medicine'
  return typeof m === 'string' ? m : m.brandName
}

function medicineDetail(m: string | Medicine | undefined) {
  if (!m || typeof m === 'string') return ''
  return [m.genericName, m.strength, m.dosageForm].filter(Boolean).join(' · ')
}

const STATUS_TONE: Record<PharmacyStock['status'], 'success' | 'warning' | 'danger'> = {
  available: 'success',
  low: 'warning',
  out_of_stock: 'danger',
}

const STATUS_LABEL: Record<PharmacyStock['status'], string> = {
  available: 'Available',
  low: 'Low',
  out_of_stock: 'Out of stock',
}

export default function StockManagement() {
  const toast = useToast()
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<PharmacyStock | null>(null)
  const [toDelete, setToDelete] = useState<PharmacyStock | null>(null)

  const searching = q.trim().length > 0

  const list = useQuery({
    queryKey: ['pharmacy', 'stock', 'list', page],
    queryFn: () => pharmacyApi.listStock({ page, limit: 15 }),
    enabled: !searching,
  })

  const search = useQuery({
    queryKey: ['pharmacy', 'stock', 'search', q],
    queryFn: () => pharmacyApi.searchStock(q.trim()),
    enabled: searching,
  })

  const remove = useMutation({
    mutationFn: (id: string) => pharmacyApi.deleteStock(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pharmacy'] })
      toast.success('Stock item removed')
      setToDelete(null)
    },
    onError: () => {
      toast.error('Could not remove stock item')
      setToDelete(null)
    },
  })

  const items = searching ? search.data ?? [] : list.data?.data ?? []
  const isLoading = searching ? search.isLoading : list.isLoading
  const totalPages = searching ? 1 : list.data?.totalPages ?? 1

  return (
    <div>
      <PageHeader
        title="Stock Management"
        description="Track quantity, pricing and expiry across your medicine inventory."
        action={<Button leftIcon={<PackagePlus className="h-4 w-4" />} onClick={() => setAddOpen(true)}>Add stock</Button>}
      />

      <div className="mb-5 max-w-md">
        <SearchBar
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setPage(1)
          }}
          onClear={() => setQ('')}
          placeholder="Search by brand or generic name"
        />
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-2xl" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<PackageSearch className="h-7 w-7" />}
          title={searching ? 'No matching stock' : 'No stock yet'}
          description={searching ? 'Try a different search.' : 'Add your first medicine to start tracking inventory.'}
          action={!searching && <Button leftIcon={<PackagePlus className="h-4 w-4" />} onClick={() => setAddOpen(true)}>Add stock</Button>}
        />
      ) : (
        <>
          <Card className="overflow-hidden p-0">
            <Table className="rounded-none border-0">
              <THead>
                <TR>
                  <TH>Medicine</TH>
                  <TH>Quantity</TH>
                  <TH>Price</TH>
                  <TH>Expiry</TH>
                  <TH>Batch</TH>
                  <TH>Status</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {items.map((item) => (
                  <TR key={item._id}>
                    <TD>
                      <p className="truncate font-semibold text-foreground">{medicineName(item.medicineId)}</p>
                      <p className="text-xs text-muted-foreground">{medicineDetail(item.medicineId)}</p>
                    </TD>
                    <TD>{item.quantity}</TD>
                    <TD>{currency(item.price)}</TD>
                    <TD>
                      <span className="inline-flex items-center gap-1.5 text-sm">
                        <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
                        {formatDate(item.expiryDate)}
                      </span>
                    </TD>
                    <TD className="text-muted-foreground">{item.batchNo || '—'}</TD>
                    <TD>
                      <Badge tone={STATUS_TONE[item.status]}>{STATUS_LABEL[item.status]}</Badge>
                    </TD>
                    <TD className="text-right">
                      <div className="inline-flex items-center gap-1">
                        <Tooltip content="Edit">
                          <Button variant="ghost" size="icon" onClick={() => setEditing(item)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Tooltip>
                        <Tooltip content="Remove">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-danger hover:bg-danger-soft/60"
                            onClick={() => setToDelete(item)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </Tooltip>
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </Card>

          {!searching && (
            <Pagination page={page} totalPages={totalPages} onChange={setPage} className="mt-6" />
          )}
        </>
      )}

      <AddStockDrawer open={addOpen} onClose={() => setAddOpen(false)} />
      <EditStockDrawer stock={editing} open={!!editing} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete._id)}
        title="Remove stock item?"
        description={`${medicineName(toDelete?.medicineId)} will be removed from your inventory. This cannot be undone.`}
        confirmLabel="Remove"
        loading={remove.isPending}
      />
    </div>
  )
}
