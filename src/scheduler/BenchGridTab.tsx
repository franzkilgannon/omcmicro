import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { getToday } from '../today'
import {
  logSchedAudit,
  reportSaveError,
  schedulerBenches,
  supabase,
  type BenchOverrideRow,
} from './client'
import { addDays, dateKey, formatBenchWeek, formatLong, formatShort, mondayOf, toLocalDate } from './dates'
import type { TabProps } from './SchedulePage'

const WEEKS_SHOWN = 6

export function BenchGridTab({ data, email, reload, openForm, staffNames }: TabProps) {
  const todayKey = getToday()
  const [weekOffset, setWeekOffset] = useState(0)

  const baseMonday = mondayOf(toLocalDate(todayKey))
  const weeks = Array.from({ length: WEEKS_SHOWN }, (_, index) =>
    dateKey(addDays(baseMonday, (index + weekOffset) * 7)),
  )
  const currentWeekKey = dateKey(baseMonday)

  const cellValue = new Map<string, string>()
  for (const cell of data.benchWeeks) {
    cellValue.set(`${cell.week_start}|${cell.bench}`, cell.staff_name)
  }

  async function saveCell(weekStart: string, bench: string, name: string) {
    const { error } = await supabase.from('sched_bench_week').upsert(
      {
        week_start: weekStart,
        bench,
        staff_name: name,
        updated_by: email,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'week_start,bench' },
    )
    if (reportSaveError(error)) return
    await logSchedAudit(
      'Updated',
      'Bench week',
      `${bench}, week of ${formatShort(weekStart)}: ${name || 'cleared'}`,
      email,
    )
    reload()
  }

  function addOverride() {
    openForm({
      title: 'Add day override',
      description:
        'Use this for call-ins and same-day swaps: it changes who covers a bench on one specific day without rewriting the week.',
      submitLabel: 'Add override',
      fields: [
        { name: 'date', label: 'Date', type: 'date', required: true, defaultValue: todayKey },
        { name: 'bench', label: 'Bench', type: 'select', options: schedulerBenches },
        {
          name: 'name',
          label: 'Covered by',
          type: 'datalist',
          options: staffNames,
          placeholder: 'Leave blank to mark the bench uncovered',
        },
        { name: 'reason', label: 'Reason', type: 'text', placeholder: 'e.g. Jessica called in' },
      ],
      onSubmit: async (values) => {
        const { error } = await supabase.from('sched_bench_day_override').upsert(
          {
            override_date: values.date,
            bench: values.bench,
            staff_name: values.name || '',
            reason: values.reason || '',
            created_by: email,
          },
          { onConflict: 'override_date,bench' },
        )
        if (reportSaveError(error)) return
        await logSchedAudit(
          'Added',
          'Day override',
          `${values.bench} on ${values.date}: ${values.name || 'uncovered'}${values.reason ? ` (${values.reason})` : ''}`,
          email,
        )
        reload()
      },
    })
  }

  async function deleteOverride(override: BenchOverrideRow) {
    if (!window.confirm(`Remove the override for ${override.bench} on ${override.override_date}?`))
      return
    const { error } = await supabase
      .from('sched_bench_day_override')
      .delete()
      .eq('id', override.id)
    if (reportSaveError(error)) return
    await logSchedAudit(
      'Deleted',
      'Day override',
      `${override.bench} on ${override.override_date}`,
      email,
    )
    reload()
  }

  const recentCutoff = dateKey(addDays(toLocalDate(todayKey), -14))
  const visibleOverrides = data.benchOverrides.filter(
    (override) => override.override_date >= recentCutoff,
  )

  return (
    <div className="stack">
      <section className="panel">
        <div className="panel-header">
          <h2>Weekly Bench Assignments</h2>
          <div className="sched-month-nav">
            <button
              className="secondary"
              onClick={() => setWeekOffset(weekOffset - 1)}
              aria-label="Earlier weeks"
            >
              <ChevronLeft size={16} />
            </button>
            <button className="secondary" onClick={() => setWeekOffset(0)}>
              This week
            </button>
            <button
              className="secondary"
              onClick={() => setWeekOffset(weekOffset + 1)}
              aria-label="Later weeks"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        <p className="table-hint">
          One row per week, one column per bench, just like the paper grid. Type a name and click
          away to save. Same-day changes belong in Day Overrides below.
        </p>
        <div className="table-wrap bench-grid-wrap">
          <table className="bench-grid-table">
            <thead>
              <tr>
                <th className="bench-grid-week">Week</th>
                {schedulerBenches.map((bench) => (
                  <th key={bench}>{bench}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weeks.map((weekKey) => (
                <tr key={weekKey} className={weekKey === currentWeekKey ? 'current-week' : ''}>
                  <th className="bench-grid-week" scope="row">
                    {formatBenchWeek(weekKey)}
                    {weekKey === currentWeekKey && <span className="badge info">Now</span>}
                  </th>
                  {schedulerBenches.map((bench) => (
                    <td key={bench}>
                      <GridCell
                        value={cellValue.get(`${weekKey}|${bench}`) ?? ''}
                        onSave={(name) => saveCell(weekKey, bench, name)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Day Overrides (call-ins and swaps)</h2>
          <button className="primary" onClick={addOverride}>
            <Plus size={16} /> Add override
          </button>
        </div>
        {visibleOverrides.length === 0 && (
          <p className="empty-state">No overrides in the last two weeks.</p>
        )}
        <div className="override-list">
          {visibleOverrides.map((override) => (
            <div className="override-row" key={override.id}>
              <div>
                <strong>
                  {formatLong(override.override_date)} - {override.bench}
                </strong>
                <p>
                  {override.staff_name
                    ? `Covered by ${override.staff_name}`
                    : 'Marked uncovered'}
                  {override.reason && ` - ${override.reason}`}
                  <span className="muted"> (by {override.created_by})</span>
                </p>
              </div>
              <button
                className="icon-button"
                title="Remove override"
                onClick={() => deleteOverride(override)}
              >
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function GridCell({ value, onSave }: { value: string; onSave: (name: string) => void }) {
  const [draft, setDraft] = useState(value)
  const [lastValue, setLastValue] = useState(value)

  if (lastValue !== value) {
    setLastValue(value)
    setDraft(value)
  }

  return (
    <input
      className="bench-grid-input"
      list="sched-staff-options"
      value={draft}
      placeholder="-"
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => {
        if (draft.trim() !== value) onSave(draft.trim())
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') (event.target as HTMLInputElement).blur()
      }}
    />
  )
}
