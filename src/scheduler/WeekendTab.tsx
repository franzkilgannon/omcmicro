import { Plus, X } from 'lucide-react'
import { useState } from 'react'
import { getToday } from '../today'
import {
  defaultWeekendSlots,
  logSchedAudit,
  reportSaveError,
  supabase,
  weekendSlotTypes,
  type WeekendSlotRow,
} from './client'
import { addDays, dateKey, formatWeekend, saturdayOf, toLocalDate } from './dates'
import type { TabProps } from './SchedulePage'

export function WeekendTab({ data, email, reload, openForm, staffNames }: TabProps) {
  const todayKey = getToday()
  const [showPast, setShowPast] = useState(false)

  const weekends = new Map<string, WeekendSlotRow[]>()
  for (const slot of data.weekendSlots) {
    weekends.set(slot.weekend_start, [...(weekends.get(slot.weekend_start) ?? []), slot])
  }
  const currentWeekendKey = dateKey(saturdayOf(toLocalDate(todayKey)))
  const sortedKeys = [...weekends.keys()].sort()
  const visibleKeys = showPast
    ? sortedKeys
    : sortedKeys.filter((key) => key >= currentWeekendKey)
  const hiddenCount = sortedKeys.length - visibleKeys.length

  function nextOpenSaturday() {
    let saturday = saturdayOf(toLocalDate(todayKey))
    while (weekends.has(dateKey(saturday))) saturday = addDays(saturday, 7)
    return dateKey(saturday)
  }

  function addWeekend() {
    openForm({
      title: 'Add a weekend',
      description:
        'Creates a weekend card with the usual slot rows (3x Sat/Sun, 3x Sat, Molec Sat, Molec Sun, Sun). Pick any date in that weekend.',
      submitLabel: 'Create weekend',
      fields: [
        { name: 'date', label: 'Weekend date', type: 'date', required: true, defaultValue: nextOpenSaturday() },
      ],
      onSubmit: async (values) => {
        const weekendKey = dateKey(saturdayOf(toLocalDate(values.date)))
        if (weekends.has(weekendKey)) {
          window.alert(`The weekend of ${formatWeekend(weekendKey)} already exists.`)
          return
        }
        const rows = defaultWeekendSlots.map((slotType, index) => ({
          weekend_start: weekendKey,
          position: index + 1,
          slot_type: slotType,
          staff_name: '',
          updated_by: email,
        }))
        const { error } = await supabase.from('sched_weekend_slots').insert(rows)
        if (reportSaveError(error)) return
        await logSchedAudit('Added', 'Weekend', `Created weekend ${formatWeekend(weekendKey)}`, email)
        reload()
      },
    })
  }

  function addSlot(weekendKey: string, slots: WeekendSlotRow[]) {
    openForm({
      title: `Add slot - ${formatWeekend(weekendKey)}`,
      submitLabel: 'Add slot',
      fields: [
        { name: 'slotType', label: 'Slot type', type: 'select', options: weekendSlotTypes },
        {
          name: 'name',
          label: 'Name',
          type: 'datalist',
          options: staffNames,
          placeholder: 'Can be left blank',
        },
      ],
      onSubmit: async (values) => {
        const nextPosition = Math.max(0, ...slots.map((slot) => slot.position)) + 1
        const { error } = await supabase.from('sched_weekend_slots').insert({
          weekend_start: weekendKey,
          position: nextPosition,
          slot_type: values.slotType,
          staff_name: values.name || '',
          updated_by: email,
        })
        if (reportSaveError(error)) return
        await logSchedAudit(
          'Added',
          'Weekend slot',
          `${values.slotType} on ${formatWeekend(weekendKey)}: ${values.name || 'open'}`,
          email,
        )
        reload()
      },
    })
  }

  async function saveSlot(slot: WeekendSlotRow, name: string) {
    // Keep the first name ever written in the slot as the "crossed out" one,
    // like the paper sheet. Writing the original name back clears the strike.
    let original = slot.original_staff_name
    if (!original && slot.staff_name && slot.staff_name !== name) original = slot.staff_name
    if (original === name) original = ''

    const { error } = await supabase
      .from('sched_weekend_slots')
      .update({
        staff_name: name,
        original_staff_name: original,
        updated_by: email,
        updated_at: new Date().toISOString(),
      })
      .eq('id', slot.id)
    if (reportSaveError(error)) return
    await logSchedAudit(
      'Updated',
      'Weekend slot',
      `${slot.slot_type} on ${formatWeekend(slot.weekend_start)}: ${slot.staff_name || 'open'} -> ${name || 'open'}`,
      email,
    )
    reload()
  }

  async function deleteSlot(slot: WeekendSlotRow) {
    if (
      !window.confirm(
        `Delete the ${slot.slot_type} slot${slot.staff_name ? ` (${slot.staff_name})` : ''} from ${formatWeekend(slot.weekend_start)}?`,
      )
    )
      return
    const { error } = await supabase.from('sched_weekend_slots').delete().eq('id', slot.id)
    if (reportSaveError(error)) return
    await logSchedAudit(
      'Deleted',
      'Weekend slot',
      `${slot.slot_type} on ${formatWeekend(slot.weekend_start)}`,
      email,
    )
    reload()
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Weekend Rotation</h2>
        <div className="sched-month-nav">
          {hiddenCount > 0 && !showPast && (
            <button className="secondary" onClick={() => setShowPast(true)}>
              Show {hiddenCount} past
            </button>
          )}
          {showPast && (
            <button className="secondary" onClick={() => setShowPast(false)}>
              Hide past
            </button>
          )}
          <button className="primary" onClick={addWeekend}>
            <Plus size={16} /> Add weekend
          </button>
        </div>
      </div>
      <p className="table-hint">
        Each card is one weekend from the rotation sheet. Change a name to record a swap: the
        previous name stays visible with a line through it, like crossing it out on paper.
      </p>
      {visibleKeys.length === 0 && (
        <p className="empty-state">No weekends yet. Add the next one to get started.</p>
      )}
      <div className="weekend-card-grid">
        {visibleKeys.map((weekendKey) => {
          const slots = (weekends.get(weekendKey) ?? []).slice().sort((a, b) => a.position - b.position)
          return (
            <article
              className={`record-card weekend-card ${weekendKey === currentWeekendKey ? 'current-weekend' : ''}`}
              key={weekendKey}
            >
              <div className="record-head">
                <h3>{formatWeekend(weekendKey)}</h3>
                {weekendKey === currentWeekendKey && <span className="badge info">This weekend</span>}
              </div>
              <div className="weekend-slot-list">
                {slots.map((slot) => (
                  <div className="weekend-slot" key={slot.id}>
                    <span className="weekend-slot-type">{slot.slot_type}</span>
                    {slot.original_staff_name && slot.original_staff_name !== slot.staff_name && (
                      <s className="weekend-original">{slot.original_staff_name}</s>
                    )}
                    <SlotInput value={slot.staff_name} onSave={(name) => saveSlot(slot, name)} />
                    <button
                      className="icon-button"
                      title="Delete slot"
                      onClick={() => deleteSlot(slot)}
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
              <button className="secondary weekend-add-slot" onClick={() => addSlot(weekendKey, slots)}>
                <Plus size={14} /> Add slot
              </button>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function SlotInput({ value, onSave }: { value: string; onSave: (name: string) => void }) {
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
      placeholder="open"
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
