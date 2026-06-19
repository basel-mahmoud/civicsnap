import { useEffect, useState } from 'react'

export interface LatLng {
  lat: number
  lng: number
}

// Sensible default view when we don't yet know where the user is.
// Centered on Dubai, UAE.
export const DEFAULT_CENTER: LatLng = { lat: 25.2048, lng: 55.2708 }
export const DEFAULT_ZOOM = 12

export function getCurrentPosition(
  options: PositionOptions = { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation is not supported by this browser.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      options,
    )
  })
}

type GeoStatus = 'idle' | 'locating' | 'ready' | 'denied' | 'error'

/**
 * Tracks the user's location. Resolves to their real position when permission is
 * granted, otherwise falls back to DEFAULT_CENTER so the map is never stranded.
 */
export function useUserLocation() {
  const [coords, setCoords] = useState<LatLng | null>(null)
  const [status, setStatus] = useState<GeoStatus>('idle')

  useEffect(() => {
    let active = true
    setStatus('locating')
    getCurrentPosition()
      .then((c) => {
        if (!active) return
        setCoords(c)
        setStatus('ready')
      })
      .catch((err: GeolocationPositionError | Error) => {
        if (!active) return
        const denied =
          typeof GeolocationPositionError !== 'undefined' &&
          'code' in err &&
          err.code === err.PERMISSION_DENIED
        setStatus(denied ? 'denied' : 'error')
      })
    return () => {
      active = false
    }
  }, [])

  return { coords, status }
}
