import type { ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import { cn } from '@/lib/cn'

type Tone = 'info' | 'success' | 'warning' | 'danger'

const config: Record<Tone, { wrap: string; icon: ReactNode }> = {
  info: { wrap: 'bg-accent-soft/60 border-accent/30 text-foreground', icon: <Info className="h-5 w-5 text-accent" /> },
  success: {
    wrap: 'bg-success-soft/60 border-success/30 text-foreground',
    icon: <CheckCircle2 className="h-5 w-5 text-success" />,
  },
  warning: {
    wrap: 'bg-warning-soft/60 border-warning/30 text-foreground',
    icon: <AlertTriangle className="h-5 w-5 text-warning" />,
  },
  danger: { wrap: 'bg-danger-soft/60 border-danger/30 text-foreground', icon: <XCircle className="h-5 w-5 text-danger" /> },
}

export function Alert({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: Tone
  title?: ReactNode
  children?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex gap-3 rounded-xl border p-4', config[tone].wrap, className)}>
      <span className="shrink-0">{config[tone].icon}</span>
      <div className="min-w-0 text-sm">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn('text-muted-foreground', title && 'mt-0.5')}>{children}</div>}
      </div>
    </div>
  )
}
