import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FolderHeart, ClipboardList, History } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { ComingSoon } from '@/components/shared/ComingSoon'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import DocumentsPanel from '@/features/documents/DocumentsPage'
import BackgroundPanel from '@/features/health-forms/HealthFormsPage'
import TimelinePanel from '@/features/timeline/TimelinePage'

const TABS = [
  { key: 'documents', label: 'Documents', icon: <FolderHeart className="h-4 w-4" /> },
  { key: 'background', label: 'Background', icon: <ClipboardList className="h-4 w-4" /> },
  { key: 'timeline', label: 'Timeline', icon: <History className="h-4 w-4" /> },
] as const

type TabKey = (typeof TABS)[number]['key']

export default function HealthRecordsPage() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()

  if (user && user.role !== 'patient') return <ComingSoon />

  const requested = params.get('tab')
  const tab: TabKey = (TABS.some((t) => t.key === requested) ? requested : 'documents') as TabKey

  const setTab = (v: string) =>
    setParams(
      (prev) => {
        prev.set('tab', v)
        return prev
      },
      { replace: true },
    )

  return (
    <div>
      <PageHeader
        title="Health Records"
        description="Every document, background detail and health event — encrypted and in one place."
      />

      <Tabs value={tab} onValueChange={setTab} className="mb-6">
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.key} value={t.key} icon={t.icon}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Keyed by tab so each panel remounts and plays its entrance on switch. No AnimatePresence /
          exit animation on purpose: the panels embed their own framer-motion modals/drawers, whose
          nested exit-coordination can stall a parent `mode="wait"` and leave a stale panel mounted. */}
      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      >
        {tab === 'documents' && <DocumentsPanel />}
        {tab === 'background' && <BackgroundPanel />}
        {tab === 'timeline' && <TimelinePanel />}
      </motion.div>
    </div>
  )
}
