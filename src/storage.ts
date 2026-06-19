import { seedData } from './data'
import type { AuditEvent, LabDatabase } from './types'

const STORAGE_KEY = 'omc-micro-lab-db-v3'

export function loadDatabase(): LabDatabase {
  const stored = window.localStorage.getItem(STORAGE_KEY)

  if (!stored) {
    saveDatabase(seedData)
    return seedData
  }

  try {
    return { ...seedData, ...JSON.parse(stored) }
  } catch {
    saveDatabase(seedData)
    return seedData
  }
}

export function saveDatabase(database: LabDatabase) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(database))
}

export function createAuditEvent(
  action: string,
  itemType: string,
  itemId: string,
  user: string,
  summary: string,
): AuditEvent {
  return {
    id: `AUD-${Date.now()}`,
    action,
    itemType,
    itemId,
    user,
    dateTime: new Date().toISOString(),
    summary,
  }
}
