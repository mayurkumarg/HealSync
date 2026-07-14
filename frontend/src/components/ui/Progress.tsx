import { cn } from '@/lib/cn'

type Tone = 'primary' | 'success' | 'warning' | 'danger'

const tones: Record<Tone, string> = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
}

export function Progress({
  value,
  max = 100,
  tone = 'primary',
  className,
}: {
  value: number
  max?: number
  tone?: Tone
  className?: string
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-muted', className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-500 ease-out', tones[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
