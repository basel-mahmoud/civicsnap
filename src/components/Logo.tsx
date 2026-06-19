// Industrial marker: a hard ink pin with a hazard-red core. No gradients.
export function Logo({ className = 'size-8' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden>
      <path
        d="M16 2C9.925 2 5 6.925 5 13c0 7.5 11 17 11 17s11-9.5 11-17C27 6.925 22.075 2 16 2Z"
        fill="var(--text)"
      />
      <rect x="11.5" y="8.5" width="9" height="9" fill="var(--accent)" />
    </svg>
  )
}

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display uppercase tracking-tight ${className}`}>
      <Logo />
      <span>
        Civic<span className="text-accent">Snap</span>
      </span>
    </span>
  )
}
