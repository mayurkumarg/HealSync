import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, LogOut, Settings, UserCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Avatar } from '@/components/ui'
import { ROLE_LABEL } from '@/routes/nav'

export function ProfileMenu() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  if (!user) return null

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl border border-border bg-surface p-1 pl-1 pr-2 transition-colors hover:bg-surface-2 sm:pl-2.5"
      >
        <Avatar name={user.name || user.email} size="sm" />
        <span className="hidden max-w-[9rem] truncate text-sm font-medium text-foreground sm:block">
          {user.name?.split(' ')[0] || 'Account'}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-border bg-surface shadow-elevated"
          >
            <div className="flex items-center gap-3 border-b border-border p-4">
              <Avatar name={user.name || user.email} size="md" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{user.name || 'Account'}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                <span className="mt-1 inline-block rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                  {ROLE_LABEL[user.role]}
                </span>
              </div>
            </div>
            <div className="p-1.5">
              <MenuButton icon={<UserCircle className="h-4 w-4" />} onClick={() => { setOpen(false); navigate('/app/profile') }}>
                Your profile
              </MenuButton>
              <MenuButton icon={<Settings className="h-4 w-4" />} onClick={() => { setOpen(false); navigate('/app/profile') }}>
                Settings
              </MenuButton>
              <div className="my-1 h-px bg-border" />
              <MenuButton icon={<LogOut className="h-4 w-4" />} danger onClick={() => { setOpen(false); logout(); navigate('/login') }}>
                Sign out
              </MenuButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MenuButton({
  icon,
  children,
  onClick,
  danger,
}: {
  icon: React.ReactNode
  children: React.ReactNode
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        danger
          ? 'text-danger hover:bg-danger-soft/60'
          : 'text-foreground hover:bg-surface-2'
      }`}
    >
      {icon}
      {children}
    </button>
  )
}
