import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

// Industrial brutalist: square, bordered, no glow. Uppercase mono-ish labels,
// invert on hover, physical press via translate.
const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-[var(--text)] text-[var(--bg)] border-2 border-[var(--text)] hover:bg-[var(--accent)] hover:border-[var(--accent)] hover:text-white active:translate-y-[2px] transition-colors disabled:opacity-40',
  secondary:
    'bg-transparent text-app border-2 border-[var(--text)] hover:bg-[var(--text)] hover:text-[var(--bg)] active:translate-y-[2px] transition-colors disabled:opacity-40',
  ghost: 'text-app border-2 border-transparent hover:bg-muted2 active:translate-y-[2px] transition-colors disabled:opacity-40',
  danger:
    'bg-[var(--accent)] text-white border-2 border-[var(--accent)] hover:bg-[var(--text)] hover:border-[var(--text)] active:translate-y-[2px] transition-colors disabled:opacity-40',
}

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-4 text-xs gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-14 px-8 text-sm gap-2.5',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  loading,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  loading?: boolean
}) {
  return (
    <button
      className={`inline-flex items-center justify-center font-semibold uppercase tracking-wide font-mono focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  )
}

export function Spinner({ className = 'size-5' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

export function Badge({
  children,
  color,
  bg,
  className = '',
}: {
  children: ReactNode
  color?: string
  bg?: string
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}
      style={color ? { color, backgroundColor: bg } : undefined}
    >
      {children}
    </span>
  )
}

export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`bg-surface border border-app rounded-2xl ${className}`}>{children}</div>
  )
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-app">{label}</span>
      {children}
      {error ? (
        <span className="text-xs text-red-500">{error}</span>
      ) : hint ? (
        <span className="block text-xs text-soft">{hint}</span>
      ) : null}
    </label>
  )
}

export const inputClass =
  'w-full h-10 px-3 rounded-xl bg-app border border-app text-app placeholder:text-soft focus:outline-2 focus:outline-offset-0 focus:outline-brand-500 transition'
