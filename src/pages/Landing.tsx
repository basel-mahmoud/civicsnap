import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView, animate } from 'motion/react'
import { CATEGORY_LIST } from '@/lib/categories'
import { Button } from '@/components/ui'
import { Icon, type IconName } from '@/components/icons/Icon'

// Lazy so the Leaflet bundle never blocks first paint of the hero copy.
const HeroLiveMap = lazy(() =>
  import('@/components/map/HeroLiveMap').then((m) => ({ default: m.HeroLiveMap })),
)

// Strong ease-out curve (Emil Kowalski's standard) used across the page.
const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1]

/* ------------------------------------------------------------------ helpers */

function Reveal({
  children,
  delay = 0,
  y = 24,
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  y?: number
  className?: string
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  )
}

function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!inView) return
    const controls = animate(0, to, {
      duration: 1.6,
      ease: EASE_OUT,
      onUpdate: (v) => setVal(v),
    })
    return () => controls.stop()
  }, [inView, to])
  return (
    <span ref={ref}>
      {Math.round(val).toLocaleString()}
      {suffix}
    </span>
  )
}

/* -------------------------------------------------------------- status demo */

const PIPELINE = ['Reported', 'Acknowledged', 'In progress', 'Fixed'] as const

function StatusDemo() {
  const [step, setStep] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setStep((s) => (s + 1) % (PIPELINE.length + 1)), 1400)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="flex items-center gap-2 sm:gap-4">
      {PIPELINE.map((label, i) => {
        const done = i < step
        return (
          <div key={label} className="flex items-center gap-2 sm:gap-4 flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <motion.div
                animate={{
                  backgroundColor: done ? '#10b981' : 'rgba(148,163,184,0.18)',
                  scale: i === step - 1 ? [1, 1.25, 1] : 1,
                }}
                transition={{ duration: 0.4 }}
                className="grid size-9 place-items-center rounded-full text-white"
              >
                {done ? <Icon name="check" size={16} /> : <span className="text-xs text-soft">{i + 1}</span>}
              </motion.div>
              <span className={`text-[11px] font-medium whitespace-nowrap ${done ? 'text-app' : 'text-soft'}`}>
                {label}
              </span>
            </div>
            {i < PIPELINE.length - 1 && (
              <div className="h-0.5 flex-1 rounded bg-muted2 overflow-hidden -mt-5">
                <motion.div
                  className="h-full bg-brand-500"
                  animate={{ width: i < step - 1 ? '100%' : '0%' }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* -------------------------------------------------------------------- page */

const STEPS: { icon: IconName; title: string; body: string }[] = [
  { icon: 'camera', title: 'Snap', body: 'Photograph the issue from your phone — pothole, broken light, dumped trash.' },
  { icon: 'sparkles', title: 'AI triages', body: 'Claude vision reads the image, sets the category and severity, and writes the title.' },
  { icon: 'navigation', title: 'Map it', body: 'Your geolocated report drops a live pin on the shared neighborhood map.' },
  { icon: 'shield-check', title: 'Track to fixed', body: 'Follow it through Reported → Acknowledged → In progress → Fixed.' },
]

const FEATURES: { icon: IconName; title: string; body: string }[] = [
  { icon: 'eye', title: 'Public by default', body: 'Every report is visible on one transparent map so nothing quietly disappears.' },
  { icon: 'trending-up', title: 'Upvote what matters', body: 'Neighbors rally behind the issues that need attention first.' },
  { icon: 'bell', title: 'Realtime updates', body: 'New reports and status changes stream in live — no refresh needed.' },
  { icon: 'shield-check', title: 'Secure by design', body: 'Row-level security and a server-side AI keep data and keys protected.' },
]

export function Landing() {
  return (
    <div className="relative overflow-clip">
      {/* ambient background */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="absolute -top-32 -left-24 size-[34rem] rounded-full bg-brand-500/20 blur-3xl animate-blob" />
        <div className="absolute top-40 -right-24 size-[30rem] rounded-full bg-cyan-400/15 blur-3xl animate-blob" style={{ animationDelay: '4s' }} />
        <div className="absolute bottom-0 left-1/3 size-[28rem] rounded-full bg-lime-400/10 blur-3xl animate-blob" style={{ animationDelay: '8s' }} />
      </div>

      {/* HERO */}
      <section className="mx-auto max-w-6xl px-4 pt-16 sm:pt-24 pb-12 grid lg:grid-cols-[1.05fr_0.95fr] gap-12 items-center">
        <div>
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-app glass px-3 py-1 text-xs font-medium text-soft"
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75 animate-ping" />
              <span className="relative inline-flex size-2 rounded-full bg-brand-500" />
            </span>
            Civic reporting, powered by AI vision
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="mt-6 text-[2.7rem] leading-[1.02] sm:text-6xl font-bold text-app"
          >
            Your city has
            <br />
            a <span className="text-gradient">backlog.</span>
            <br />
            Let's clear it.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-5 max-w-xl text-lg text-soft"
          >
            CivicSnap turns one photo into a tracked, AI-categorized, mapped civic
            report — and follows it all the way to fixed.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Link to="/report">
              <Button size="lg">
                Report an issue <Icon name="arrow-right" size={18} />
              </Button>
            </Link>
            <Link to="/map">
              <Button size="lg" variant="secondary">
                <Icon name="map-pin" size={18} /> Explore the map
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-10 flex gap-8"
          >
            {[
              { n: 8, s: '', l: 'issue types' },
              { n: 4, s: '', l: 'status stages' },
              { n: 20, s: 's', l: 'to report' },
            ].map((stat) => (
              <div key={stat.l}>
                <p className="text-3xl font-bold font-display text-app">
                  <CountUp to={stat.n} suffix={stat.s} />
                </p>
                <p className="text-xs text-soft mt-0.5">{stat.l}</p>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE_OUT }}
          className="relative"
        >
          <Suspense
            fallback={
              <div className="w-full aspect-[4/3.3] rounded-[1.75rem] border border-app bg-muted2 animate-pulse" />
            }
          >
            <HeroLiveMap />
          </Suspense>
        </motion.div>
      </section>

      {/* MARQUEE */}
      <section className="py-6 border-y border-app bg-surface/40">
        <div className="mask-fade-x overflow-hidden">
          <div className="flex w-max animate-marquee gap-3">
            {[...CATEGORY_LIST, ...CATEGORY_LIST].map((c, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-2 rounded-full border border-app bg-surface px-4 py-2 text-sm font-medium text-app whitespace-nowrap"
              >
                <Icon name={c.icon} size={16} style={{ color: c.color }} />
                {c.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <Reveal>
          <p className="text-center text-sm font-semibold uppercase tracking-widest text-brand-500">
            How it works
          </p>
          <h2 className="mt-2 text-center text-3xl sm:text-4xl font-bold text-app">
            From snapshot to solved
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.1}>
              <div className="group relative h-full rounded-3xl border border-app bg-surface p-6 transition-all hover:-translate-y-1.5 hover:border-brand-400/50 hover:glow-brand">
                <div className="flex items-center justify-between">
                  <div className="grid size-12 place-items-center rounded-2xl bg-brand-500/12 text-brand-500 transition-transform group-hover:scale-110 group-hover:rotate-3">
                    <Icon name={s.icon} size={24} />
                  </div>
                  <span className="font-display text-2xl font-bold text-app/10">0{i + 1}</span>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-app">{s.title}</h3>
                <p className="mt-1.5 text-sm text-soft">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* STATUS PIPELINE DEMO */}
      <section className="mx-auto max-w-5xl px-4 pb-20">
        <Reveal>
          <div className="rounded-3xl border border-app glass p-8 sm:p-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-app">Transparent by design</h2>
                <p className="text-soft mt-1">Watch every report move through a public pipeline.</p>
              </div>
              <span className="inline-flex items-center gap-2 self-start rounded-full bg-brand-500/12 px-3 py-1.5 text-xs font-semibold text-brand-500">
                <Icon name="activity" size={14} /> Live status
              </span>
            </div>
            <StatusDemo />
          </div>
        </Reveal>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="grid gap-5 sm:grid-cols-2">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.08}>
              <div className="flex gap-4 rounded-3xl border border-app bg-surface p-6 h-full hover:border-brand-400/40 transition-colors">
                <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500/20 to-cyan-400/10 text-brand-400">
                  <Icon name={f.icon} size={22} />
                </div>
                <div>
                  <h3 className="font-semibold text-app">{f.title}</h3>
                  <p className="mt-1 text-sm text-soft">{f.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-4 pb-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] border border-brand-400/30 p-10 sm:p-16 text-center">
            <div
              className="absolute inset-0 -z-10"
              style={{
                background:
                  'radial-gradient(100% 120% at 50% 0%, rgba(16,185,129,0.22), transparent 60%), linear-gradient(180deg, rgba(34,211,238,0.08), transparent)',
              }}
            />
            <div className="absolute inset-0 -z-10 bg-grid opacity-30" />
            <h2 className="text-3xl sm:text-5xl font-bold text-app">
              Your block, <span className="text-gradient">on the record.</span>
            </h2>
            <p className="mt-4 max-w-xl mx-auto text-soft text-lg">
              Join your neighbors and file your first report — it takes about 20 seconds.
            </p>
            <Link to="/report" className="inline-block mt-8">
              <Button size="lg">
                Get started <Icon name="arrow-right" size={18} />
              </Button>
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  )
}
