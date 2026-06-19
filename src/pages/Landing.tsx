import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView, animate } from 'motion/react'
import { CATEGORY_LIST } from '@/lib/categories'
import { Icon, type IconName } from '@/components/icons/Icon'
import { Intro } from '@/components/Intro'

// Three.js is heavy; lazy-load so it never blocks first paint.
const Globe3D = lazy(() => import('@/components/three/Globe3D'))

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1]

function CountUp({ to, suffix = '', prefix = '' }: { to: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!inView) return
    const c = animate(0, to, { duration: 1.2, ease: EASE_OUT, onUpdate: (v) => setVal(v) })
    return () => c.stop()
  }, [inView, to])
  return (
    <span ref={ref}>
      {prefix}
      {Math.round(val)}
      {suffix}
    </span>
  )
}

/* ---------------------------------------------------------------- status demo */
const PIPELINE = ['REPORTED', 'ACKNOWLEDGED', 'IN PROGRESS', 'FIXED'] as const

function StatusDemo() {
  const [step, setStep] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setStep((s) => (s + 1) % (PIPELINE.length + 1)), 1300)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="rule-grid grid-cols-2 sm:grid-cols-4 border-2 border-app">
      {PIPELINE.map((label, i) => {
        const done = i < step
        return (
          <div key={label} className="bg-surface p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="font-display text-2xl" style={{ color: done ? 'var(--accent)' : 'var(--text-muted)' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span
                className="size-3"
                style={{ background: done ? 'var(--accent)' : 'transparent', border: `2px solid ${done ? 'var(--accent)' : 'var(--text-muted)'}` }}
              />
            </div>
            <p className={`telemetry mt-3 ${done ? 'text-app' : 'text-soft'}`}>{label}</p>
          </div>
        )
      })}
    </div>
  )
}

/* ----------------------------------------------------------------------- data */
const STEPS: { icon: IconName; title: string; body: string }[] = [
  { icon: 'camera', title: 'CAPTURE', body: 'Photograph the issue from your phone. Pothole, dead street light, dumped trash.' },
  { icon: 'sparkles', title: 'CLASSIFY', body: 'Claude vision reads the image, assigns category and severity, writes the title.' },
  { icon: 'navigation', title: 'LOCATE', body: 'Geolocation drops a live pin on the shared public map for the whole block.' },
  { icon: 'shield-check', title: 'RESOLVE', body: 'Tracked through Reported, Acknowledged, In progress, Fixed. On the record.' },
]

const FEATURES: { icon: IconName; title: string; body: string }[] = [
  { icon: 'eye', title: 'PUBLIC BY DEFAULT', body: 'Every report sits on one transparent map. Nothing disappears quietly.' },
  { icon: 'trending-up', title: 'PRIORITIZED BY VOTES', body: 'Residents upvote what matters so the worst issues surface first.' },
  { icon: 'bell', title: 'REALTIME FEED', body: 'New reports and status changes stream in live. No refresh required.' },
  { icon: 'shield-check', title: 'SECURE BY DESIGN', body: 'Row-level security and a server-side AI keep data and keys protected.' },
]

