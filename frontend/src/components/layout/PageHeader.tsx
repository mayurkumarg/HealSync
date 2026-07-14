import type { ReactNode } from 'react'
import { Breadcrumbs } from '@/components/ui'
import type { Crumb } from '@/components/ui'

export function PageHeader({
  title,
  description,
  action,
  crumbs,
}: {
  title: string
  description?: ReactNode
  action?: ReactNode
  crumbs?: Crumb[]
}) {
  return (
    <div className="mb-6">
      {crumbs && <Breadcrumbs items={crumbs} className="mb-3" />}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-[1.75rem]">
            {title}
          </h1>
          {description && <p className="mt-1.5 text-sm text-muted-foreground sm:text-[0.95rem]">{description}</p>}
        </div>
        {action && <div className="flex shrink-0 items-center gap-2.5">{action}</div>}
      </div>
    </div>
  )
}
