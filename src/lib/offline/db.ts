import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

export interface OfflineReport {
  id: string
  projectId: string
  title: string
  workDate: string
  description: string
  workDone: string
  materialsUsed: string
  nextSteps: string
  customerPresent: boolean
  customerName: string
  signaturePath: string | null
  checklistItems: { label: string; isChecked: boolean; notes: string }[]
  photoIds: string[]
  notes: string
  status: 'pending' | 'synced' | 'error'
  createdAt: string
  updatedAt: string
}

export interface OfflinePhoto {
  id: string
  reportId: string | null
  projectId: string
  blob: Blob
  caption: string
  takenAt: string
  status: 'pending' | 'synced' | 'error'
}

export interface OfflineTimeEntry {
  id: string
  projectId: string
  taskLabel: string
  startedAt: string
  stoppedAt: string | null
  notes: string
  isBillable: boolean
  status: 'pending' | 'synced' | 'error'
}

export interface CachedProject {
  id: string
  title: string
  projectNumber: string
  status: string
  customerName: string
  locationCity: string | null
  cachedAt: string
}

interface HandwerkOSDB extends DBSchema {
  reports: {
    key: string
    value: OfflineReport
    indexes: { 'by-project': string; 'by-status': string }
  }
  photos: {
    key: string
    value: OfflinePhoto
    indexes: { 'by-report': string; 'by-project': string }
  }
  timeEntries: {
    key: string
    value: OfflineTimeEntry
    indexes: { 'by-project': string; 'by-status': string }
  }
  projects: {
    key: string
    value: CachedProject
  }
}

let dbInstance: IDBPDatabase<HandwerkOSDB> | null = null

export async function getDB(): Promise<IDBPDatabase<HandwerkOSDB>> {
  if (dbInstance) return dbInstance

  dbInstance = await openDB<HandwerkOSDB>('handwerkos', 1, {
    upgrade(db) {
      const reportStore = db.createObjectStore('reports', { keyPath: 'id' })
      reportStore.createIndex('by-project', 'projectId')
      reportStore.createIndex('by-status', 'status')

      const photoStore = db.createObjectStore('photos', { keyPath: 'id' })
      photoStore.createIndex('by-report', 'reportId')
      photoStore.createIndex('by-project', 'projectId')

      const timeStore = db.createObjectStore('timeEntries', { keyPath: 'id' })
      timeStore.createIndex('by-project', 'projectId')
      timeStore.createIndex('by-status', 'status')

      db.createObjectStore('projects', { keyPath: 'id' })
    },
  })

  return dbInstance
}

export async function saveOfflineReport(report: OfflineReport): Promise<void> {
  const db = await getDB()
  await db.put('reports', report)
}

export async function getOfflineReports(): Promise<OfflineReport[]> {
  const db = await getDB()
  return db.getAll('reports')
}

export async function getPendingReports(): Promise<OfflineReport[]> {
  const db = await getDB()
  return db.getAllFromIndex('reports', 'by-status', 'pending')
}

export async function saveOfflinePhoto(photo: OfflinePhoto): Promise<void> {
  const db = await getDB()
  await db.put('photos', photo)
}

export async function getPhotosByProject(projectId: string): Promise<OfflinePhoto[]> {
  const db = await getDB()
  return db.getAllFromIndex('photos', 'by-project', projectId)
}

export async function saveOfflineTimeEntry(entry: OfflineTimeEntry): Promise<void> {
  const db = await getDB()
  await db.put('timeEntries', entry)
}

export async function getPendingTimeEntries(): Promise<OfflineTimeEntry[]> {
  const db = await getDB()
  return db.getAllFromIndex('timeEntries', 'by-status', 'pending')
}

export async function cacheProjects(projects: CachedProject[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('projects', 'readwrite')
  await Promise.all([
    ...projects.map(p => tx.store.put(p)),
    tx.done,
  ])
}

export async function getCachedProjects(): Promise<CachedProject[]> {
  const db = await getDB()
  return db.getAll('projects')
}

export function generateOfflineId(): string {
  return 'offline_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9)
}
