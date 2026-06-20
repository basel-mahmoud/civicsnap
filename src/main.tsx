import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import 'leaflet/dist/leaflet.css'
import './index.css'
import App from './App.tsx'

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!clerkKey) {
  // eslint-disable-next-line no-console
  console.warn('[CivicSnap] Missing VITE_CLERK_PUBLISHABLE_KEY — auth will not work.')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={clerkKey} afterSignOutUrl="/">
      <App />
    </ClerkProvider>
  </StrictMode>,
)
