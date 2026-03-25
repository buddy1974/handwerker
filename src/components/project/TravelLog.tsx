'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Car } from 'lucide-react'

type Entry = {
  id: string
  distanceKm: string
  ratePerKm: string
  totalCost: string
  notes: string
  travelDate: string
}

export default function TravelLog({ projectId }: { projectId: string }) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ distanceKm: '', ratePerKm: '0.30', notes: '', travelDate: new Date().toISOString().split('T')[0] })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}/travel`)
    if (res.ok) setEntries(await res.json())
  }, [projectId])

  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!form.distanceKm) return
    setSaving(true)
    await fetch(`/api/projects/${projectId}/travel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setForm({ distanceKm: '', ratePerKm: '0.30', notes: '', travelDate: new Date().toISOString().split('T')[0] })
    setOpen(false)
    await load()
    setSaving(false)
  }

  const total = entries.reduce((sum, e) => sum + parseFloat(e.totalCost), 0)

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Car size={14} className="text-gray-400" />
          <h2 className="text-sm font-medium text-white">Fahrtkosten</h2>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-lg"
        >
          <Plus size={12} /> Hinzufügen
        </button>
      </div>

      {open && (
        <div className="p-4 border-b border-gray-800 space-y-3 bg-gray-800">
          <div className="grid grid-cols-2 gap-2">
            <input
              value={form.distanceKm}
              onChange={e => setForm(p => ({ ...p, distanceKm: e.target.value }))}
              type="number" step="0.1" min="0"
              placeholder="km *"
              className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
            />
            <input
              value={form.ratePerKm}
              onChange={e => setForm(p => ({ ...p, ratePerKm: e.target.value }))}
              type="number" step="0.01" min="0"
              placeholder="€/km"
              className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
            />
            <input
              value={form.travelDate}
              onChange={e => setForm(p => ({ ...p, travelDate: e.target.value }))}
              type="date"
              className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
            />
            <input
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              placeholder="Notiz"
              className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          {form.distanceKm && (
            <p className="text-blue-400 text-xs">
              = {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(
                parseFloat(form.distanceKm) * parseFloat(form.ratePerKm || '0')
              )}
            </p>
          )}
          <div className="flex gap-2">
            <button onClick={save} disabled={saving || !form.distanceKm} className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg py-1.5 text-sm">
              {saving ? 'Speichern...' : 'Speichern'}
            </button>
            <button onClick={() => setOpen(false)} className="px-3 py-1.5 bg-gray-700 text-gray-300 rounded-lg text-sm">Abbrechen</button>
          </div>
        </div>
      )}

      <div className="divide-y divide-gray-800">
        {entries.length === 0 ? (
          <p className="text-gray-600 text-xs text-center py-6">Keine Fahrten erfasst</p>
        ) : (
          entries.map(entry => (
            <div key={entry.id} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-white text-sm">{entry.distanceKm} km</p>
                <p className="text-gray-500 text-xs">{entry.travelDate} · {entry.ratePerKm} €/km</p>
              </div>
              <p className="text-white text-sm font-medium">
                {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(parseFloat(entry.totalCost))}
              </p>
            </div>
          ))
        )}
      </div>

      {entries.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-800 flex justify-between">
          <span className="text-gray-400 text-sm">Gesamt Fahrtkosten</span>
          <span className="text-white font-bold text-sm">
            {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(total)}
          </span>
        </div>
      )}
    </div>
  )
}
