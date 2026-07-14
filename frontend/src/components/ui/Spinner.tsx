import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

export function Spinner({ className, size = 20 }: { className?: string; size?: number }) {
  return <Loader2 style={{ width: size, height: size }} className={cn('animate-spin text-primary', className)} />
}

/** Centered full-area loading state for pages/panels. */
export function LoadingState({ label = 'Loading…', className }: { label?: string; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground', className)}>
      <Spinner size={28} />
      <p className="text-sm">{label}</p>
    </div>
  )
}
