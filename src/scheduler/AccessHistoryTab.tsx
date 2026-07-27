import { Plus, X } from 'lucide-react'
import { logSchedAudit, reportSaveError, supabase, type LeadRow, type StaffRow } from './client'
import type { TabProps } from './SchedulePage'

export function AccessHistoryTab({ data, email, reload, openForm }: TabProps) {
  function addLead() {
    openForm({
      title: 'Add a lead tech',
      description:
        'Leads can view and edit everything in the scheduler. They still need to create their own account on the sign-in screen.',
      submitLabel: 'Add lead',
      fields: [
        { name: 'email', label: 'Email', type: 'text', required: true, placeholder: 'name@example.com' },
        { name: 'name', label: 'Display name', type: 'text', placeholder: 'Optional' },
      ],
      onSubmit: async (values) => {
        const { error } = await supabase.from('sched_leads').insert({
          email: values.email.toLowerCase(),
          display_name: values.name || null,
          added_by: email,
        })
        if (reportSaveError(error)) return
        await logSchedAudit('Added', 'Lead', `Added lead ${values.email}`, email)
        reload()
      },
    })
  }

  async function removeLead(lead: LeadRow) {
    if (lead.email.toLowerCase() === email.toLowerCase()) {
      window.alert('You cannot remove your own access. Ask another lead to do it.')
      return
    }
    if (!window.confirm(`Remove ${lead.email} from the lead list? They will lose scheduler access.`))
      return
    const { error } = await supabase.from('sched_leads').delete().eq('email', lead.email)
    if (reportSaveError(error)) return
    await logSchedAudit('Removed', 'Lead', `Removed lead ${lead.email}`, email)
    reload()
  }

  function addStaff() {
    openForm({
      title: 'Add a staff name',
      description: 'Staff names appear as typing suggestions on all three schedule tabs.',
      submitLabel: 'Add name',
      fields: [{ name: 'name', label: 'Name', type: 'text', required: true }],
      onSubmit: async (values) => {
        const { error } = await supabase.from('sched_staff').insert({ name: values.name })
        if (reportSaveError(error)) return
        await logSchedAudit('Added', 'Staff name', values.name, email)
        reload()
      },
    })
  }

  async function toggleStaff(person: StaffRow) {
    const { error } = await supabase
      .from('sched_staff')
      .update({ active: !person.active })
      .eq('id', person.id)
    if (reportSaveError(error)) return
    await logSchedAudit(
      person.active ? 'Deactivated' : 'Reactivated',
      'Staff name',
      person.name,
      email,
    )
    reload()
  }

  return (
    <div className="stack">
      <div className="two-column">
        <section className="panel">
          <div className="panel-header">
            <h2>Lead Access</h2>
            <button className="primary" onClick={addLead}>
              <Plus size={16} /> Add lead
            </button>
          </div>
          <p className="table-hint">
            Only these emails can open the scheduler. New co-leads: they create an account on the
            sign-in screen, then you add their email here.
          </p>
          <div className="override-list">
            {data.leads.map((lead) => (
              <div className="override-row" key={lead.email}>
                <div>
                  <strong>{lead.display_name || lead.email}</strong>
                  <p>
                    {lead.email}
                    {lead.added_by && <span className="muted"> - added by {lead.added_by}</span>}
                  </p>
                </div>
                <button className="icon-button" title="Remove lead" onClick={() => removeLead(lead)}>
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>Staff Names</h2>
            <button className="primary" onClick={addStaff}>
              <Plus size={16} /> Add name
            </button>
          </div>
          <p className="table-hint">
            These power the name suggestions. Deactivated names stay on old schedules but stop
            being suggested. Click a name to toggle.
          </p>
          <div className="dayoff-chip-row staff-name-list">
            {data.staff.map((person) => (
              <button
                key={person.id}
                className={`dayoff-chip staff-toggle ${person.active ? '' : 'struck'}`}
                title={person.active ? 'Click to deactivate' : 'Click to reactivate'}
                onClick={() => toggleStaff(person)}
              >
                {person.name}
              </button>
            ))}
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel-header">
          <h2>Change History</h2>
        </div>
        {data.audit.length === 0 && <p className="empty-state">No changes recorded yet.</p>}
        <div className="timeline-list">
          {data.audit.map((event) => (
            <div className="timeline-row audit-row" key={event.id}>
              <span className="dot"></span>
              <div>
                <strong>
                  {event.action} - {event.item_type}
                </strong>
                <p>{event.summary}</p>
                <small>
                  {event.user_email} -{' '}
                  {new Intl.DateTimeFormat('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  }).format(new Date(event.created_at))}
                </small>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
