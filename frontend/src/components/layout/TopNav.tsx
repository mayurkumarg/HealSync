import { Menu } from 'lucide-react'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { ProfileMenu } from '@/components/shared/ProfileMenu'
import { useAuth } from '@/context/AuthContext'

export function TopNav({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const { user } = useAuth()
  const firstName = user?.name?.split(' ')[0]

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border glass px-4 sm:px-6">
      <button
        onClick={onOpenSidebar}
        className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-surface text-foreground transition-colors hover:bg-surface-2 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden min-w-0 sm:block">
        <p className="truncate text-sm text-muted-foreground">
          {greeting()}{firstName ? ',' : ''}{' '}
          <span className="font-semibold text-foreground">{firstName || 'welcome back'}</span>
        </p>
      </div>

      <div className="ml-auto flex items-center gap-2.5">
        <ThemeToggle />
        <ProfileMenu />
      </div>
    </header>
  )
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}
