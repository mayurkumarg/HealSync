import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { UserPlus, Pencil, Trash2, Stethoscope, Mail, Phone, BadgeCheck, MailWarning } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Card,
  Button,
  Badge,
  SearchBar,
  EmptyState,
  Skeleton,
  ConfirmDialog,
  Avatar,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
  Tooltip,
} from '@/components/ui'
import { useToast } from '@/context/ToastContext'
import { hospitalApi } from '@/api/hospital'
import { AddDoctorDrawer } from './AddDoctorDrawer'
import { EditDoctorDrawer } from './EditDoctorDrawer'
import type { Doctor, VerificationStatus } from '@/types'
import { cn } from '@/lib/cn'

export default function DoctorManagement() {
  const toast = useToast()
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<Doctor | null>(null)
  const [toDelete, setToDelete] = useState<Doctor | null>(null)

  const { data, isLoading } = useQuery({ queryKey: ['hospital', 'doctors'], queryFn: hospitalApi.listDoctors })

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: VerificationStatus }) => hospitalApi.setVerification(id, status),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['hospital'] })
      toast.success(`Marked ${v.status}`)
    },
    onError: () => toast.error('Could not update status'),
  })

  const remove = useMutation({
    mutationFn: (id: string) => hospitalApi.deleteDoctor(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hospital'] })
      toast.success('Doctor removed')
      setToDelete(null)
    },
    onError: () => {
      toast.error('Could not remove doctor')
      setToDelete(null)
    },
  })

  const filtered = useMemo(() => {
    const list = data ?? []
    if (!q.trim()) return list
    const s = q.toLowerCase()
    return list.filter(
      (d) => d.name?.toLowerCase().includes(s) || d.email?.toLowerCase().includes(s) || d.specialization?.toLowerCase().includes(s),
    )
  }, [data, q])

  return (
    <div>
      <PageHeader
        title="Doctor Management"
        description="Add, verify and manage the doctors on your facility's team."
        action={<Button leftIcon={<UserPlus className="h-4 w-4" />} onClick={() => setAddOpen(true)}>Add doctor</Button>}
      />

      <div className="mb-5 max-w-md">
        <SearchBar value={q} onChange={(e) => setQ(e.target.value)} onClear={() => setQ('')} placeholder="Search by name, email or specialization" />
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-2xl" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Stethoscope className="h-7 w-7" />}
          title={q ? 'No matching doctors' : 'No doctors yet'}
          description={q ? 'Try a different search.' : 'Add your first doctor to start building your team.'}
          action={!q && <Button leftIcon={<UserPlus className="h-4 w-4" />} onClick={() => setAddOpen(true)}>Add doctor</Button>}
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <Table className="rounded-none border-0">
            <THead>
              <TR>
                <TH>Doctor</TH>
                <TH>Contact</TH>
                <TH>Email</TH>
                <TH>Verification</TH>
                <TH className="text-right">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {filtered.map((d) => {
                const status = (d.verification?.status ?? 'pending') as VerificationStatus
                return (
                  <TR key={d._id}>
                    <TD>
                      <div className="flex items-center gap-3">
                        <Avatar name={d.name} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground">{d.name}</p>
                          <p className="text-xs text-muted-foreground">{d.specialization || 'General'}</p>
                        </div>
                      </div>
                    </TD>
                    <TD>
                      <div className="space-y-0.5 text-xs text-muted-foreground">
                        <p className="flex items-center gap-1.5"><Mail className="h-3 w-3" />{d.email}</p>
                        <p className="flex items-center gap-1.5"><Phone className="h-3 w-3" />{d.phone_no}</p>
                      </div>
                    </TD>
                    <TD>
                      {d.verified ? (
                        <Badge tone="success" icon={<BadgeCheck className="h-3.5 w-3.5" />}>Verified</Badge>
                      ) : (
                        <Badge tone="warning" icon={<MailWarning className="h-3.5 w-3.5" />}>Unverified</Badge>
                      )}
                    </TD>
                    <TD>
                      <div className="inline-flex rounded-lg border border-border bg-surface-2/60 p-0.5">
                        {(['verified', 'pending', 'rejected'] as VerificationStatus[]).map((sVal) => (
                          <button
                            key={sVal}
                            onClick={() => status !== sVal && setStatus.mutate({ id: d._id, status: sVal })}
                            disabled={setStatus.isPending}
                            className={cn(
                              'rounded-md px-2 py-1 text-xs font-medium capitalize transition-colors',
                              status === sVal
                                ? sVal === 'verified'
                                  ? 'bg-success text-success-foreground'
                                  : sVal === 'pending'
                                  ? 'bg-warning text-warning-foreground'
                                  : 'bg-danger text-danger-foreground'
                                : 'text-muted-foreground hover:text-foreground',
                            )}
                          >
                            {sVal}
                          </button>
                        ))}
                      </div>
                    </TD>
                    <TD className="text-right">
                      <div className="inline-flex items-center gap-1">
                        <Tooltip content="Edit">
                          <Button variant="ghost" size="icon" onClick={() => setEditing(d)}><Pencil className="h-4 w-4" /></Button>
                        </Tooltip>
                        <Tooltip content="Remove">
                          <Button variant="ghost" size="icon" className="text-danger hover:bg-danger-soft/60" onClick={() => setToDelete(d)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </Tooltip>
                      </div>
                    </TD>
                  </TR>
                )
              })}
            </TBody>
          </Table>
        </Card>
      )}

      <AddDoctorDrawer open={addOpen} onClose={() => setAddOpen(false)} />
      <EditDoctorDrawer doctor={editing} open={!!editing} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete._id)}
        title="Remove doctor?"
        description={`${toDelete?.name} will be removed from your facility. This cannot be undone.`}
        confirmLabel="Remove"
        loading={remove.isPending}
      />
    </div>
  )
}
