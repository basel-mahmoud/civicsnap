import { SignIn as ClerkSignIn } from '@clerk/clerk-react'
import { Link, useSearchParams } from 'react-router-dom'
import { Logo } from '@/components/Logo'

// Clerk-hosted sign-in / sign-up (email + Google). Hash routing keeps the whole
// flow under /signin. Auth, verification, and OAuth are all handled by Clerk.
export function SignIn() {
  const [params] = useSearchParams()
  const redirect = params.get('redirect') || '/map'

  return (
    <div className="flex-1 grid place-items-center px-4 py-14">
      <div className="flex flex-col items-center">
        <Link to="/" className="flex items-center gap-2 font-display uppercase text-xl mb-8">
          <Logo className="size-8" />
          Civic<span className="text-accent">Snap</span>
        </Link>
        <ClerkSignIn
          routing="hash"
          signUpUrl="/signin"
          fallbackRedirectUrl={redirect}
          appearance={{
            variables: {
              colorPrimary: '#e0a23a',
              colorBackground: '#131c2e',
              colorText: '#e8e2d4',
              colorInputBackground: '#0c1322',
              colorInputText: '#e8e2d4',
              borderRadius: '0px',
              fontFamily: 'Archivo, system-ui, sans-serif',
            },
          }}
        />
      </div>
    </div>
  )
}
