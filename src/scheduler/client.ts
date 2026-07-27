import { createClient } from '@supabase/supabase-js'

// Shared backend for the live scheduler. The publishable key is safe to ship;
// row-level security only allows emails on the sched_leads allowlist to
// read or write schedule data.
const SUPABASE_URL = 'https://rqulntyhlrcmvctgaxut.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Yi1ImHcoJTD8awMjk_E3lw_jrwrNnpP'

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)

// Pre-launch switch. While false, the scheduler skips the lead sign-in gate and
// the database allows access without a login (the "temp prelaunch open access"
// policies). Before going live: set this to true AND drop those policies:
//   drop policy "temp prelaunch open access" on <each sched_* table>;
export const AUTH_ENABLED = false

// Bench columns exactly as they appear on the paper "Tentative Schedule" grid.
export const schedulerBenches = [
  'ANA',
  'Bench 1',
  'Bench 2',
  'Bench 3',
  'Bench 4',
  'Bench 5',
  'Set Up 1',
  'BACTEC',
  'AFB',
  'MALDI',
  'MicroScan',
  'HPV',
  'Molecular',
  'Float',
] as const

export const weekendSlotTypes = ['Sat/Sun', 'Sat', 'Molec Sat', 'Molec Sun', 'Sun'] as const

// Default rows for a new weekend card, matching the paper rotation sheet.
export const defaultWeekendSlots = [
  'Sat/Sun',
  'Sat',
  'Sat/Sun',
  'Sat',
  'Sat/Sun',
  'Sat',
  'Molec Sat',
  'Molec Sun',
  'Sun',
]

export interface StaffRow {
  id: string
  name: string
  active: boolean
}

export interface LeadRow {
  email: string
  display_name: string | null
  added_by: string | null
}

export interface DayOffRow {
  id: string
  off_date: string
  staff_name: string
  note: string
  created_by: string
  created_at: string
  removed_by: string | null
  removed_at: string | null
}

export interface DayNoteRow {
  id: string
  note_date: string
  note: string
  created_by: string
}

export interface BenchWeekRow {
  id: string
  week_start: string
  bench: string
  staff_name: string
  updated_by: string
}

export interface BenchOverrideRow {
  id: string
  override_date: string
  bench: string
  staff_name: string
  reason: string
  created_by: string
}

export interface WeekendSlotRow {
  id: string
  weekend_start: string
  position: number
  slot_type: string
  staff_name: string
  original_staff_name: string
  updated_by: string
}

export interface SchedAuditRow {
  id: string
  action: string
  item_type: string
  summary: string
  user_email: string
  created_at: string
}

export interface SchedulerData {
  staff: StaffRow[]
  leads: LeadRow[]
  daysOff: DayOffRow[]
  dayNotes: DayNoteRow[]
  benchWeeks: BenchWeekRow[]
  benchOverrides: BenchOverrideRow[]
  weekendSlots: WeekendSlotRow[]
  audit: SchedAuditRow[]
}

export async function loadSchedulerData(): Promise<SchedulerData> {
  const [staff, leads, daysOff, dayNotes, benchWeeks, benchOverrides, weekendSlots, audit] =
    await Promise.all([
      supabase.from('sched_staff').select('*').order('name'),
      supabase.from('sched_leads').select('*').order('email'),
      supabase.from('sched_days_off').select('*').order('created_at'),
      supabase.from('sched_day_notes').select('*').order('created_at'),
      supabase.from('sched_bench_week').select('*'),
      supabase.from('sched_bench_day_override').select('*').order('override_date'),
      supabase.from('sched_weekend_slots').select('*').order('position'),
      supabase.from('sched_audit').select('*').order('created_at', { ascending: false }).limit(80),
    ])

  const failed = [staff, leads, daysOff, dayNotes, benchWeeks, benchOverrides, weekendSlots, audit]
    .map((result) => result.error)
    .find(Boolean)
  if (failed) throw new Error(failed.message)

  return {
    staff: staff.data ?? [],
    leads: leads.data ?? [],
    daysOff: daysOff.data ?? [],
    dayNotes: dayNotes.data ?? [],
    benchWeeks: benchWeeks.data ?? [],
    benchOverrides: benchOverrides.data ?? [],
    weekendSlots: weekendSlots.data ?? [],
    audit: audit.data ?? [],
  }
}

export async function logSchedAudit(
  action: string,
  itemType: string,
  summary: string,
  userEmail: string,
) {
  await supabase
    .from('sched_audit')
    .insert({ action, item_type: itemType, summary, user_email: userEmail })
}

export function reportSaveError(error: { message: string } | null) {
  if (error) window.alert(`Save failed: ${error.message}`)
  return Boolean(error)
}
