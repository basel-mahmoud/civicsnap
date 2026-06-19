export function Logo({ className = 'size-8' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden>
      <path
        d="M16 2C9.925 2 5 6.925 5 13c0 7.5 11 17 11 17s11-9.5 11-17C27 6.925 22.075 2 16 2Z"
        fill="url(#cs-grad)"
      />
      <circle cx="16" cy="12.5" r="4.5" fill="white" />
      <circle cx="16" cy="12.5" r="2" fill="#059669" />
      <defs>
        <linearGradient id="cs-grad" x1="5" y1="2" x2="27" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#34d399" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-bold tracking-tight ${className}`}>
      <Logo />
      <span>
        Civic<span className="text-brand-600">Snap</span>
      </span>
    </span>
  )
}
