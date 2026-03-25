'use client'

import { useState, useEffect, useCallback } from 'react'
import { Wifi, WifiOff, RefreshCw, FolderOpen, Plus, Clock, FileText, Camera } from 'lucide-react'
import { getCachedProjects, cacheProjects, type CachedProject } from '@/lib/offline/db'
import { syncAll, getPendingCount } from '@/lib/offline/sync'

export default function FieldPage() {
  const [online, setOnline] = useState(true)
  const [projects, setProjects] = useState<CachedProject[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState<string | null>(null)
  const [selectedProject, setSelectedProject] = useState<CachedProject | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProjects = useCallback(async () => {
    setLoading(true)
    if (navigator.onLine) {
      try {
        const res = await fetch('/api/projects')
        if (res.ok) {
          const data = await res.json()
          const toCache: CachedProject[] = data.map((p: any) => ({
            id: p.id,
            title: p.title,
            projectNumber: p.projectNumber,
            status: p.status,
            customerName: p.customer?.name ?? '—',
            locationCity: p.locationCity ?? null,
            cachedAt: new Date().toISOString(),
          }))
          await cacheProjects(toCache)
          setProjects(toCache)
        }
      } catch {
        const cached = await getCachedProjects()
        setProjects(cached)
      }
    } else {
      const cached = await getCachedProjects()
      setProjects(cached)
    }
    const count = await getPendingCount()
    setPendingCount(count)
    setLoading(false)
  }, [])

  useEffect(() => {
    setOnline(navigator.onLine)
    loadProjects()

    const handleOnline = () => { setOnline(true); loadProjects() }
    const handleOffline = () => setOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [loadProjects])

  const handleSync = async () => {
    if (!online) { setSyncMsg('Keine Verbindung'); return }
    setSyncing(true)
    setSyncMsg(null)
    const result = await syncAll()
    const total = result.reports.synced + result.timeEntries.synced
    setSyncMsg(total > 0 ? `${total} Einträge synchronisiert` : 'Alles aktuell')
    setPendingCount(0)
    setSyncing(false)
    setTimeout(() => setSyncMsg(null), 3000)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">

      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <a href="/dashboard" className="text-white font-bold text-lg hover:opacity-80 transition-opacity">
          Handwerk<span className="text-blue-500">OS</span>
        </a>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <span className="bg-orange-600 text-white text-xs px-2 py-0.5 rounded-full">
              {pendingCount} ausstehend
            </span>
          )}
          <div className="flex items-center gap-1.5">
            {online
              ? <Wifi size={16} className="text-green-400" />
              : <WifiOff size={16} className="text-red-400" />
            }
            <span className={`text-xs ${online ? 'text-green-400' : 'text-red-400'}`}>
              {online ? 'Online' : 'Offline'}
            </span>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing || !online}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
          >
            <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
            Sync
          </button>
          <a
            href="/dashboard"
            className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs px-3 py-1.5 rounded-lg transition-colors"
          >
            Dashboard
          </a>
        </div>
      </header>

      {syncMsg && (
        <div className="bg-green-900 border-b border-green-700 px-4 py-2 text-green-300 text-sm text-center">
          {syncMsg}
        </div>
      )}

      <main className="flex-1 p-4">
        {selectedProject ? (
          <ProjectActions
            project={selectedProject}
            onBack={() => setSelectedProject(null)}
          />
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-white font-bold text-xl">Meine Projekte</h1>
              <span className="text-gray-500 text-sm">{projects.length} Projekte</span>
            </div>

            {loading ? (
              <div className="text-center py-16 text-gray-500 text-sm">Laden...</div>
            ) : projects.length === 0 ? (
              <div className="text-center py-16">
                <FolderOpen size={40} className="mx-auto mb-3 text-gray-700" />
                <p className="text-gray-500 text-sm">Keine Projekte verfügbar</p>
                {!online && (
                  <p className="text-gray-600 text-xs mt-2">Offline — Projekte werden nach Verbindung geladen</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {projects.map(project => (
                  <button
                    key={project.id}
                    onClick={() => setSelectedProject(project)}
                    className="w-full text-left bg-gray-900 border border-gray-800 active:border-blue-600 rounded-xl p-4 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-500 text-xs font-mono">{project.projectNumber}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        project.status === 'active'
                          ? 'bg-green-950 text-green-400'
                          : 'bg-gray-800 text-gray-400'
                      }`}>
                        {project.status === 'active' ? 'Aktiv' : project.status}
                      </span>
                    </div>
                    <p className="text-white font-medium">{project.title}</p>
                    <p className="text-gray-500 text-sm mt-0.5">{project.customerName}</p>
                    {project.locationCity && (
                      <p className="text-gray-600 text-xs mt-1">📍 {project.locationCity}</p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

function ProjectActions({
  project,
  onBack,
}: {
  project: CachedProject
  onBack: () => void
}) {
  const [gpsStatus, setGpsStatus] = useState<'checking' | 'ok' | 'denied' | null>(null)
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    if (!('geolocation' in navigator)) return
    setGpsStatus('checking')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGpsStatus('ok')
      },
      () => setGpsStatus('denied'),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    )
  }, [])

  const actions = [
    { icon: Clock, label: 'Zeit erfassen', desc: 'Timer starten oder stoppen', href: '/time', color: 'text-blue-400' },
    { icon: FileText, label: 'Bericht erstellen', desc: 'Servicebericht + Unterschrift', href: '#report', color: 'text-green-400' },
    { icon: Camera, label: 'Fotos aufnehmen', desc: 'Fotos zum Projekt hinzufügen', href: '#photos', color: 'text-purple-400' },
    { icon: Plus, label: 'Notiz hinzufügen', desc: 'Schnelle Projektnotiz', href: '#note', color: 'text-orange-400' },
  ]

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 text-sm mb-4"
      >
        ← Zurück
      </button>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
        <span className="text-gray-500 text-xs font-mono">{project.projectNumber}</span>
        <h2 className="text-white font-bold text-lg mt-1">{project.title}</h2>
        <p className="text-gray-400 text-sm">{project.customerName}</p>
        {project.locationCity && (
          <p className="text-gray-500 text-xs mt-1">📍 {project.locationCity}</p>
        )}
      </div>

      {gpsStatus && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs mb-3 ${
          gpsStatus === 'ok' ? 'bg-green-950 text-green-400' :
          gpsStatus === 'checking' ? 'bg-gray-800 text-gray-400' :
          'bg-red-950 text-red-400'
        }`}>
          <span>{
            gpsStatus === 'ok' ? '📍 Standort erfasst' :
            gpsStatus === 'checking' ? '📍 Standort wird ermittelt...' :
            '📍 Standortzugriff verweigert'
          }</span>
          {gpsCoords && (
            <a
              href={`https://www.google.com/maps?q=${gpsCoords.lat},${gpsCoords.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto underline opacity-60"
            >
              Karte
            </a>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {actions.map(({ icon: Icon, label, desc, href, color }) => (
          <a
            key={label}
            href={href.startsWith('/') ? href : undefined}
            onClick={href.startsWith('#') ? (e) => { e.preventDefault(); alert('Kommt in der nächsten Phase') } : undefined}
            className="bg-gray-900 border border-gray-800 active:border-gray-600 rounded-xl p-4 transition-colors block"
          >
            <Icon size={24} className={`${color} mb-2`} />
            <p className="text-white font-medium text-sm">{label}</p>
            <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
          </a>
        ))}
      </div>
    </div>
  )
}
