import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'grid place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-soft',
        className,
      )}
    >
      <svg viewBox="0 0 32 32" className="h-[62%] w-[62%]" fill="none">
        <path
          d="M6 16.5h3.6l1.9-3.8 3.3 7.6 2.9-9.4 2.4 5.6H26"
          stroke="currentColor"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}

export function Logo({
  to = '/',
  className,
  showText = true,
  size = 'md',
}: {
  to?: string
  className?: string
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
}) {
  const mark = { sm: 'h-8 w-8', md: 'h-9 w-9', lg: 'h-11 w-11' }[size]
  const text = { sm: 'text-lg', md: 'text-xl', lg: 'text-2xl' }[size]
  return (
    <Link to={to} className={cn('inline-flex items-center gap-2.5 font-display', className)}>
      <LogoMark className={mark} />
      {showText && (
        <span className={cn('font-extrabold tracking-tight text-foreground', text)}>
          Heal<span className="text-primary">Sync</span>
        </span>
      )}
    </Link>
  )
}
