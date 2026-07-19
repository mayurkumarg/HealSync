import { NavLink } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { Logo } from '@/components/shared/Logo'
import { useAuth } from '@/context/AuthContext'
import { navForRole } from '@/routes/nav'
import { cn } from '@/lib/cn'

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth()
  if (!user) return null
  const sections = navForRole(user.role)

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex h-16 items-center px-5">
        <Logo />
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-3">
        {sections.map((section, i) => (
          <div key={section.title ?? `group-${i}`} className="space-y-1">
            {section.title && (
              <p className="px-3 pb-1 text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {section.title}
              </p>
            )}
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary-soft text-primary'
                      : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
                    )}
                    <span className={cn('transition-transform duration-200 group-hover:scale-110', isActive && 'text-primary')}>
                      {item.icon}
                    </span>
                    {item.label}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 p-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-foreground">Secure workspace</p>
            <p className="truncate text-[11px] text-muted-foreground">Encrypted &amp; private</p>
          </div>
        </div>
      </div>
    </div>
  )
}
