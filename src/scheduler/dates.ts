export const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function toLocalDate(value: string) {
  return new Date(`${value}T00:00:00`)
}

export function dateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

/** Monday of the week containing `date` (bench grid weeks run Mon-Fri). */
export function mondayOf(date: Date) {
  const day = date.getDay()
  return addDays(date, day === 0 ? -6 : 1 - day)
}

/** Saturday that starts the weekend containing `date` (only meaningful Sat/Sun). */
export function saturdayOf(date: Date) {
  const day = date.getDay()
  if (day === 0) return addDays(date, -1)
  return addDays(date, 6 - day)
}

/** Sunday-start month grid, like the wall calendar. */
export function monthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const gridStart = addDays(firstDay, -firstDay.getDay())
  const gridEnd = addDays(lastDay, 6 - lastDay.getDay())
  const days: { date: Date; key: string; inMonth: boolean }[] = []

  for (let date = gridStart; date <= gridEnd; date = addDays(date, 1)) {
    days.push({ date, key: dateKey(date), inMonth: date.getMonth() === month })
  }

  return days
}

export function formatShort(key: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
    toLocalDate(key),
  )
}

export function formatLong(key: string) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(toLocalDate(key))
}

/** "Jun 1 - Jun 5" label for a Monday-keyed bench week. */
export function formatBenchWeek(weekStartKey: string) {
  const monday = toLocalDate(weekStartKey)
  return `${formatShort(weekStartKey)} - ${formatShort(dateKey(addDays(monday, 4)))}`
}

/** "Jul 18 & 19" label for a Saturday-keyed weekend. */
export function formatWeekend(weekendStartKey: string) {
  const saturday = toLocalDate(weekendStartKey)
  const sunday = addDays(saturday, 1)
  const sameMonth = saturday.getMonth() === sunday.getMonth()
  return sameMonth
    ? `${formatShort(weekendStartKey)} & ${sunday.getDate()}`
    : `${formatShort(weekendStartKey)} & ${formatShort(dateKey(sunday))}`
}
