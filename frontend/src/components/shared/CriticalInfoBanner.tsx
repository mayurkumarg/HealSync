import { AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui'
import type { FormEntry } from '@/types'

const CRITICAL_CATEGORIES = ['allergies', 'chronic_conditions']

function summarize(entry: FormEntry) {
  if (entry.data && Object.keys(entry.data).length > 0) {
    return Object.values(entry.data).filter(Boolean).join(', ')
  }
  return entry.description || ''
}

/** Promotes allergy/chronic-condition entries out of the generic Health Background list and
 * into a banner that's impossible to miss — shown on both the patient's own dashboard and a
 * doctor's patient-record view, so the same safety-critical info surfaces symmetrically to
 * whoever's looking. Renders nothing when there's nothing critical on file. */
export function CriticalInfoBanner({ entries }: { entries: FormEntry[] }) {
  const critical = entries.filter((e) => CRITICAL_CATEGORIES.includes(e.category))
  if (critical.length === 0) return null

  return (
    <div className="rounded-2xl border border-danger/30 bg-danger-soft/40 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-danger text-danger-foreground">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-bold text-foreground">Critical medical information</p>
          <div className="mt-2 space-y-1.5">
            {critical.map((entry) => (
              <p key={entry._id} className="flex flex-wrap items-baseline gap-x-2 text-sm">
                <Badge tone="danger" className="shrink-0">
                  {entry.category === 'allergies' ? 'Allergy' : 'Chronic condition'}
                </Badge>
                <span className="text-foreground">{summarize(entry) || 'On file — see Health Background for details.'}</span>
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
