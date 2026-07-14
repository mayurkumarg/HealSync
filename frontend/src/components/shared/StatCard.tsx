import type { ReactNode } from 'react'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui'
import { cn } from '@/lib/cn'

type Tone = 'primary' | 'accent' | 'success' | 'warning' | 'danger'

const iconTones: Record<Tone, string> = {
  primary: 'bg-primary-soft text-primary',
  accent: 'bg-accent-soft text-accent',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
}

export function StatCard({
  label,
  value,
  icon,
  tone = 'primary',
  hint,
  trend,
}: {
  label: string
  value: ReactNode
  icon: ReactNode
  tone?: Tone
  hint?: string
  trend?: { value: string; up: boolean }
}) {
  return (
    <Card hover padded className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-2xl font-extrabold tracking-tight text-foreground">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl', iconTones[tone])}>
          {icon}
        </div>
      </div>
      {trend && (
        <div
          className={cn(
            'mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
            trend.up ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger',
          )}
        >
          {trend.up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          {trend.value}
        </div>
      )}
    </Card>
  )
}