/* ----------------------------------------------------------------------- page */
export function Landing() {
  return (
    <div className="bg-app">
      <Intro />

      {/* HERO — command console (deliberate dark color block) */}
      <section className="relative bg-[#0a0a0a] text-[#eaeaea] overflow-hidden">
        {/* document header strip */}
        <div className="relative z-10 border-b border-[#262626]">
          <div className="mx-auto max-w-7xl px-4 sm:px-8 py-1.5 flex items-center justify-between">
            <span className="telemetry text-[#8a877e]">CIVICSNAP ® // CIVIC INFRASTRUCTURE REGISTRY</span>
            <span className="telemetry text-[#8a877e] hidden sm:block">REV 2.6 / DUBAI / AE</span>
          </div>
        </div>

        {/* interactive 3D globe */}
        <div className="absolute inset-0 lg:left-[40%] z-0">
          <Suspense fallback={null}>
            <Globe3D />
          </Suspense>
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(78% 78% at 70% 50%, transparent 58%, rgba(10,10,10,0.9) 100%)' }}
          />
        </div>

        {/* scanlines */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[1] opacity-25"
          style={{
            background:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.035) 2px, rgba(255,255,255,0.035) 4px)',
          }}
        />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-8 min-h-[82vh] flex flex-col justify-center py-16 pointer-events-none">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="telemetry text-accent"
          >
            // AI-VERIFIED CIVIC REPORTING
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.18, ease: EASE_OUT }}
            className="mt-6 font-display uppercase leading-[0.83] tracking-[-0.04em] text-[clamp(3.5rem,12vw,9.5rem)]"
          >
            Snap.
            <br />
            Map.
            <br />
            <span className="text-accent">Fixed.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.32 }}
            className="mt-7 max-w-md text-base text-[#9a978d] leading-relaxed"
          >
            CivicSnap turns one photo into a tracked, AI-categorized, mapped civic
            report. From pothole to resolved, kept on the public record.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.44 }}
            className="mt-9 flex flex-wrap gap-3 pointer-events-auto"
          >
            <Link to="/report">
              <button className="inline-flex items-center gap-2 h-14 px-8 bg-[#eaeaea] text-[#0a0a0a] font-mono font-semibold uppercase tracking-wide text-sm border-2 border-[#eaeaea] hover:bg-[#e61919] hover:border-[#e61919] hover:text-white active:translate-y-[2px] transition-colors">
                Report an issue <Icon name="arrow-right" size={16} />
              </button>
            </Link>
            <Link to="/map">
              <button className="inline-flex items-center gap-2 h-14 px-8 bg-transparent text-[#eaeaea] font-mono font-semibold uppercase tracking-wide text-sm border-2 border-[#3a3a3a] hover:border-[#eaeaea] active:translate-y-[2px] transition-colors">
                View map
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* TELEMETRY STAT STRIP */}
      <div className="rule-grid grid-cols-2 md:grid-cols-4 border-y-2 border-app">
        {[
          { n: 8, s: '', l: 'ISSUE TYPES' },
          { n: 4, s: '', l: 'STATUS STAGES' },
          { n: 20, s: 'S', l: 'TO FILE A REPORT' },
          { n: 100, s: '%', l: 'PUBLIC RECORD' },
        ].map((stat) => (
          <div key={stat.l} className="bg-app px-5 py-7">
            <p className="font-display text-4xl sm:text-5xl text-app">
              <CountUp to={stat.n} suffix={stat.s} />
            </p>
            <p className="telemetry text-soft mt-2">{stat.l}</p>
          </div>
        ))}
      </div>

      {/* PROTOCOL */}
      <section className="mx-auto max-w-7xl px-4 sm:px-8 py-16">
        <div className="flex items-end justify-between gap-4 mb-8">
          <h2 className="font-display text-3xl sm:text-5xl text-app">Operating protocol</h2>
          <span className="telemetry text-soft hidden sm:block">/ 04 STEPS</span>
        </div>
        <div className="rule-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-2 border-app">
          {STEPS.map((s, i) => (
            <div key={s.title} className="bg-surface p-6 h-full">
              <div className="flex items-start justify-between">
                <span className="font-display text-5xl text-app" style={{ opacity: 0.14 }}>{String(i + 1).padStart(2, '0')}</span>
                <Icon name={s.icon} size={26} className="text-accent" strokeWidth={2.25} />
              </div>
              <h3 className="mt-6 font-display text-lg text-app">{s.title}</h3>
              <p className="mt-2 text-sm text-soft leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORY REGISTRY */}
      <section className="border-y-2 border-app">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 py-6 flex items-center justify-between">
          <h2 className="font-display text-2xl sm:text-3xl text-app">Category registry</h2>
          <span className="telemetry text-soft">{CATEGORY_LIST.length} CLASSES</span>
        </div>
        <div className="rule-grid grid-cols-2 sm:grid-cols-4 border-t-2 border-app">
          {CATEGORY_LIST.map((c, i) => (
            <div key={c.id} className="bg-app px-5 py-6 flex items-center gap-3">
              <Icon name={c.icon} size={22} style={{ color: c.color }} strokeWidth={2.25} />
              <div className="min-w-0">
                <p className="telemetry text-soft">CAT-{String(i + 1).padStart(2, '0')}</p>
                <p className="text-sm font-semibold text-app truncate uppercase tracking-tight">{c.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* STATUS PIPELINE */}
      <section className="mx-auto max-w-7xl px-4 sm:px-8 py-16">
        <div className="flex items-end justify-between gap-4 mb-8">
          <h2 className="font-display text-3xl sm:text-5xl text-app">
            Transparent
            <br />
            pipeline
          </h2>
          <span className="telemetry text-accent inline-flex items-center gap-1.5">
            <span className="size-2 bg-accent" /> LIVE STATUS
          </span>
        </div>
        <StatusDemo />
      </section>

      {/* FEATURES */}
      <section className="border-t-2 border-app">
        <div className="rule-grid grid-cols-1 md:grid-cols-2 border-b-2 border-app">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-app p-8 h-full flex gap-5">
              <Icon name={f.icon} size={28} className="text-accent shrink-0" strokeWidth={2.25} />
              <div>
                <h3 className="font-display text-xl text-app">{f.title}</h3>
                <p className="mt-2 text-sm text-soft leading-relaxed max-w-sm">{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[var(--text)] text-[var(--bg)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 py-20 sm:py-28">
          <p className="telemetry" style={{ color: 'var(--accent)' }}>// FILE YOUR FIRST REPORT</p>
          <h2 className="mt-5 font-display uppercase leading-[0.88] tracking-[-0.04em] text-[clamp(2.75rem,9vw,7rem)]">
            Put it on
            <br />
            the <span style={{ color: 'var(--accent)' }}>record.</span>
          </h2>
          <p className="mt-6 max-w-md text-base opacity-70">
            Join your neighbors and report what needs fixing. It takes about 20 seconds.
          </p>
          <Link to="/report" className="inline-block mt-9">
            <button className="inline-flex items-center gap-2.5 h-14 px-8 bg-[var(--bg)] text-[var(--text)] font-mono font-semibold uppercase tracking-wide text-sm border-2 border-[var(--bg)] hover:bg-[var(--accent)] hover:border-[var(--accent)] hover:text-white active:translate-y-[2px] transition-colors">
              Get started <Icon name="arrow-right" size={16} />
            </button>
          </Link>
        </div>
      </section>

      {/* footer telemetry line */}
      <footer className="border-t-2 border-app">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 py-4 flex items-center justify-between">
          <span className="telemetry text-soft">© 2026 CIVICSNAP ®</span>
          <span className="telemetry text-soft">CIVIC INFRASTRUCTURE REGISTRY / AE</span>
        </div>
      </footer>
    </div>
  )
}
