import type { Session } from '@supabase/supabase-js'
import { AlertTriangle, CalendarDays, Grid3x3, History, LogOut, RefreshCw, Sunrise } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { FormModal, type FormModalConfig } from '../FormModal'
import { getToday } from '../today'
import { AccessHistoryTab } from './AccessHistoryTab'
import { BenchGridTab } from './BenchGridTab'
import {
  AUTH_ENABLED,
  loadSchedulerData,
  parseOffTag,
  supabase,
  type SchedulerData,
} from './client'
import { dateKey, formatLong, mondayOf, saturdayOf, toLocalDate } from './dates'
import { DaysOffTab } from './DaysOffTab'
import { WeekendTab } from './WeekendTab'

type SchedTab = 'Days Off' | 'Bench Grid' | 'Weekend Rotation' | 'Access & History'

const tabs: { key: SchedTab; icon: typeof CalendarDays }[] = [
  { key: 'Days Off', icon: CalendarDays },
  { key: 'Bench Grid', icon: Grid3x3 },
  { key: 'Weekend Rotation', icon: Sunrise },
  { key: 'Access & History', icon: History },
]

export interface TabProps {
  data: SchedulerData
  email: string
  reload: () => void
  openForm: (config: FormModalConfig) => void
  staffNames: string[]
}

export function SchedulePage() {
  if (!AUTH_ENABLED) return <SchedulerWorkspace email="pre-launch testing" />
  return <AuthGate />
}

function AuthGate() {
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [leadCheck, setLeadCheck] = useState<{ userId: string; isLead: boolean } | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthReady(true)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setAuthReady(true)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return
    let cancelled = false
    const userId = session.user.id
    supabase.rpc('is_sched_lead').then(({ data }) => {
      if (!cancelled) setLeadCheck({ userId, isLead: Boolean(data) })
    })
    return () => {
      cancelled = true
    }
  }, [session])

  const isLead =
    session && leadCheck?.userId === session.user.id ? leadCheck.isLead : null

  if (!authReady) return <p className="empty-state">Checking sign-in...</p>
  if (!session) return <SignInCard />
  if (isLead === null) return <p className="empty-state">Checking lead access...</p>
  if (!isLead) return <NoAccessCard email={session.user.email ?? ''} />
  return <SchedulerWorkspace email={session.user.email ?? ''} />
}

function SignInCard() {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setMessage('')

    const { error } =
      mode === 'sign-in'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })

    setBusy(false)
    if (error) {
      setMessage(error.message)
    } else if (mode === 'sign-up') {
      setMessage(
        'Account created. If email confirmation is on, check your inbox first. Then ask an existing lead to add your email under Access & History.',
      )
    }
  }

  return (
    <div className="auth-card">
      <h2>Lead tech sign-in</h2>
      <p>
        The live schedule is shared between lead techs. Sign in with your lead account, or create
        one and ask a current lead to add your email to the access list.
      </p>
      <form onSubmit={handleSubmit}>
        <label>
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label>
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
            minLength={6}
            required
          />
        </label>
        {message && <p className="auth-message">{message}</p>}
        <div className="auth-actions">
          <button className="primary" type="submit" disabled={busy}>
            {busy ? 'Working...' : mode === 'sign-in' ? 'Sign in' : 'Create account'}
          </button>
          <button
            className="secondary"
            type="button"
            onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
          >
            {mode === 'sign-in' ? 'Need an account?' : 'Have an account? Sign in'}
          </button>
        </div>
      </form>
    </div>
  )
}

function NoAccessCard({ email }: { email: string }) {
  return (
    <div className="auth-card">
      <h2>Almost there</h2>
      <p>
        You are signed in as <strong>{email}</strong>, but this email is not on the lead access
        list yet. Ask a current lead tech to add it under the Access &amp; History tab, then
        refresh this page.
      </p>
      <div className="auth-actions">
        <button className="secondary" onClick={() => window.location.reload()}>
          <RefreshCw size={16} /> Refresh
        </button>
        <button className="secondary" onClick={() => supabase.auth.signOut()}>
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </div>
  )
}

