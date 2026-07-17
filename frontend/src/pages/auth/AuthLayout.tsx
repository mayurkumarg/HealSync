import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldCheck, Sparkles, Share2, Quote } from 'lucide-react'
import { Logo } from '@/components/shared/Logo'
import { ThemeToggle } from '@/components/shared/ThemeToggle'

const highlights = [
  { icon: <Share2 className="h-4.5 w-4.5" />, text: 'Share records with a tap — time-boxed, revocable' },
  { icon: <Sparkles className="h-4.5 w-4.5" />, text: 'AI turns messy reports into clear summaries' },
  { icon: <ShieldCheck className="h-4.5 w-4.5" />, text: 'AES-256 encrypted, patient-owned by design' },
]

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle?: ReactNode
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary via-primary to-accent lg:flex lg:flex-col">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-accent/30 blur-3xl" />

        <div className="relative z-10 flex flex-1 flex-col p-12 text-white">
          <Link to="/" className="inline-flex items-center gap-2.5 font-display text-xl font-extrabold">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 backdrop-blur">
              <svg viewBox="0 0 32 32" className="h-5 w-5" fill="none">
                <path d="M6 16.5h3.6l1.9-3.8 3.3 7.6 2.9-9.4 2.4 5.6H26" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            HealSync
          </Link>

          <div className="my-auto max-w-md">
            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="font-display text-4xl font-extrabold leading-tight text-balance"
            >
              Your entire health journey, synchronized in one place.
            </motion.h2>
            <p className="mt-4 text-white/80">
              Like UPI unified payments, HealSync unifies your medical data — portable, secure, and
              always in your control.
            </p>

            <div className="mt-8 space-y-3">
              {highlights.map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.1 }}
                  className="flex items-center gap-3 rounded-xl bg-white/10 p-3 backdrop-blur"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/15">{h.icon}</span>
                  <span className="text-sm font-medium">{h.text}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="relative rounded-2xl bg-white/10 p-5 backdrop-blur">
            <Quote className="mb-2 h-5 w-5 text-white/60" />
            <p className="text-sm text-white/90">
              “Walk into any clinic and share your full history in seconds. No files, no repeated
              tests.”
            </p>
            <p className="mt-2 text-xs font-semibold text-white/70">The HealSync promise</p>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="relative flex flex-col bg-background">
        <div className="flex items-center justify-between p-5 lg:hidden">
          <Logo />
          <ThemeToggle />
        </div>
        <div className="absolute right-5 top-5 hidden lg:block">
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md"
          >
            <div className="mb-8">
              <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                {title}
              </h1>
              {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            {children}
            {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
