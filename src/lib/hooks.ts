import { useEffect, useRef, useState } from 'react'
import type { ResultInput } from '../types'

export interface GameProps {
  onResult: (result: ResultInput) => void
  onActive: (active: boolean) => void
  onStart: (start: () => void) => void
}

export function useRoundActivity(onActive: GameProps['onActive'], active: boolean) {
  useEffect(() => {
    onActive(active)
    return () => onActive(false)
  }, [onActive, active])
}

export function useNetwork() {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])
  return online
}

export function useOfflineCache() {
  const [status, setStatus] = useState(() => location.protocol === 'file:'
    ? 'Using the standalone offline copy'
    : 'serviceWorker' in navigator ? 'Offline copy available to download' : 'Offline caching unsupported - download the local copy')
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null)
  const requested = useRef(false)

  useEffect(() => {
    if (location.protocol === 'file:' || document.documentElement.dataset.release === 'dev') return
    if (!('serviceWorker' in navigator)) return
    let disposed = false
    const onControllerChange = () => {
      setWaiting(null)
      if (requested.current) location.reload()
    }
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)
    // The release script places this generated worker beside the standalone HTML.
    const workerUrl = new URL('./sw.js', document.baseURI)
    navigator.serviceWorker.register(workerUrl, { scope: './' }).then((registration) => {
      if (disposed) return
      if (registration.waiting && navigator.serviceWorker.controller) setWaiting(registration.waiting)
      const watchInstalling = () => {
        const worker = registration.installing
        worker?.addEventListener('statechange', () => {
          if (!disposed && worker.state === 'installed' && registration.waiting && navigator.serviceWorker.controller) setWaiting(registration.waiting)
        })
      }
      watchInstalling()
      registration.addEventListener('updatefound', watchInstalling)
      return navigator.serviceWorker.ready.then(() => {
        if (!disposed) {
          setStatus('Offline copy cached on this device')
          if (!registration.waiting) setWaiting(null)
        }
      })
    }).catch(() => {
      if (!disposed) setStatus(navigator.serviceWorker.controller
        ? 'Cached copy in use; update check unavailable'
        : 'Offline caching unavailable - download the local copy')
    })
    return () => {
      disposed = true
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
    }
  }, [])

  function applyUpdate() {
    requested.current = true
    waiting?.postMessage('ACTIVATE_UPDATE')
  }
  return { status, waiting, applyUpdate }
}
