import { ChevronLeft, ChevronRight, Plus, RotateCcw, X } from 'lucide-react'
import { useState } from 'react'
import { getToday } from '../today'
import { logSchedAudit, reportSaveError, supabase, type DayNoteRow, type DayOffRow } from './client'
import { formatLong, monthGrid, monthNames, toLocalDate, weekdayNames } from './dates'
import type { TabProps } from './SchedulePage'

export function DaysOffTab({ data, email, reload, openForm, staffNames }: TabProps) {
  const todayKey = getToday()
  const [cursor, setCursor] = useState(() => {
    const today = toLocalDate(todayKey)
    return { year: today.getFullYear(), month: today.getMonth() }
  })

  const days = monthGrid(cursor.year, cursor.month)
  const offByDate = new Map<string, DayOffRow[]>()
  for (const entry of data.daysOff) {
    offByDate.set(entry.off_date, [...(offByDate.get(entry.off_date) ?? []), entry])
  }
  const notesByDate = new Map<string, DayNoteRow[]>()
  for (const note of data.dayNotes) {
    notesByDate.set(note.note_date, [...(notesByDate.get(note.note_date) ?? []), note])
  }

  function moveMonth(delta: number) {
    setCursor(({ year, month }) => {
      const next = new Date(year, month + delta, 1)
      return { year: next.getFullYear(), month: next.getMonth() }
    })
  }

  function addToDay(dayKey: string) {
    openForm({
      title: `Add to ${formatLong(dayKey)}`,
      description:
        'A day off puts a name on the calendar (like writing it on the wall). A day note is free text, e.g. "Amany here" or visitor hours.',
      submitLabel: 'Add',
      fields: [
        { name: 'kind', label: 'Type', type: 'select', options: ['Day off', 'Day note'] },
        {
          name: 'name',
          label: 'Name (for day off)',
          type: 'datalist',
          options: staffNames,
          placeholder: 'Start typing a name',
        },
        {
          name: 'note',
          label: 'Note',
          type: 'text',
          placeholder: 'Optional for a day off - required for a day note',
        },
      ],
      onSubmit: async (values) => {
        if (values.kind === 'Day off') {
          if (!values.name) return
          const alreadyOff = (offByDate.get(dayKey) ?? []).some(
            (entry) =>
              !entry.removed_at &&
              entry.staff_name.toLowerCase() === values.name.toLowerCase(),
          )
          if (alreadyOff) {
            window.alert(`${values.name} is already marked off on ${formatLong(dayKey)}.`)
            return
          }
          const { error } = await supabase.from('sched_days_off').insert({
            off_date: dayKey,
            staff_name: values.name,
            note: values.note || '',
            created_by: email,
          })
          if (reportSaveError(error)) return
          await logSchedAudit('Added', 'Day off', `${values.name} off on ${dayKey}`, email)
        } else {
          if (!values.note) return
          const { error } = await supabase
            .from('sched_day_notes')
            .insert({ note_date: dayKey, note: values.note, created_by: email })
          if (reportSaveError(error)) return
          await logSchedAudit('Added', 'Day note', `${dayKey}: ${values.note}`, email)
        }
        reload()
      },
    })
  }

  async function crossOut(entry: DayOffRow) {
    const { error } = await supabase
      .from('sched_days_off')
      .update({ removed_by: email, removed_at: new Date().toISOString() })
      .eq('id', entry.id)
    if (reportSaveError(error)) return
    await logSchedAudit(
      'Crossed out',
      'Day off',
      `${entry.staff_name} off ${entry.off_date} crossed out`,
      email,
    )
    reload()
  }

  async function restore(entry: DayOffRow) {
    const { error } = await supabase
      .from('sched_days_off')
      .update({ removed_by: null, removed_at: null })
      .eq('id', entry.id)
    if (reportSaveError(error)) return
    await logSchedAudit(
      'Restored',
      'Day off',
      `${entry.staff_name} off ${entry.off_date} restored`,
      email,
    )
    reload()
  }

  async function deleteNote(note: DayNoteRow) {
    if (!window.confirm(`Delete this note? "${note.note}"`)) return
    const { error } = await supabase.from('sched_day_notes').delete().eq('id', note.id)
    if (reportSaveError(error)) return
    await logSchedAudit('Deleted', 'Day note', `${note.note_date}: ${note.note}`, email)
    reload()
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Days Off - {monthNames[cursor.month]} {cursor.year}</h2>
        <div className="sched-month-nav">
          <button className="secondary" onClick={() => moveMonth(-1)} aria-label="Previous month">
            <ChevronLeft size={16} />
          </button>
          <button
            className="secondary"
            onClick={() => {
              const today = toLocalDate(todayKey)
              setCursor({ year: today.getFullYear(), month: today.getMonth() })
            }}
          >
            Today
          </button>
          <button className="secondary" onClick={() => moveMonth(1)} aria-label="Next month">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <p className="table-hint">
        A name on a day means that person is off, exactly like the wall calendar. Crossing a name
        out keeps it visible with a line through it so everyone can see the change.
      </p>
      <div className="schedule-calendar">
        <div className="calendar-weekdays">
          {weekdayNames.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="calendar-grid">
          {days.map((day) => {
            const entries = offByDate.get(day.key) ?? []
            const notes = notesByDate.get(day.key) ?? []
            return (
              <article
                className={`calendar-day dayoff-day ${day.inMonth ? '' : 'outside-month'} ${day.key === todayKey ? 'is-today' : ''}`}
                key={day.key}
              >
                <div className="calendar-date-head">
                  <div>
                    <strong>{day.date.getDate()}</strong>
                    <span>{weekdayNames[day.date.getDay()]}</span>
                  </div>
                  <button
                    className="icon-button"
                    title="Add day off or note"
                    onClick={() => addToDay(day.key)}
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <div className="dayoff-chip-row">
                  {entries.map((entry) =>
                    entry.removed_at ? (
                      <span
                        className="dayoff-chip struck"
                        key={entry.id}
                        title={`Crossed out by ${entry.removed_by}`}
                      >
                        {entry.staff_name}
                        <button
                          className="chip-action"
                          title="Restore"
                          onClick={() => restore(entry)}
                        >
                          <RotateCcw size={11} />
                        </button>
                      </span>
                    ) : (
                      <span
                        className="dayoff-chip"
                        key={entry.id}
                        title={entry.note ? `${entry.note} (added by ${entry.created_by})` : `Added by ${entry.created_by}`}
                      >
                        {entry.staff_name}
                        <button
                          className="chip-action"
                          title="Cross out"
                          onClick={() => crossOut(entry)}
                        >
                          <X size={11} />
                        </button>
                      </span>
                    ),
                  )}
                </div>
                {notes.map((note) => (
                  <p
                    className="day-note"
                    key={note.id}
                    title={`Added by ${note.created_by} - click to delete`}
                    onClick={() => deleteNote(note)}
                  >
                    {note.note}
                  </p>
                ))}
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
