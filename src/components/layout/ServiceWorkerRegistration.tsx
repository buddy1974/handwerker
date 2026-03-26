'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Unregister all old service workers first, then re-register fresh
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        const unregisterAll = registrations.map((r) => r.unregister())
        Promise.all(unregisterAll).then(() => {
          navigator.serviceWorker
            .register('/sw.js')
            .then((reg) => console.log('[SW] Registered:', reg.scope))
            .catch((err) => console.warn('[SW] Registration failed:', err))
        })
      })

      // On controller change (new SW activated), reload once to get fresh bundle
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload()
      })
    }
  }, [])

  return null
}
