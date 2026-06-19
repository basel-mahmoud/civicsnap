import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary:
    'text-ink-950 font-semibold bg-[linear-gradient(110deg,#34d399,#2dd4bf_55%,#22d3ee)] bg-[length:200%_auto] hover:bg-right shadow-[0_10px_30px_-8px_rgba(45,212,191,0.6)] hover:shadow-[0_14px_40px_-8px_rgba(45,212,191,0.75)] active:scale-[0.98] transition-all disabled:opacity-60',
  secondary:
    'glass text-app border border-app hover:border-brand-400/60 hover:bg-muted2 active:scale-[0.98] transition-all disabled:opacity-50',
  ghost: 'text-app hover:bg-muted2 disabled:opacity-50 transition-colors',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:scale-[0.98] transition-all disabled:bg-red-300',
}

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm rounded-full gap-1.5',
  md: 'h-11 px-5 text-sm rounded-full gap-2',
  lg: 'h-13 px-7 text-base rounded-full gap-2',
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
      className={`inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
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
