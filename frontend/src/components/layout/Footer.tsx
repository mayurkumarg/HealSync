import { Logo } from '@/components/shared/Logo'

export function AppFooter() {
  return (
    <footer className="mt-auto border-t border-border px-4 py-5 sm:px-6">
      <div className="flex flex-col items-center justify-between gap-3 text-xs text-muted-foreground sm:flex-row">
        <div className="flex items-center gap-2">
          <Logo size="sm" showText={false} />
          <span>© {new Date().getFullYear()} HealSync · Your health, synchronized</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-success" /> AES-256 encrypted
          </span>
          <a href="#" className="transition-colors hover:text-foreground">Privacy</a>
          <a href="#" className="transition-colors hover:text-foreground">Terms</a>
        </div>
      </div>
    </footer>
  )
}
