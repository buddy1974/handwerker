'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type Project = {
  id: string
  title: string
  projectNumber: string | null
  status: string | null
  startDate: string | null
  endDate: string | null
  locationCity: string | null
  customer: { name: string } | null
}

type Worker = {
  id: string
  firstName: string
  lastName: string
  role: string
}

function getWeekDays(date: Date): Date[] {
  const monday = new Date(date)
  monday.setDate(date.getDate() - date.getDay() + 1)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function formatDay(date: Date): string {
  return date.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })
}

function isToday(date: Date): boolean {
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

function isInRange(date: Date, start: string | null, end: string | null): boolean {
  if (!start && !end) return false
  const d = date.getTime()
  const s = start ? new Date(start).getTime() : 0
  const e = end ? new Date(end).getTime() : Infinity
  return d >= s && d <= e
}

const statusColor: Record<string, string> = {
  draft: 'bg-gray-700',
  active: 'bg-green-800',
  paused: 'bg-yellow-800',
  completed: 'bg-blue-800',
  cancelled: 'bg-red-900',
}

export default function PlantafelBoard({
  projects,
  workers,
}: {
  projects: Project[]
  workers: Worker[]
}) {
  const [weekOffset, setWeekOffset] = useState(0)
  const [view, setView] = useState<'projects' | 'workers'>('projects')

  const baseDate = new Date()
  baseDate.setDate(baseDate.getDate() + weekOffset * 7)
  const days = getWeekDays(baseDate)

  const weekLabel = `${days[0].toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })} – ${days[6].toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })}`

  const activeProjects = projects.filter(p => p.status !== 'cancelled')

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset(w => w - 1)}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-white text-sm font-medium min-w-48 text-center">{weekLabel}</span>
          <button
            onClick={() => setWeekOffset(w => w + 1)}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 text-xs rounded-lg"
          >
            Heute
          </button>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setView('projects')}
            className={`px-3 py-1.5 rounded-lg text-xs ${view === 'projects' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}
          >
            Projekte
          </button>
          <button
            onClick={() => setView('workers')}
            className={`px-3 py-1.5 rounded-lg text-xs ${view === 'workers' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}
          >
            Mitarbeiter
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-max">
          <thead>
            <tr>
              <th className="text-left p-3 bg-gray-900 border border-gray-800 text-gray-400 text-xs font-medium w-48">
                {view === 'projects' ? 'Projekt' : 'Mitarbeiter'}
              </th>
              {days.map((day, i) => (
                <th
                  key={i}
                  className={`p-2 border border-gray-800 text-xs font-medium text-center w-28 ${
                    isToday(day) ? 'bg-blue-950 text-blue-400' : 'bg-gray-900 text-gray-400'
                  }`}
                >
                  {formatDay(day)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {view === 'projects' && activeProjects.map(project => (
              <tr key={project.id} className="hover:bg-gray-900/50">
                <td className="p-3 border border-gray-800 bg-gray-900">
                  <Link href={`/projects/${project.id}`} className="hover:underline">
                    <p className="text-white text-xs font-medium truncate max-w-40">{project.title}</p>
                    <p className="text-gray-500 text-xs">{project.projectNumber}</p>
                    {project.customer && <p className="text-gray-600 text-xs truncate">{project.customer.name}</p>}
                  </Link>
                </td>
                {days.map((day, i) => {
                  const active = isInRange(day, project.startDate, project.endDate)
                  return (
                    <td
                      key={i}
                      className={`border border-gray-800 p-1 text-center ${
                        isToday(day) ? 'bg-blue-950/30' : 'bg-gray-950'
                      }`}
                    >
                      {active && (
                        <div className={`rounded px-1 py-0.5 text-xs text-white ${statusColor[project.status ?? 'draft']}`}>
                          {project.locationCity || '●'}
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}

            {view === 'workers' && workers.map(worker => (
              <tr key={worker.id} className="hover:bg-gray-900/50">
                <td className="p-3 border border-gray-800 bg-gray-900">
                  <p className="text-white text-xs font-medium">{worker.firstName} {worker.lastName}</p>
                  <p className="text-gray-500 text-xs">{worker.role}</p>
                </td>
                {days.map((day, i) => (
                  <td
                    key={i}
                    className={`border border-gray-800 p-1 ${
                      isToday(day) ? 'bg-blue-950/30' : 'bg-gray-950'
                    }`}
                  >
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex gap-3 flex-wrap">
        {Object.entries(statusColor).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded ${color}`} />
            <span className="text-gray-400 text-xs capitalize">{status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
