import { Link } from 'react-router-dom'
import { CATEGORY_LIST } from '@/lib/categories'
import { Button } from '@/components/ui'
import { Icon, type IconName } from '@/components/icons/Icon'

const STEPS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'camera',
    title: 'Snap a photo',
    body: 'See a pothole, broken light, or dumped trash? Take a picture right from your phone.',
  },
  {
    icon: 'sparkles',
    title: 'AI sorts it out',
    body: 'Claude vision reads the photo, picks the category, rates severity, and writes a clear title.',
  },
  {
    icon: 'route',
    title: 'Track to fixed',
    body: 'Your report drops a pin on the public map and moves from Reported → Acknowledged → Fixed.',
  },
]

export function Landing() {
  return (
    <div className="flex-1">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10 opacity-60"
          style={{
            background:
              'radial-gradient(60% 50% at 50% 0%, rgba(16,185,129,0.18), transparent 70%)',
          }}
        />
        <div className="mx-auto max-w-4xl px-4 pt-20 pb-16 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-app bg-surface px-3 py-1 text-xs font-medium text-soft">
            <span className="size-2 rounded-full bg-brand-500 animate-pulse" />
            Civic reporting, powered by AI vision
          </span>
          <h1 className="mt-6 text-4xl sm:text-6xl font-extrabold tracking-tight text-app text-balance">
            Fix your neighborhood,
            <br />
            <span className="text-brand-600">one snap at a time.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-soft text-pretty">
            CivicSnap turns a quick photo into a tracked, mapped, and prioritized civic
            report. No forms, no guesswork — just point, shoot, and watch it get fixed.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link to="/report">
              <Button size="lg">Report an issue</Button>
            </Link>
            <Link to="/map">
              <Button size="lg" variant="secondary">
                Explore the map
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-4 py-12">
        <div className="grid gap-6 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="bg-surface border border-app rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <span className="grid size-11 place-items-center rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600">
                  <Icon name={s.icon} size={22} />
                </span>
                <span className="text-sm font-bold text-soft">0{i + 1}</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-app">{s.title}</h3>
              <p className="mt-1.5 text-sm text-soft">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="text-center text-2xl font-bold text-app">Report anything that matters</h2>
        <p className="mt-2 text-center text-soft">
          From road hazards to broken lights — the AI knows the difference.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {CATEGORY_LIST.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-2 rounded-full border border-app bg-surface px-4 py-2 text-sm font-medium text-app"
            >
              <Icon name={c.icon} size={16} style={{ color: c.color }} />
              {c.label}
            </span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 py-16">
        <div className="rounded-3xl bg-brand-600 px-8 py-12 text-center text-white">
          <h2 className="text-3xl font-bold">Your block deserves better.</h2>
          <p className="mt-2 text-brand-50">
            Join your neighbors and start reporting today — it takes 20 seconds.
          </p>
          <Link to="/report" className="inline-block mt-6">
            <Button size="lg" variant="secondary">
              Make your first report
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
