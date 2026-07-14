import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Upload,
  FileText,
  FlaskConical,
  ScanLine,
  Stethoscope,
  Receipt,
  FileHeart,
  Trash2,
  Eye,
  Sparkles,
  FolderHeart,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { ComingSoon } from '@/components/shared/ComingSoon'
import {
  Card,
  Button,
  Badge,
  EmptyState,
  SkeletonCard,
  Modal,
  Alert,
  ConfirmDialog,
} from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { documentsApi } from '@/api/documents'
import { ApiError } from '@/api/client'
import { formatDate, titleCase } from '@/lib/format'
import type { DocumentType, MedicalDocument } from '@/types'

const typeMeta: Record<string, { icon: React.ReactNode; tone: string }> = {
  lab_report: { icon: <FlaskConical className="h-5 w-5" />, tone: 'bg-success-soft text-success' },
  prescription: { icon: <FileText className="h-5 w-5" />, tone: 'bg-primary-soft text-primary' },
  diagnostic_report: { icon: <ScanLine className="h-5 w-5" />, tone: 'bg-accent-soft text-accent' },
  imaging_report: { icon: <ScanLine className="h-5 w-5" />, tone: 'bg-accent-soft text-accent' },
  discharge_summary: { icon: <Stethoscope className="h-5 w-5" />, tone: 'bg-warning-soft text-warning' },
  hospital_bill: { icon: <Receipt className="h-5 w-5" />, tone: 'bg-surface-2 text-muted-foreground' },
  medical_certificate: { icon: <FileHeart className="h-5 w-5" />, tone: 'bg-primary-soft text-primary' },
  other_medical_document: { icon: <FileText className="h-5 w-5" />, tone: 'bg-surface-2 text-muted-foreground' },
}

const meta = (t: DocumentType) => typeMeta[t] ?? typeMeta.other_medical_document

export default function DocumentsPage() {
  const { user } = useAuth()
  if (user && user.role !== 'patient') return <ComingSoon />

  const toast = useToast()
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [selected, setSelected] = useState<MedicalDocument | null>(null)
  const [toDelete, setToDelete] = useState<MedicalDocument | null>(null)

  const { data, isLoading } = useQuery({ queryKey: ['documents'], queryFn: documentsApi.list })

  const upload = useMutation({
    mutationFn: (file: File) => documentsApi.upload(file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] })
      toast.success('Document uploaded', 'Your document was processed and encrypted.')
    },
    onError: (err) => {
      const m = err instanceof ApiError ? err.message : 'Upload failed.'
      toast.error('Upload unavailable', 'Document storage/OCR needs configuration in this environment.')
      console.warn('[documents] upload failed:', m)
    },
  })

  const remove = useMutation({
    mutationFn: (id: string) => documentsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] })
      toast.success('Document deleted')
      setToDelete(null)
    },
    onError: () => {
      toast.error('Could not delete', 'This may be a sample document.')
      setToDelete(null)
    },
  })

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) upload.mutate(file)
    e.target.value = ''
  }

  const docs = data?.documents ?? []

  return (
    <div>
      <PageHeader
        title="Health Wallet"
        description="Every report, prescription and scan — encrypted and always with you."
        action={
          <>
            <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={onPick} />
            <Button leftIcon={<Upload className="h-4 w-4" />} loading={upload.isPending} onClick={() => fileRef.current?.click()}>
              Upload document
            </Button>
          </>
        }
      />

      {data?.isSample && (
        <Alert tone="info" title="Preview data" className="mb-5">
          Showing sample documents. Connect Supabase storage & OCR to upload and process your own.
        </Alert>
      )}

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : docs.length === 0 ? (
        <EmptyState
          icon={<FolderHeart className="h-7 w-7" />}
          title="Your wallet is empty"
          description="Upload a report or prescription — HealSync will OCR it, summarize it with AI, and keep it encrypted."
          action={
            <Button leftIcon={<Upload className="h-4 w-4" />} onClick={() => fileRef.current?.click()}>
              Upload your first document
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((doc) => {
            const m = meta(doc.type)
            return (
              <Card key={doc._id} hover className="group flex flex-col">
                <div className="flex items-start gap-3 p-5">
                  <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${m.tone}`}>{m.icon}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">{doc.fileName || titleCase(doc.type)}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(doc.uploadedAt || '')}</p>
                  </div>
                </div>
                <div className="flex-1 px-5">
                  <Badge tone="neutral" className="mb-2">
                    {titleCase(doc.type)}
                  </Badge>
                  {doc.nlp?.summary && (
                    <p className="line-clamp-3 text-sm text-muted-foreground">{doc.nlp.summary}</p>
                  )}
                </div>
                <div className="flex items-center justify-between border-t border-border p-3">
                  <Button variant="ghost" size="sm" leftIcon={<Eye className="h-4 w-4" />} onClick={() => setSelected(doc)}>
                    View
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-danger hover:bg-danger-soft/60"
                    onClick={() => setToDelete(doc)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Detail modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        size="lg"
        icon={selected ? meta(selected.type).icon : undefined}
        title={selected?.fileName || (selected ? titleCase(selected.type) : '')}
        description={selected ? `${titleCase(selected.type)} · ${formatDate(selected.uploadedAt || '')}` : ''}
      >
        {selected && (
          <div className="space-y-5 pb-4">
            {selected.nlp?.summary && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
                  <Sparkles className="h-3.5 w-3.5" /> AI summary
                </p>
                <p className="text-sm text-foreground">{selected.nlp.summary}</p>
              </div>
            )}
            {selected.ocr?.text && (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Extracted text (OCR)
                </p>
                <p className="rounded-xl border border-border bg-surface-2/40 p-4 text-sm leading-relaxed text-foreground">
                  {selected.ocr.text}
                </p>
              </div>
            )}
            {selected.fileUrl && (
              <a href={selected.fileUrl} target="_blank" rel="noreferrer">
                <Button variant="outline" fullWidth>
                  Open original file
                </Button>
              </a>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete._id)}
        title="Delete document?"
        description="This permanently removes the document from your wallet."
        confirmLabel="Delete"
        loading={remove.isPending}
      />
    </div>
  )
}
