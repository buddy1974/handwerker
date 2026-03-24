'use client'

import { useState, useEffect, useCallback } from 'react'
import { Play, Square, Clock } from 'lucide-react'

type Project = { id: string; title: string; projectNumber: string }
type TimeEntry = {
  id: string
  taskLabel: string | null
  startedAt: string
  stoppedAt: string | null
  durationMin: number | null
  isBillable: boolean
  project: { id: string; title: string; projectNumber: string } | null
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${String(m).padStart(2, '0')}m`
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function TimePage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [running, setRunning] = useState<TimeEntry | null>(null)
  const [selectedProject, setSelectedProject] = useState('')
  const [taskLabel, setTaskLabel] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [proj, entr, run] = await Promise.all([
      fetch('/api/projects').then(r => r.json()),
      fetch('/api/time').then(r => r.json()),
      fetch('/api/time?running=true').then(r => r.json()),
    ])
    setProjects(proj)
    setEntries(entr)
    setRunning(run.length > 0 ? run[0] : null)
    if (run.length > 0) {
      setElapsed(Math.floor((Date.now() - new Date(run[0].startedAt).getTime()) / 1000))
    }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!running) return
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(running.startedAt).getTime()) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [running])

  const start = async () => {
    if (!selectedProject) { setError('Bitte Projekt auswählen'); return }
    setLoading(true)
    setError(null)
    const res = await fetch('/api/time', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: selectedProject,
        taskLabel: taskLabel || undefined,
        startedAt: new Date().toISOString(),
        isBillable: true,
      }),
    })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Fehler beim Starten')
    } else {
      setTaskLabel('')
      await load()
    }
    setLoading(false)
  }

  const stop = async () => {
    if (!running) return
    setLoading(true)
    await fetch(`/api/time/${running.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stoppedAt: new Date().toISOString() }),
    })
    setRunning(null)
    setElapsed(0)
    await load()
    setLoading(false)
  }

  const elapsedStr = () => {
    const h = Math.floor(elapsed / 3600)
    const m = Math.floor((elapsed % 3600) / 60)
    const s = elapsed % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const totalToday = entries
    .filter(e => e.stoppedAt && formatDate(e.startedAt) === formatDate(new Date().toISOString()))
    .reduce((sum, e) => sum + (e.durationMin ?? 0), 0)

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Zeiterfassung</h1>
        <p className="text-gray-400 text-sm mt-1">
          Heute: {formatDuration(totalToday)}
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
        {running ? (
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 text-sm font-medium">Läuft</span>
            </div>
            <div className="text-4xl font-mono font-bold text-white mb-2">{elapsedStr()}</div>
            <p className="text-gray-400 text-sm mb-1">
              {running.project?.title ?? 'Unbekanntes Projekt'}
            </p>
            {running.taskLabel && (
              <p className="text-gray-500 text-xs mb-4">{running.taskLabel}</p>
            )}
            <button
              onClick={stop}
              disabled={loading}
              className="flex items-center gap-2 mx-auto bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-medium rounded-lg px-6 py-2 text-sm transition-colors"
            >
              <Square size={14} />
              Stoppen
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Projekt *</label>
              <select
                value={selectedProject}
                onChange={e => setSelectedProject(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">— Projekt auswählen —</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.projectNumber} — {p.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Tätigkeit (optional)</label>
              <input
                value={taskLabel}
                onChange={e => setTaskLabel(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                placeholder="z.B. Montage, Vorbereitung..."
              />
            </div>
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}
            <button
              onClick={start}
              disabled={loading}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-medium rounded-lg px-6 py-2 text-sm transition-colors"
            >
              <Play size={14} />
              Starten
            </button>
          </div>
        )}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
          <Clock size={14} />
          Letzte Einträge
        </h2>

        {entries.filter(e => e.stoppedAt).length === 0 ? (
          <p className="text-gray-500 text-sm">Noch keine abgeschlossenen Einträge.</p>
        ) : (
          <div className="space-y-2">
            {entries.filter(e => e.stoppedAt).slice(0, 20).map(entry => (
              <div
                key={entry.id}
                className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">
                    {entry.project?.title ?? '—'}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {entry.taskLabel || 'Keine Tätigkeit'} · {formatDate(entry.startedAt)}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-white text-sm font-mono">
                    {entry.durationMin != null ? formatDuration(entry.durationMin) : '—'}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {formatTime(entry.startedAt)} – {entry.stoppedAt ? formatTime(entry.stoppedAt) : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
