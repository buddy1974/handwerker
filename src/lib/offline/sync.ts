import {
  getPendingReports,
  getPendingTimeEntries,
  getDB,
  type OfflineReport,
  type OfflineTimeEntry,
} from './db'

export type SyncStatus = {
  reports: { pending: number; synced: number; errors: number }
  timeEntries: { pending: number; synced: number; errors: number }
  lastSync: string | null
  isSyncing: boolean
}

async function syncReport(report: OfflineReport): Promise<boolean> {
  try {
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: report.projectId,
        title: report.title,
        workDate: report.workDate,
        description: report.description,
        workDone: report.workDone,
        materialsUsed: report.materialsUsed,
        nextSteps: report.nextSteps,
        customerPresent: report.customerPresent,
        customerName: report.customerName,
        notes: report.notes,
        offlineId: report.id,
      }),
    })

    if (!res.ok) return false

    const db = await getDB()
    await db.put('reports', { ...report, status: 'synced' })
    return true
  } catch {
    const db = await getDB()
    await db.put('reports', { ...report, status: 'error' })
    return false
  }
}

async function syncTimeEntry(entry: OfflineTimeEntry): Promise<boolean> {
  try {
    const res = await fetch('/api/time', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: entry.projectId,
        taskLabel: entry.taskLabel,
        startedAt: entry.startedAt,
        stoppedAt: entry.stoppedAt,
        notes: entry.notes,
        isBillable: entry.isBillable,
      }),
    })

    if (!res.ok) return false

    const db = await getDB()
    await db.put('timeEntries', { ...entry, status: 'synced' })
    return true
  } catch {
    const db = await getDB()
    await db.put('timeEntries', { ...entry, status: 'error' })
    return false
  }
}

export async function syncAll(): Promise<SyncStatus> {
  const status: SyncStatus = {
    reports: { pending: 0, synced: 0, errors: 0 },
    timeEntries: { pending: 0, synced: 0, errors: 0 },
    lastSync: null,
    isSyncing: false,
  }

  const [pendingReports, pendingEntries] = await Promise.all([
    getPendingReports(),
    getPendingTimeEntries(),
  ])

  status.reports.pending = pendingReports.length
  status.timeEntries.pending = pendingEntries.length

  for (const report of pendingReports) {
    const ok = await syncReport(report)
    if (ok) status.reports.synced++
    else status.reports.errors++
  }

  for (const entry of pendingEntries) {
    const ok = await syncTimeEntry(entry)
    if (ok) status.timeEntries.synced++
    else status.timeEntries.errors++
  }

  status.lastSync = new Date().toISOString()
  return status
}

export async function getPendingCount(): Promise<number> {
  const [reports, entries] = await Promise.all([
    getPendingReports(),
    getPendingTimeEntries(),
  ])
  return reports.length + entries.length
}
