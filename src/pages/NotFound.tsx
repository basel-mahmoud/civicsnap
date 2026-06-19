import { Link } from 'react-router-dom'
import { Button } from '@/components/ui'

export function NotFound() {
  return (
    <div className="flex-1 grid place-items-center px-4 py-24 text-center">
      <div>
        <p className="text-6xl">🗺️</p>
        <h1 className="mt-4 text-2xl font-bold text-app">Page not found</h1>
        <p className="mt-2 text-soft">This street isn't on our map.</p>
        <Link to="/" className="inline-block mt-6">
          <Button>Back home</Button>
        </Link>
      </div>
    </div>
  )
}
