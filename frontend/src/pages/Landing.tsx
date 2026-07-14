import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  ShieldCheck,
  Share2,
  Sparkles,
  Pill,
  BellRing,
  HeartPulse,
  QrCode,
  FileText,
  Building2,
  Stethoscope,
  User,
  Check,
  Lock,
} from 'lucide-react'
import { Logo } from '@/components/shared/Logo'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { Button } from '@/components/ui'

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
}

const features = [
  { icon: <ShieldCheck />, title: 'Patient-owned wallet', text: 'Your entire history in one encrypted place — reports, prescriptions and images that sync automatically.' },
  { icon: <QrCode />, title: 'Consent by QR & token', text: 'Grant a doctor time-boxed access with a scan or code. Auto-revokes. Full audit of who saw what, when.' },
  { icon: <Sparkles />, title: 'AI health summaries', text: 'OCR digitizes handwritten prescriptions; AI turns dense reports into clear, plain-language answers.' },
  { icon: <Pill />, title: 'Medicine discovery', text: 'Find nearby pharmacies that stock your medicine — compare price and availability in seconds.' },
  { icon: <BellRing />, title: 'Smart reminders', text: 'Never miss a dose or appointment with multi-channel reminders tuned to your schedule.' },
  { icon: <HeartPulse />, title: 'Vitals tracking', text: 'Log BP and blood sugar, watch trends, and keep medication stock in check — automatically.' },
]

const stakeholders = [
  { icon: <User />, tone: 'primary', title: 'Patients', points: ['One home for all records', 'Share in a tap, revoke anytime', 'Reminders that build discipline', 'Find medicines faster'] },
  { icon: <Stethoscope />, tone: 'accent', title: 'Doctors', points: ['Instant, permissioned history', 'AI-summarized patient context', 'Upload reports & prescriptions', 'No dependence on carried files'] },
  { icon: <Building2 />, tone: 'success', title: 'Pharmacies', points: ['Publish live stock & pricing', 'Reach nearby patients', 'Demand analytics', 'Higher conversion'] },
]

const steps = [
  { n: '01', title: 'Create your wallet', text: 'Sign up in seconds. Your encrypted health vault is ready instantly.' },
  { n: '02', title: 'Add & sync records', text: 'Upload reports or let hospitals push updates straight to you.' },
  { n: '03', title: 'Share on your terms', text: 'Show a QR or code for time-boxed doctor access — revoke whenever.' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border glass">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">Features</a>
            <a href="#stakeholders" className="transition-colors hover:text-foreground">Who it's for</a>
            <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
          </nav>
          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <Link to="/login" className="hidden sm:block">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-60" />
        <div className="absolute left-1/2 top-0 h-[32rem] w-[52rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div {...fadeUp}>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-soft">
                <span className="flex h-2 w-2 items-center justify-center">
                  <span className="absolute h-2 w-2 animate-pulse-ring rounded-full bg-primary" />
                  <span className="h-2 w-2 rounded-full bg-primary" />
                </span>
                The UPI moment for healthcare data
              </span>
            </motion.div>
            <motion.h1
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.05 }}
              className="mt-6 font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground text-balance sm:text-6xl"
            >
              Your entire health journey,{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                synchronized
              </span>
            </motion.h1>
            <motion.p
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.1 }}
              className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground"
            >
              HealSync unifies patients, doctors and pharmacies into one secure, permission-based
              ecosystem — portable records, instant consent, AI insights, and never a missed dose.
            </motion.p>
            <motion.div
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.15 }}
              className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
            >
              <Link to="/signup" className="w-full sm:w-auto">
                <Button size="lg" fullWidth rightIcon={<ArrowRight className="h-4.5 w-4.5" />}>
                  Create your health wallet
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" fullWidth>
                  I already have an account
                </Button>
              </Link>
            </motion.div>
            <motion.div
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.2 }}
              className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground"
            >
              <span className="inline-flex items-center gap-1.5"><Lock className="h-4 w-4 text-primary" /> AES-256 encrypted</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-success" /> Patient-owned</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-success" /> ABHA-ready</span>
            </motion.div>
          </div>

          {/* Floating preview card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mt-16 max-w-4xl"
          >
            <div className="rounded-3xl border border-border bg-surface p-2 shadow-elevated">
              <div className="rounded-2xl bg-gradient-to-br from-surface-2 to-surface p-6 sm:p-8">
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    { icon: <FileText className="h-5 w-5" />, label: 'Records synced', value: '128' },
                    { icon: <Share2 className="h-5 w-5" />, label: 'Active shares', value: '3' },
                    { icon: <BellRing className="h-5 w-5" />, label: 'Adherence', value: '96%' },
                  ].map((s, i) => (
                    <div key={i} className="rounded-xl border border-border bg-surface p-4 text-left shadow-soft">
                      <div className="mb-3 grid h-9 w-9 place-items-center rounded-lg bg-primary-soft text-primary">
                        {s.icon}
                      </div>
                      <p className="font-display text-2xl font-extrabold text-foreground">{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Everything your health needs, in sync
          </h2>
          <p className="mt-4 text-muted-foreground">
            Not just a digital locker — a living ecosystem connecting every part of your care.
          </p>
        </motion.div>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.05 }}
              className="group rounded-2xl border border-border bg-surface p-6 shadow-card card-hover"
            >
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary transition-transform duration-300 group-hover:scale-110 [&>svg]:h-6 [&>svg]:w-6">
                {f.icon}
              </div>
              <h3 className="font-display text-lg font-bold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stakeholders */}
      <section id="stakeholders" className="border-y border-border bg-surface-2/40">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Built for everyone in the care journey
            </h2>
            <p className="mt-4 text-muted-foreground">One connected ecosystem — each stakeholder wins.</p>
          </motion.div>
          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {stakeholders.map((s, i) => (
              <motion.div
                key={s.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.08 }}
                className="rounded-2xl border border-border bg-surface p-7 shadow-card"
              >
                <div
                  className={`mb-5 grid h-12 w-12 place-items-center rounded-xl [&>svg]:h-6 [&>svg]:w-6 ${
                    s.tone === 'primary'
                      ? 'bg-primary-soft text-primary'
                      : s.tone === 'accent'
                      ? 'bg-accent-soft text-accent'
                      : 'bg-success-soft text-success'
                  }`}
                >
                  {s.icon}
                </div>
                <h3 className="font-display text-xl font-bold text-foreground">{s.title}</h3>
                <ul className="mt-4 space-y-2.5">
                  {s.points.map((p) => (
                    <li key={p} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      {p}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Three steps to total control
          </h2>
        </motion.div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <motion.div key={s.n} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.08 }} className="relative">
              <div className="rounded-2xl border border-border bg-surface p-7 shadow-card">
                <span className="font-display text-4xl font-extrabold text-primary/25">{s.n}</span>
                <h3 className="mt-3 font-display text-lg font-bold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <motion.div
          {...fadeUp}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-accent px-6 py-16 text-center shadow-elevated sm:px-16"
        >
          <div className="absolute inset-0 bg-grid opacity-20" />
          <div className="relative">
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-white text-balance sm:text-4xl">
              Take ownership of your health data today
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/85">
              Join HealSync and experience healthcare that finally works as one.
            </p>
            <Link to="/signup" className="mt-8 inline-block">
              <Button size="lg" variant="secondary" rightIcon={<ArrowRight className="h-4.5 w-4.5" />}>
                Get started free
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Logo size="sm" />
          </div>
          <p>© {new Date().getFullYear()} HealSync. Synchronizing healthcare into one seamless experience.</p>
        </div>
      </footer>
    </div>
  )
}