function SchedulerWorkspace({ email }: { email: string }) {
  const [data, setData] = useState<SchedulerData | null>(null)
  const [loadError, setLoadError] = useState('')
  const [tab, setTab] = useState<SchedTab>('Days Off')
  const [activeForm, setActiveForm] = useState<FormModalConfig | null>(null)

  const reload = useCallback(() => {
    loadSchedulerData()
      .then((next) => {
        setData(next)
        setLoadError('')
      })
      .catch((error: Error) => setLoadError(error.message))
  }, [])

  useEffect(() => reload(), [reload])

  const staffNames = useMemo(
    () => (data ? data.staff.filter((person) => person.active).map((person) => person.name) : []),
    [data],
  )

  if (loadError) {
    return (
      <div className="auth-card">
        <h2>Could not load the schedule</h2>
        <p>{loadError}</p>
        <button className="secondary" onClick={reload}>
          <RefreshCw size={16} /> Try again
        </button>
      </div>
    )
  }

  if (!data) return <p className="empty-state">Loading the schedule...</p>

  const tabProps: TabProps = { data, email, reload, openForm: setActiveForm, staffNames }

  return (
    <div className="stack">
      <TodayStrip data={data} />

      <div className="toolbar sched-toolbar">
        <div className="segmented sched-tabs">
          {tabs.map(({ key, icon: Icon }) => (
            <button key={key} className={tab === key ? 'selected' : ''} onClick={() => setTab(key)}>
              <Icon size={15} /> {key}
            </button>
          ))}
        </div>
        {AUTH_ENABLED ? (
          <span className="sched-signed-in">
            {email}
            <button className="icon-button" title="Sign out" onClick={() => supabase.auth.signOut()}>
              <LogOut size={15} />
            </button>
          </span>
        ) : (
          <span className="sched-signed-in">Testing mode - no sign-in (pre-launch)</span>
        )}
      </div>

      <datalist id="sched-staff-options">
        {staffNames.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>

      {tab === 'Days Off' && <DaysOffTab {...tabProps} />}
      {tab === 'Bench Grid' && <BenchGridTab {...tabProps} />}
      {tab === 'Weekend Rotation' && <WeekendTab {...tabProps} />}
      {tab === 'Access & History' && <AccessHistoryTab {...tabProps} />}

      {activeForm && <FormModal config={activeForm} onClose={() => setActiveForm(null)} />}
    </div>
  )
}

function TodayStrip({ data }: { data: SchedulerData }) {
  const todayKey = getToday()
  const todayDate = toLocalDate(todayKey)
  const weekKey = dateKey(mondayOf(todayDate))
  const isWeekend = todayDate.getDay() === 0 || todayDate.getDay() === 6

  const offEntriesToday = data.daysOff.filter(
    (entry) => entry.off_date === todayKey && !entry.removed_at,
  )
  const offToday = [...new Set(offEntriesToday.map((entry) => entry.staff_name))]
  const offTagByName = new Map(
    offEntriesToday.map((entry) => [entry.staff_name, parseOffTag(entry.note)]),
  )
  const notesToday = data.dayNotes.filter((note) => note.note_date === todayKey)

  const overridesToday = new Map(
    data.benchOverrides
      .filter((override) => override.override_date === todayKey)
      .map((override) => [override.bench, override.staff_name]),
  )
  const benchToday = new Map<string, string>()
  for (const cell of data.benchWeeks) {
    if (cell.week_start === weekKey && cell.staff_name) benchToday.set(cell.bench, cell.staff_name)
  }
  for (const [bench, name] of overridesToday) {
    if (name) benchToday.set(bench, name)
    else benchToday.delete(bench)
  }

  const weekendToday = isWeekend
    ? data.weekendSlots.filter(
        (slot) => slot.weekend_start === dateKey(saturdayOf(todayDate)) && slot.staff_name,
      )
    : []

  const offSet = new Set(offToday.map((name) => name.toLowerCase()))
  const conflicts: string[] = []
  if (!isWeekend) {
    for (const [bench, name] of benchToday) {
      if (offSet.has(name.toLowerCase())) {
        conflicts.push(`${name} is on ${bench} this week but is marked off today.`)
      }
    }
  } else {
    for (const slot of weekendToday) {
      if (offSet.has(slot.staff_name.toLowerCase())) {
        conflicts.push(`${slot.staff_name} has weekend slot ${slot.slot_type} but is marked off today.`)
      }
    }
  }

  const coverageLabel = isWeekend
    ? `${weekendToday.length} weekend slot${weekendToday.length === 1 ? '' : 's'} filled`
    : `${benchToday.size} bench${benchToday.size === 1 ? '' : 'es'} assigned this week`

  return (
    <section className="panel today-strip">
      <div className="today-strip-head">
        <h2>Today - {formatLong(todayKey)}</h2>
        <span className="muted">{coverageLabel}</span>
      </div>
      <div className="today-strip-body">
        <div>
          <span className="eyebrow">Off today</span>
          {offToday.length === 0 && <p className="muted">Nobody marked off.</p>}
          <div className="dayoff-chip-row">
            {offToday.map((name) => (
              <span className="dayoff-chip" key={name}>
                {name}
                {offTagByName.get(name) && (
                  <span className="dayoff-chip-tag">{offTagByName.get(name)}</span>
                )}
              </span>
            ))}
          </div>
          {notesToday.map((note) => (
            <p className="day-note" key={note.id}>
              {note.note}
            </p>
          ))}
        </div>
        <div>
          <span className="eyebrow">Conflicts</span>
          {conflicts.length === 0 && <p className="muted">No conflicts detected.</p>}
          {conflicts.map((message) => (
            <div className="alert-row" key={message}>
              <AlertTriangle size={16} />
              <span>{message}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
