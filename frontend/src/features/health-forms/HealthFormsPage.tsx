import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ClipboardPlus, ClipboardList, Trash2, User2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, Badge, Button, EmptyState, Skeleton, ConfirmDialog } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { formEntryApi } from '@/api/formEntry'
import { AddFormEntryDrawer } from './AddFormEntryDrawer'
import { formatDate, titleCase } from '@/lib/format'
import type { FormEntry } from '@/types'

export default function HealthFormsPage() {
  const { user } = useAuth()
  const toast = useToast()
  const qc = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)
  const [toDelete, setToDelete] = useState<FormEntry | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['form-entries', user?.id],
    queryFn: () => formEntryApi.list(user!.id),
    enabled: !!user,
  })

  const remove = useMutation({
    mutationFn: (id: string) => formEntryApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['form-entries'] })
      toast.success('Entry removed')
      setToDelete(null)
    },
    onError: () => {
      toast.error('Could not remove entry')
      setToDelete(null)
    },
  })

  const entries = data ?? []

  return (
    <div>
      <PageHeader
        title="Health Background"
        description="Allergies, conditions, medications and history your doctors should know about."
        action={<Button leftIcon={<ClipboardPlus className="h-4 w-4" />} onClick={() => setAddOpen(true)}>Add entry</Button>}
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-7 w-7" />}
          title="No health background recorded yet"
          description="Add allergies, chronic conditions, medications or family history so doctors with access can see your full picture."
          action={<Button leftIcon={<ClipboardPlus className="h-4 w-4" />} onClick={() => setAddOpen(true)}>Add your first entry</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {entries.map((entry) => (
            <Card key={entry._id} padded>
              <div className="flex items-start justify-between gap-3">
                <Badge tone="primary">{titleCase(entry.category)}</Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-danger hover:bg-danger-soft/60"
                  onClick={() => setToDelete(entry)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {entry.data && Object.keys(entry.data).length > 0 && (
                <dl className="mt-3 space-y-1.5 text-sm">
                  {Object.entries(entry.data).map(([k, v]) => (
                    <div key={k} className="flex gap-2">
                      <dt className="font-medium text-foreground">{k}:</dt>
                      <dd className="truncate text-muted-foreground">{v}</dd>
                    </div>
                  ))}
                </dl>
              )}

              {entry.description && <p className="mt-3 text-sm text-muted-foreground">{entry.description}</p>}

              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span>{formatDate(entry.createdAt || '')}</span>
                {entry.createdBy?.name && (
                  <span className="flex items-center gap-1">
                    <User2 className="h-3 w-3" /> {entry.createdBy.name}
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {user && <AddFormEntryDrawer open={addOpen} onClose={() => setAddOpen(false)} patientId={user.id} />}

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete._id)}
        title="Remove this entry?"
        description="This permanently removes it from your health background."
        confirmLabel="Remove"
        loading={remove.isPending}
      />
    </div>
  )
}
