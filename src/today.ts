// Single source of truth for "today" across the app.
//
// In normal use this returns the real current date so coverage gaps,
// due-soon, and overdue calculations reflect reality. A dev override is
// supported via localStorage key `omc-micro-today-override` (YYYY-MM-DD)
// or the `?today=YYYY-MM-DD` query string, so demos and tests can pin a date.

const OVERRIDE_KEY = 'omc-micro-today-override'
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function readOverride(): string | null {
  try {
    const fromQuery = new URLSearchParams(window.location.search).get('today')
    if (fromQuery && ISO_DATE.test(fromQuery)) return fromQuery

    const fromStorage = window.localStorage.getItem(OVERRIDE_KEY)
    if (fromStorage && ISO_DATE.test(fromStorage)) return fromStorage
  } catch {
    // Ignore storage/URL access issues and fall back to the real date.
  }

  return null
}

/** Returns today's date as a `YYYY-MM-DD` string in the local timezone. */
export function getToday(): string {
  const override = readOverride()
  if (override) return override

  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
