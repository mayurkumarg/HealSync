import { cn } from '@/lib/cn'
import { initials } from '@/lib/format'

interface AvatarProps {
  name?: string
  src?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  xs: 'h-7 w-7 text-[11px]',
  sm: 'h-9 w-9 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  return (
    <div
      className={cn(
        'grid shrink-0 place-items-center overflow-hidden rounded-full font-semibold',
        'bg-gradient-to-br from-primary to-accent text-white ring-2 ring-surface',
        sizes[size],
        className,
      )}
    >
      {src ? (
        <img src={src} alt={name ?? 'avatar'} className="h-full w-full object-cover" />
      ) : (
        <span>{initials(name)}</span>
      )}
    </div>
  )
}
