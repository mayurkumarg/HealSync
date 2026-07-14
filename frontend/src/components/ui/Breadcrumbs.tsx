import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface Crumb {
  label: string
  to?: string
}

export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav className={cn('flex items-center gap-1.5 text-sm', className)} aria-label="Breadcrumb">
      {items.map((c, i) => {
        const last = i === items.length - 1
        return (
          <Fragment key={i}>
            {c.to && !last ? (
              <Link to={c.to} className="text-muted-foreground transition-colors hover:text-foreground">
                {c.label}
              </Link>
            ) : (
              <span className={last ? 'font-medium text-foreground' : 'text-muted-foreground'}>{c.label}</span>
            )}
            {!last && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />}
          </Fragment>
        )
      })}
    </nav>
  )
}
