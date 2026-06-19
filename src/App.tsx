import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Gauge,
  History,
  LayoutDashboard,
  ListChecks,
  Menu,
  Microscope,
  Plus,
  Printer,
  Search,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { benches } from './data'
import { createAuditEvent, loadDatabase, saveDatabase } from './storage'
import type {
  AccessRole,
  AuditEvent,
  Bench,
  InstrumentLog,
  LabDatabase,
  QCEvent,
  Reminder,
  ScheduleAssignment,
  StaffMember,
  Status,
  TaskItem,
  WorkflowImprovement,
} from './types'

type PageKey =
  | 'Dashboard'
  | 'Staff Roster'
  | 'Schedule'
  | 'Competencies'
  | 'SOP Tracker'
  | 'Tasks'
  | 'Reminders'
  | 'Instrument Log'
  | 'Workflow'
  | 'QC/Compliance'
  | 'Audit Trail'

type StaffSortKey =
  | 'name'
  | 'role'
  | 'primaryLocation'
  | 'employmentStatus'
  | 'benchCompetencies'
  | 'shiftPreference'
  | 'active'

const navItems: { key: PageKey; icon: typeof LayoutDashboard }[] = [
  { key: 'Dashboard', icon: LayoutDashboard },
  { key: 'Staff Roster', icon: Users },
  { key: 'Schedule', icon: CalendarDays },
  { key: 'Competencies', icon: ClipboardCheck },
  { key: 'SOP Tracker', icon: FileText },
  { key: 'Tasks', icon: ListChecks },
  { key: 'Reminders', icon: AlertTriangle },
  { key: 'Instrument Log', icon: Gauge },
  { key: 'Workflow', icon: Settings },
  { key: 'QC/Compliance', icon: ShieldCheck },
  { key: 'Audit Trail', icon: History },
]

const pageRoutes: Record<PageKey, string> = {
  Dashboard: '/',
  'Staff Roster': '/staffroster',
  Schedule: '/schedule',
  Competencies: '/competencies',
  'SOP Tracker': '/soptracker',
  Tasks: '/tasks',
  Reminders: '/reminders',
  'Instrument Log': '/instrumentlog',
  Workflow: '/workflow',
  'QC/Compliance': '/qccompliance',
  'Audit Trail': '/audittrail',
}

const routePages = new Map<string, PageKey>(
  Object.entries(pageRoutes).map(([pageKey, route]) => [route, pageKey as PageKey]),
)

const staffRoles = [
  'Lab Assistant',
  'Lab Assistant Trainee',
  'Clinical/Medical Lab Technician',
  'Clinical/Medical Laboratory Scientist',
  'Medical Technologist',
  'Sr Medical Technologist',
  'Sr Medical Laboratory Scientist',
  'Lab Education Coordinator',
  'Venipuncture Operations Coordinator',
  'Inventory Coordinator',
  'Inventory Personnel',
] as const

const today = '2026-06-18'

function App() {
  const [db, setDb] = useState<LabDatabase>(() => loadDatabase())
  const [page, setPageState] = useState<PageKey>(() => pageFromPath(window.location.pathname))
  const [query, setQuery] = useState('')
  const [accessRole, setAccessRole] = useState<AccessRole>('Admin/Sr Tech')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => saveDatabase(db), [db])

  useEffect(() => {
    function handlePopState() {
      setPageState(pageFromPath(window.location.pathname))
      setMobileMenuOpen(false)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    document.body.classList.toggle('menu-open', mobileMenuOpen)

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setMobileMenuOpen(false)
    }

    window.addEventListener('keydown', handleEscape)
    return () => {
      document.body.classList.remove('menu-open')
      window.removeEventListener('keydown', handleEscape)
    }
  }, [mobileMenuOpen])

  function setPage(nextPage: PageKey) {
    setPageState(nextPage)
    setMobileMenuOpen(false)
    const nextRoute = pageRoutes[nextPage]
    if (window.location.pathname !== nextRoute) {
      window.history.pushState(null, '', nextRoute)
    }
  }

  const currentUser = accessRole === 'Staff' ? 'Wanda Johnson' : accessRole
  const canEdit = accessRole === 'Admin/Sr Tech'
  const canCompletePersonal = accessRole !== 'Read-only'

  function updateDb(
    recipe: (draft: LabDatabase) => void,
    audit: Omit<AuditEvent, 'id' | 'dateTime'>,
  ) {
    setDb((current) => {
      const next = structuredClone(current)
      recipe(next)
      next.auditEvents = [
        createAuditEvent(audit.action, audit.itemType, audit.itemId, audit.user, audit.summary),
        ...next.auditEvents,
      ]
      return next
    })
  }

  const staffById = useMemo(
    () => Object.fromEntries(db.staff.map((person) => [person.id, person])),
    [db.staff],
  )

  const filteredStaff = db.staff
    .filter((person) =>
      `${person.name} ${person.role} ${person.primaryLocation} ${person.benchCompetencies.join(' ')}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    )

  const content = {
    Dashboard: (
      <Dashboard
        db={db}
        staffById={staffById}
        setPage={setPage}
        onCompleteTask={(task) =>
          completeTask(task, db, updateDb, currentUser, accessRole, canCompletePersonal)
        }
      />
    ),
    'Staff Roster': (
      <StaffRoster
        staff={filteredStaff}
        canEdit={canEdit}
        onAdd={() => addStaff(updateDb, currentUser)}
      />
    ),
    Schedule: (
      <ScheduleBuilder
        db={db}
        staffById={staffById}
        canEdit={canEdit}
        onAdd={() => addScheduleAssignment(db, updateDb, currentUser)}
      />
    ),
    Competencies: <CompetencyMatrix db={db} staffById={staffById} />,
    'SOP Tracker': (
      <SopTracker db={db} canEdit={canEdit} onAdd={() => addSop(updateDb, currentUser)} />
    ),
    Tasks: (
      <TasksPage
        db={db}
        canEdit={canEdit}
        canCompletePersonal={canCompletePersonal}
        currentUser={currentUser}
        onAdd={() => addTask(db, updateDb, currentUser)}
        onComplete={(task) => completeTask(task, db, updateDb, currentUser, accessRole, canCompletePersonal)}
      />
    ),
    Reminders: (
      <RemindersPage
        reminders={db.reminders}
        canEdit={canEdit}
        onAdd={() => addReminder(updateDb, currentUser)}
      />
    ),
    'Instrument Log': (
      <InstrumentLogPage
        logs={db.instrumentLogs}
        canEdit={canEdit}
        onAdd={() => addInstrumentLog(updateDb, currentUser)}
      />
    ),
    Workflow: (
      <WorkflowPage
        items={db.workflowImprovements}
        canEdit={canEdit}
        onAdd={() => addWorkflow(updateDb, currentUser)}
      />
    ),
    'QC/Compliance': (
      <QcCompliancePage
        events={db.qcEvents}
        canEdit={canEdit}
        onAdd={() => addQcEvent(updateDb, currentUser)}
      />
    ),
    'Audit Trail': <AuditTrail events={db.auditEvents} />,
  }[page]

  return (
    <div className="app-shell">
      <header className="mobile-header">
        <button
          type="button"
          className="mobile-menu-button"
          aria-label="Open navigation menu"
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu size={22} />
        </button>
        <div className="mobile-brand">
          <Microscope size={22} />
          <div>
            <strong>OMC Micro</strong>
            <span>{page}</span>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="mobile-menu-backdrop" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="mobile-menu-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mobile-menu-head">
              <div className="brand">
                <Microscope size={24} />
                <div>
                  <strong>OMC Micro</strong>
                  <span>Operations Hub</span>
                </div>
              </div>
              <button
                type="button"
                className="mobile-menu-close"
                aria-label="Close navigation menu"
                onClick={() => setMobileMenuOpen(false)}
              >
                ×
              </button>
            </div>
            <nav aria-label="Mobile navigation">
              {navItems.map(({ key, icon: Icon }) => (
                <button
                  type="button"
                  key={key}
                  className={page === key ? 'active' : ''}
                  onClick={() => setPage(key)}
                >
                  <Icon size={18} />
                  <span>{key}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      <aside className="sidebar">
        <div className="brand">
          <Microscope size={28} />
          <div>
            <strong>OMC Micro</strong>
            <span>Operations Hub</span>
          </div>
        </div>
        <nav aria-label="Primary navigation">
          {navItems.map(({ key, icon: Icon }) => (
            <button
              type="button"
              key={key}
              className={page === key ? 'active' : ''}
              onClick={() => setPage(key)}
            >
              <Icon size={18} />
              <span>{key}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Internal laboratory staffing and operations</p>
            <h1>{page}</h1>
          </div>
          <div className="topbar-actions">
            <label className="search">
              <Search size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search staff, roles, benches"
              />
            </label>
            <label className="role-picker">
              <span>Mock access</span>
              <select value={accessRole} onChange={(event) => setAccessRole(event.target.value as AccessRole)}>
                <option>Admin/Sr Tech</option>
                <option>Staff</option>
                <option>Read-only</option>
              </select>
            </label>
          </div>
        </header>
        <section className="privacy-banner">
          <ShieldCheck size={18} />
          <span>No PHI: placeholder staffing, documentation, QC, and operational records only.</span>
        </section>
        {content}
      </main>
    </div>
  )
}

function Dashboard({
  db,
  staffById,
  setPage,
  onCompleteTask,
}: {
  db: LabDatabase
  staffById: Record<string, StaffMember>
  setPage: (page: PageKey) => void
  onCompleteTask: (task: TaskItem) => void
}) {
  const todaysAssignments = db.scheduleAssignments.filter((assignment) => assignment.date === today)
  const duplicateAssignments = getDuplicateAssignments(db.scheduleAssignments)
  const insufficientCoverage = getCoverageGaps(db.scheduleAssignments)
  const pendingTasks = db.tasks.filter((task) => task.status !== 'Complete')
  const dueSoonSops = db.sops.filter((sop) => daysUntil(sop.reviewDueDate) <= 30)
  const dueSoonCompetencies = db.competencies.filter((item) => daysUntil(item.annualDueDate) <= 30)

  return (
    <div className="stack">
      <div className="metric-grid">
        <Metric label="Today's Staffing" value={String(todaysAssignments.length)} detail="Scheduled assignments" />
        <Metric label="Today's Bench Coverage" value={String(new Set(todaysAssignments.map((item) => item.bench)).size)} detail="Benches assigned today" />
        <Metric label="Needs Attention" value={String(pendingTasks.length + duplicateAssignments.length + insufficientCoverage.length)} detail="Open tasks and coverage flags" />
        <Metric label="Due Within 30 Days" value={String(dueSoonSops.length + dueSoonCompetencies.length)} detail="SOP and competency items" />
      </div>

      <div className="two-column">
        <Panel title="Today's Bench Coverage" actionLabel="Open schedule" onAction={() => setPage('Schedule')}>
          <div className="timeline-list">
            {todaysAssignments.map((assignment) => (
              <div className="timeline-row" key={assignment.id}>
                <span className="dot"></span>
                <div>
                  <strong>{staffById[assignment.staffId]?.name}</strong>
                  <p>{assignment.shift} - {assignment.bench}</p>
                </div>
                <Badge tone={assignment.shift === 'Off/PTO' ? 'neutral' : 'good'}>{assignment.shift}</Badge>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Needs Attention">
          <div className="alert-list">
            {duplicateAssignments.map((message) => <AlertRow key={message} message={message} />)}
            {insufficientCoverage.map((message) => <AlertRow key={message} message={message} />)}
            {!duplicateAssignments.length && !insufficientCoverage.length && (
              <EmptyState text="No staffing conflicts detected in the sample schedule." />
            )}
          </div>
        </Panel>
      </div>

      <div className="three-column">
        <Panel title="Pending Tasks" actionLabel="Open tasks" onAction={() => setPage('Tasks')}>
          {pendingTasks.slice(0, 5).map((task) => (
            <CompactItem
              key={task.id}
              title={task.title}
              meta={`${task.priority} - due ${formatDate(task.dueDate)}`}
              badge={<Badge tone={statusTone(task.status)}>{task.status}</Badge>}
              action={<button className="icon-button" title="Mark complete" onClick={() => onCompleteTask(task)}><CheckCircle2 size={16} /></button>}
            />
          ))}
        </Panel>

        <Panel title="Upcoming Reminders" actionLabel="Open reminders" onAction={() => setPage('Reminders')}>
          {db.reminders.map((reminder) => (
            <CompactItem
              key={reminder.id}
              title={reminder.title}
              meta={`${reminder.type} - ${formatDate(reminder.dueDate)}`}
              badge={<Badge tone={dueTone(reminder.dueDate)}>{dueLabel(reminder.dueDate)}</Badge>}
            />
          ))}
        </Panel>

        <Panel title="QC/SOP Due Soon" actionLabel="Open SOPs" onAction={() => setPage('SOP Tracker')}>
          {dueSoonSops.map((sop) => (
            <CompactItem
              key={sop.id}
              title={sop.title}
              meta={`${sop.id} v${sop.version}`}
              badge={<Badge tone={dueTone(sop.reviewDueDate)}>{formatDate(sop.reviewDueDate)}</Badge>}
            />
          ))}
          {dueSoonCompetencies.map((item) => (
            <CompactItem
              key={item.id}
              title={`${staffById[item.staffId]?.name} - ${item.bench}`}
              meta="Annual competency review"
              badge={<Badge tone={dueTone(item.annualDueDate)}>{formatDate(item.annualDueDate)}</Badge>}
            />
          ))}
        </Panel>
      </div>
    </div>
  )
}

function pageFromPath(pathname: string): PageKey {
  const normalizedPath = pathname.toLowerCase().replace(/\/$/, '') || '/'
  return routePages.get(normalizedPath) ?? 'Dashboard'
}

function StaffRoster({ staff, canEdit, onAdd }: { staff: StaffMember[]; canEdit: boolean; onAdd: () => void }) {
  const [sortKey, setSortKey] = useState<StaffSortKey>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const sortedStaff = [...staff].sort((first, second) => {
    const firstValue = staffSortValue(first, sortKey)
    const secondValue = staffSortValue(second, sortKey)
    const result = firstValue.localeCompare(secondValue, undefined, { numeric: true })
    return sortDirection === 'asc' ? result : -result
  })

  function updateSort(nextKey: StaffSortKey) {
    if (nextKey === sortKey) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }

    setSortKey(nextKey)
    setSortDirection('asc')
  }

  function sortLabel(key: StaffSortKey) {
    if (key !== sortKey) return ''
    return sortDirection === 'asc' ? ' ↑' : ' ↓'
  }

  return (
    <Panel title="Staff Roster" actionLabel={canEdit ? 'Add staff' : undefined} onAction={onAdd}>
      <div className="mobile-sort-control">
        <label>
          <span>Sort roster</span>
          <select value={`${sortKey}:${sortDirection}`} onChange={(event) => {
            const [nextKey, nextDirection] = event.target.value.split(':') as [StaffSortKey, 'asc' | 'desc']
            setSortKey(nextKey)
            setSortDirection(nextDirection)
          }}>
            <option value="name:asc">Name A to Z</option>
            <option value="name:desc">Name Z to A</option>
            <option value="role:asc">Title order</option>
            <option value="role:desc">Title order reversed</option>
            <option value="active:asc">Status A to Z</option>
            <option value="benchCompetencies:asc">Benches A to Z</option>
            <option value="shiftPreference:asc">Shift A to Z</option>
          </select>
        </label>
      </div>
      <div className="table-wrap">
        <table className="staff-roster-table">
          <thead>
            <tr>
              <SortableTh label="Name" sortKey="name" activeKey={sortKey} direction={sortDirection} onSort={updateSort} />
              <SortableTh label="Title" sortKey="role" activeKey={sortKey} direction={sortDirection} onSort={updateSort} />
              <SortableTh label="Location" sortKey="primaryLocation" activeKey={sortKey} direction={sortDirection} onSort={updateSort} />
              <SortableTh label="Status" sortKey="active" activeKey={sortKey} direction={sortDirection} onSort={updateSort} />
              <SortableTh label="Benches" sortKey="benchCompetencies" activeKey={sortKey} direction={sortDirection} onSort={updateSort} />
              <SortableTh label="Shift Pref" sortKey="shiftPreference" activeKey={sortKey} direction={sortDirection} onSort={updateSort} />
            </tr>
          </thead>
          <tbody>
            {sortedStaff.map((person) => (
              <tr key={person.id}>
                <td data-label="Name"><strong>{person.name}</strong></td>
                <td data-label="Title">{displayTitle(person.role)}</td>
                <td data-label="Location">OMC-Micro</td>
                <td data-label="Status"><Badge tone={person.active ? 'good' : 'neutral'}>{person.active ? 'Active' : 'Inactive'}</Badge></td>
                <td data-label="Benches"><BenchChips benches={person.benchCompetencies} limit={2} /></td>
                <td data-label="Shift Pref">{person.shiftPreference}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="staff-card-list">
        {sortedStaff.map((person) => (
          <article className="staff-card" key={person.id}>
            <div className="staff-card-head">
              <div>
                <h3>{person.name}</h3>
                <p>{displayTitle(person.role)}</p>
              </div>
              <Badge tone={person.active ? 'good' : 'neutral'}>{person.active ? 'Active' : 'Inactive'}</Badge>
            </div>
            <p className="staff-card-meta">{person.shiftPreference} shift / OMC-Micro</p>
            <BenchChips benches={person.benchCompetencies} />
          </article>
        ))}
      </div>
      <p className="table-hint">Sorted by {sortKeyToLabel(sortKey)}{sortLabel(sortKey)}. Tap any column header to sort.</p>
    </Panel>
  )
}

function BenchChips({ benches, limit }: { benches: Bench[]; limit?: number }) {
  if (benches.length === 0) return <span className="muted">Not assigned</span>

  const visibleBenches = typeof limit === 'number' ? benches.slice(0, limit) : benches
  const hiddenCount = benches.length - visibleBenches.length

  return (
    <div className="bench-chips" title={benches.join(', ')}>
      {visibleBenches.map((bench) => (
        <span className="bench-chip" key={bench}>{shortBenchName(bench)}</span>
      ))}
      {hiddenCount > 0 && <span className="bench-chip more">+{hiddenCount} more</span>}
    </div>
  )
}

function shortBenchName(bench: Bench) {
  const labels: Record<Bench, string> = {
    'Bench 1 - Blood/CSF/Stool Cultures': 'Bench 1',
    'Bench 2 - Aerobic Cultures': 'Bench 2',
    'Bench 3 - Urine Cultures': 'Bench 3',
    'Bench 4 - Respiratory Culture': 'Bench 4',
    'Bench 5 - Stool Kits + MALDI': 'Bench 5',
    'BACTEC Bench': 'BACTEC',
    Mycology: 'Mycology',
    AFB: 'AFB',
    Anaerobes: 'Anaerobes',
    Molecular: 'Molecular',
    MicroScan: 'MicroScan',
    MALDI: 'MALDI',
    'Set Up Bench': 'Set Up',
    Inventory: 'Inventory',
    'Admin/Training': 'Admin',
  }

  return labels[bench]
}

function SortableTh({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
}: {
  label: string
  sortKey: StaffSortKey
  activeKey: StaffSortKey
  direction: 'asc' | 'desc'
  onSort: (key: StaffSortKey) => void
}) {
  const active = sortKey === activeKey

  return (
    <th aria-sort={active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" className="th-sort" onClick={() => onSort(sortKey)}>
        <span>{label}</span>
        <span aria-hidden="true">{active ? (direction === 'asc' ? '↑' : '↓') : '↕'}</span>
      </button>
    </th>
  )
}

function staffSortValue(person: StaffMember, sortKey: StaffSortKey) {
  if (sortKey === 'role') return `${titleSortRank(person.role).toString().padStart(2, '0')} ${displayTitle(person.role)}`
  if (sortKey === 'benchCompetencies') return person.benchCompetencies.join(', ')
  if (sortKey === 'active') return person.active ? 'Active' : 'Inactive'
  if (sortKey === 'primaryLocation') return 'OMC-Micro'
  return String(person[sortKey])
}

function sortKeyToLabel(sortKey: StaffSortKey) {
  const labels: Record<StaffSortKey, string> = {
    name: 'Name',
    role: 'Title',
    primaryLocation: 'Location',
    employmentStatus: 'Employment status',
    benchCompetencies: 'Benches',
    shiftPreference: 'Shift Pref',
    active: 'Status',
  }

  return labels[sortKey]
}

function displayTitle(role: StaffMember['role']) {
  const titles: Record<StaffMember['role'], string> = {
    'Lab Assistant': 'Lab Assistant',
    'Lab Assistant Trainee': 'Lab Assistant Trainee',
    'Clinical/Medical Lab Technician': 'Medical Laboratory Technician',
    'Clinical/Medical Laboratory Scientist': 'Medical Laboratory Scientist',
    'Medical Technologist': 'Medical Technologist',
    'Sr Medical Technologist': 'Sr Medical Technologist',
    'Sr Medical Laboratory Scientist': 'Sr Medical Laboratory Scientist',
    'Lab Education Coordinator': 'Lab Education Coordinator',
    'Venipuncture Operations Coordinator': 'Venipuncture Operations Coordinator',
    'Inventory Coordinator': 'Inventory Coordinator',
    'Inventory Personnel': 'Inventory Personnel',
  }

  return titles[role]
}

function titleSortRank(role: StaffMember['role']) {
  const titleOrder: Record<StaffMember['role'], number> = {
    'Sr Medical Technologist': 1,
    'Sr Medical Laboratory Scientist': 2,
    'Clinical/Medical Laboratory Scientist': 2,
    'Medical Technologist': 4,
    'Clinical/Medical Lab Technician': 5,
    'Lab Education Coordinator': 6,
    'Lab Assistant': 7,
    'Lab Assistant Trainee': 8,
    'Inventory Coordinator': 9,
    'Inventory Personnel': 10,
    'Venipuncture Operations Coordinator': 11,
  }

  return titleOrder[role]
}

function ScheduleBuilder({
  db,
  staffById,
  canEdit,
  onAdd,
}: {
  db: LabDatabase
  staffById: Record<string, StaffMember>
  canEdit: boolean
  onAdd: () => void
}) {
  const [view, setView] = useState<'Week' | 'Month'>('Week')
  const items = view === 'Week' ? db.scheduleAssignments.slice(0, 7) : db.scheduleAssignments

  return (
    <div className="stack">
      <div className="toolbar">
        <div className="segmented">
          <button className={view === 'Week' ? 'selected' : ''} onClick={() => setView('Week')}>Week</button>
          <button className={view === 'Month' ? 'selected' : ''} onClick={() => setView('Month')}>Month</button>
        </div>
        <button className="secondary" onClick={() => window.print()}><Printer size={16} /> Print/export</button>
        {canEdit && <button className="primary" onClick={onAdd}><Plus size={16} /> Add assignment</button>}
      </div>

      <Panel title={`${view} Schedule Builder`}>
        <div className="schedule-grid print-area">
          {items.map((assignment) => (
            <article className="schedule-card" key={assignment.id}>
              <div>
                <p className="date-label">{formatDate(assignment.date)}</p>
                <h3>{assignment.bench}</h3>
              </div>
              <Badge tone={assignment.shift === 'Off/PTO' ? 'neutral' : 'info'}>{assignment.shift}</Badge>
              <p><strong>{staffById[assignment.staffId]?.name}</strong></p>
              <p>{assignment.notes}</p>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  )
}

function CompetencyMatrix({ db, staffById }: { db: LabDatabase; staffById: Record<string, StaffMember> }) {
  return (
    <Panel title="Bench Competency Matrix">
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Staff</th>
              <th>Bench</th>
              <th>Status</th>
              <th>Initial date</th>
              <th>Annual due</th>
              <th>Trainer/preceptor</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {db.competencies.map((item) => (
              <tr key={item.id}>
                <td data-label="Staff">{staffById[item.staffId]?.name}</td>
                <td data-label="Bench">{item.bench}</td>
                <td data-label="Status"><Badge tone={competencyTone(item.status, item.annualDueDate)}>{item.status}</Badge></td>
                <td data-label="Initial date">{formatDate(item.initialDate)}</td>
                <td data-label="Annual due">{formatDate(item.annualDueDate)}</td>
                <td data-label="Trainer/preceptor">{item.trainer}</td>
                <td data-label="Notes">{item.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

function SopTracker({ db, canEdit, onAdd }: { db: LabDatabase; canEdit: boolean; onAdd: () => void }) {
  return (
    <Panel title="SOP Tracker" actionLabel={canEdit ? 'Add SOP' : undefined} onAction={onAdd}>
      <div className="card-grid">
        {db.sops.map((sop) => (
          <article className="record-card" key={sop.id}>
            <div className="record-head">
              <div>
                <p className="eyebrow">{sop.id} - version {sop.version}</p>
                <h3>{sop.title}</h3>
              </div>
              <Badge tone={statusTone(sop.status)}>{sop.status}</Badge>
            </div>
            <dl>
              <div><dt>Section</dt><dd>{sop.section}</dd></div>
              <div><dt>Effective</dt><dd>{formatDate(sop.effectiveDate)}</dd></div>
              <div><dt>Review due</dt><dd><Badge tone={dueTone(sop.reviewDueDate)}>{formatDate(sop.reviewDueDate)}</Badge></dd></div>
              <div><dt>Owner</dt><dd>{sop.owner}</dd></div>
            </dl>
            <p>{sop.changeSummary}</p>
            <span className="link-placeholder">{sop.attachment}</span>
          </article>
        ))}
      </div>
    </Panel>
  )
}

function TasksPage({
  db,
  canEdit,
  canCompletePersonal,
  currentUser,
  onAdd,
  onComplete,
}: {
  db: LabDatabase
  canEdit: boolean
  canCompletePersonal: boolean
  currentUser: string
  onAdd: () => void
  onComplete: (task: TaskItem) => void
}) {
  return (
    <Panel title="To-Do and Task Management" actionLabel={canEdit ? 'Add task' : undefined} onAction={onAdd}>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Task</th>
              <th>Category</th>
              <th>Assigned to</th>
              <th>Due</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Completion</th>
              <th>Notes</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {db.tasks.map((task) => {
              const staff = db.staff.find((person) => person.id === task.assignedTo)
              const canComplete = canEdit || (canCompletePersonal && staff?.name === currentUser)
              return (
                <tr key={task.id}>
                  <td data-label="Task"><strong>{task.title}</strong></td>
                  <td data-label="Category">{task.category}</td>
                  <td data-label="Assigned to">{staff?.name}</td>
                  <td data-label="Due">{formatDate(task.dueDate)}</td>
                  <td data-label="Priority"><Badge tone={priorityTone(task.priority)}>{task.priority}</Badge></td>
                  <td data-label="Status"><Badge tone={statusTone(task.status)}>{task.status}</Badge></td>
                  <td data-label="Completion">{task.completionDate ? formatDate(task.completionDate) : 'Pending'}</td>
                  <td data-label="Notes">{task.notes}</td>
                  <td data-label="Action">{task.status !== 'Complete' && canComplete && <button className="secondary" onClick={() => onComplete(task)}>Complete</button>}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

function RemindersPage({ reminders, canEdit, onAdd }: { reminders: Reminder[]; canEdit: boolean; onAdd: () => void }) {
  return (
    <Panel title="Important Reminders" actionLabel={canEdit ? 'Add reminder' : undefined} onAction={onAdd}>
      <div className="card-grid">
        {reminders.map((reminder) => (
          <article className="record-card" key={reminder.id}>
            <div className="record-head">
              <h3>{reminder.title}</h3>
              <Badge tone={dueTone(reminder.dueDate)}>{dueLabel(reminder.dueDate)}</Badge>
            </div>
            <p>{reminder.type}</p>
            <dl>
              <div><dt>Owner</dt><dd>{reminder.owner}</dd></div>
              <div><dt>Due date</dt><dd>{formatDate(reminder.dueDate)}</dd></div>
              <div><dt>Status</dt><dd>{reminder.status}</dd></div>
            </dl>
          </article>
        ))}
      </div>
    </Panel>
  )
}

function InstrumentLogPage({ logs, canEdit, onAdd }: { logs: InstrumentLog[]; canEdit: boolean; onAdd: () => void }) {
  return (
    <Panel title="Instrument/Error Log" actionLabel={canEdit ? 'Add log' : undefined} onAction={onAdd}>
      <div className="card-grid">
        {logs.map((log) => (
          <article className="record-card" key={log.id}>
            <div className="record-head">
              <div>
                <p className="eyebrow">{formatDateTime(log.dateTime)}</p>
                <h3>{log.instrument}</h3>
              </div>
              <Badge tone="info">{log.workflowStep}</Badge>
            </div>
            <p><strong>{log.issue}</strong></p>
            <p>{log.troubleshooting}</p>
            <dl>
              <div><dt>Section</dt><dd>{log.section}</dd></div>
              <div><dt>Downtime</dt><dd>{log.downtime}</dd></div>
              <div><dt>Vendor</dt><dd>{log.vendorContacted ? 'Contacted' : 'Not contacted'}</dd></div>
              <div><dt>Ticket</dt><dd>{log.ticketNumber}</dd></div>
              <div><dt>Resolution</dt><dd>{log.resolution}</dd></div>
              <div><dt>Follow-up</dt><dd>{log.followUpNeeded}</dd></div>
              <div><dt>Documented by</dt><dd>{log.documentedBy}</dd></div>
            </dl>
          </article>
        ))}
      </div>
    </Panel>
  )
}

function WorkflowPage({ items, canEdit, onAdd }: { items: WorkflowImprovement[]; canEdit: boolean; onAdd: () => void }) {
  return (
    <Panel title="Workflow Improvement Log" actionLabel={canEdit ? 'Add improvement' : undefined} onAction={onAdd}>
      <div className="card-grid">
        {items.map((item) => (
          <article className="record-card" key={item.id}>
            <div className="record-head">
              <h3>{item.problem}</h3>
              <Badge tone={priorityTone(item.priority)}>{item.priority}</Badge>
            </div>
            <p>{item.proposedImprovement}</p>
            <dl>
              <div><dt>Owner</dt><dd>{item.owner}</dd></div>
              <div><dt>Target</dt><dd>{formatDate(item.targetDate)}</dd></div>
              <div><dt>Status</dt><dd>{item.status}</dd></div>
              <div><dt>Outcome</dt><dd>{item.outcome}</dd></div>
              <div><dt>Follow-up</dt><dd>{item.followUpNotes}</dd></div>
            </dl>
          </article>
        ))}
      </div>
    </Panel>
  )
}

function QcCompliancePage({ events, canEdit, onAdd }: { events: QCEvent[]; canEdit: boolean; onAdd: () => void }) {
  return (
    <Panel title="QC/Compliance Log" actionLabel={canEdit ? 'Add QC event' : undefined} onAction={onAdd}>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Event type</th>
              <th>Section</th>
              <th>Date</th>
              <th>Description</th>
              <th>Corrective action</th>
              <th>Responsible</th>
              <th>Review</th>
              <th>Notification</th>
              <th>Completion</th>
              <th>Document</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id}>
                <td data-label="Event type">{event.eventType}</td>
                <td data-label="Section">{event.section}</td>
                <td data-label="Date">{formatDate(event.date)}</td>
                <td data-label="Description">{event.description}</td>
                <td data-label="Corrective action">{event.correctiveAction}</td>
                <td data-label="Responsible">{event.responsibleStaff}</td>
                <td data-label="Review"><Badge tone={statusTone(event.reviewStatus)}>{event.reviewStatus}</Badge></td>
                <td data-label="Notification">{event.notification}</td>
                <td data-label="Completion">{event.completionDate || 'Pending'}</td>
                <td data-label="Document">{event.supportingDocument}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

function AuditTrail({ events }: { events: AuditEvent[] }) {
  return (
    <Panel title="Mock Audit Trail">
      <div className="timeline-list">
        {events.map((event) => (
          <div className="timeline-row audit-row" key={event.id}>
            <span className="dot"></span>
            <div>
              <strong>{event.action} {event.itemType}</strong>
              <p>{event.summary}</p>
              <small>{event.user} - {formatDateTime(event.dateTime)} - {event.itemId}</small>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}

function Panel({
  title,
  children,
  actionLabel,
  onAction,
}: {
  title: string
  children: React.ReactNode
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>{title}</h2>
        {actionLabel && (
          <button className="primary" onClick={onAction}>
            <Plus size={16} />
            {actionLabel}
          </button>
        )}
      </div>
      {children}
    </section>
  )
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  )
}

function CompactItem({
  title,
  meta,
  badge,
  action,
}: {
  title: string
  meta: string
  badge?: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="compact-item">
      <div>
        <strong>{title}</strong>
        <p>{meta}</p>
      </div>
      <div className="compact-actions">
        {badge}
        {action}
      </div>
    </div>
  )
}

function Badge({ children, tone }: { children: React.ReactNode; tone: string }) {
  return <span className={`badge ${tone}`}>{children}</span>
}

function AlertRow({ message }: { message: string }) {
  return (
    <div className="alert-row">
      <AlertTriangle size={18} />
      <span>{message}</span>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return <p className="empty-state">{text}</p>
}

function addStaff(updateDb: (recipe: (draft: LabDatabase) => void, audit: Omit<AuditEvent, 'id' | 'dateTime'>) => void, user: string) {
  const name = window.prompt('Staff name')
  if (!name) return
  const role = window.prompt('Role/title', 'Medical Technologist')
  const id = `STF-${Date.now().toString().slice(-4)}`
  updateDb(
    (draft) => {
      draft.staff.push({
        id,
        name,
        role: staffRoles.includes(role as never) ? (role as StaffMember['role']) : 'Medical Technologist',
        primaryLocation: 'Main Microbiology Lab',
        employmentStatus: 'Full-time',
        benchCompetencies: [],
        shiftPreference: 'Day',
        notes: 'New placeholder staff record.',
        active: true,
      })
    },
    { action: 'Created', itemType: 'Staff', itemId: id, user, summary: `Added staff record for ${name}.` },
  )
}

function addScheduleAssignment(
  db: LabDatabase,
  updateDb: (recipe: (draft: LabDatabase) => void, audit: Omit<AuditEvent, 'id' | 'dateTime'>) => void,
  user: string,
) {
  const staff = db.staff.find((person) => person.active)
  if (!staff) return
  const bench = (window.prompt('Bench/area', 'Bench 3 - Urine Cultures') || 'Bench 3 - Urine Cultures') as Bench
  const id = `SCH-${Date.now()}`
  updateDb(
    (draft) => {
      draft.scheduleAssignments.push({
        id,
        staffId: staff.id,
        date: today,
        shift: 'Day',
        bench: benches.includes(bench) ? bench : 'Bench 3 - Urine Cultures',
        notes: 'Added from quick form.',
      })
    },
    { action: 'Created', itemType: 'ScheduleAssignment', itemId: id, user, summary: `Added ${staff.name} to ${bench}.` },
  )
}

function addSop(updateDb: (recipe: (draft: LabDatabase) => void, audit: Omit<AuditEvent, 'id' | 'dateTime'>) => void, user: string) {
  const title = window.prompt('SOP title')
  if (!title) return
  const id = `SOP-MIC-${Date.now().toString().slice(-3)}`
  updateDb(
    (draft) => {
      draft.sops.push({
        id,
        title,
        section: 'Bench 2 - Aerobic Cultures',
        version: '0.1',
        effectiveDate: today,
        reviewDueDate: '2027-06-18',
        owner: user,
        status: 'Draft',
        changeSummary: 'Initial draft placeholder.',
        attachment: 'Link placeholder',
      })
    },
    { action: 'Created', itemType: 'SOP', itemId: id, user, summary: `Created draft SOP ${title}.` },
  )
}

function addTask(
  db: LabDatabase,
  updateDb: (recipe: (draft: LabDatabase) => void, audit: Omit<AuditEvent, 'id' | 'dateTime'>) => void,
  user: string,
) {
  const title = window.prompt('Task title')
  if (!title) return
  const assignee = db.staff[0]
  const id = `TSK-${Date.now()}`
  updateDb(
    (draft) => {
      draft.tasks.push({
        id,
        title,
        category: 'Admin',
        assignedTo: assignee.id,
        dueDate: today,
        priority: 'Medium',
        status: 'Open',
        completionDate: '',
        notes: 'Added from quick form.',
      })
    },
    { action: 'Created', itemType: 'Task', itemId: id, user, summary: `Created task ${title}.` },
  )
}

function addReminder(updateDb: (recipe: (draft: LabDatabase) => void, audit: Omit<AuditEvent, 'id' | 'dateTime'>) => void, user: string) {
  const title = window.prompt('Reminder title')
  if (!title) return
  const id = `REM-${Date.now()}`
  updateDb(
    (draft) => {
      draft.reminders.push({ id, title, type: 'Staff meeting', dueDate: today, owner: user, status: 'Open' })
    },
    { action: 'Created', itemType: 'Reminder', itemId: id, user, summary: `Created reminder ${title}.` },
  )
}

function addInstrumentLog(updateDb: (recipe: (draft: LabDatabase) => void, audit: Omit<AuditEvent, 'id' | 'dateTime'>) => void, user: string) {
  const issue = window.prompt('Issue/error code')
  if (!issue) return
  const id = `INS-${Date.now()}`
  updateDb(
    (draft) => {
      draft.instrumentLogs.push({
        id,
        instrument: 'Instrument placeholder',
        dateTime: new Date().toISOString(),
        issue,
        section: 'Bench 2 - Aerobic Cultures',
        troubleshooting: 'Check, verify, execute, document workflow started.',
        workflowStep: 'Check',
        downtime: 'Pending',
        vendorContacted: false,
        ticketNumber: 'Pending',
        resolution: 'Pending',
        followUpNeeded: 'Pending review.',
        documentedBy: user,
      })
    },
    { action: 'Created', itemType: 'InstrumentLog', itemId: id, user, summary: `Logged instrument issue ${issue}.` },
  )
}

function addWorkflow(updateDb: (recipe: (draft: LabDatabase) => void, audit: Omit<AuditEvent, 'id' | 'dateTime'>) => void, user: string) {
  const problem = window.prompt('Current workflow/problem')
  if (!problem) return
  const id = `WFI-${Date.now()}`
  updateDb(
    (draft) => {
      draft.workflowImprovements.push({
        id,
        problem,
        proposedImprovement: 'Improvement proposal placeholder.',
        priority: 'Medium',
        owner: user,
        targetDate: today,
        status: 'Proposed',
        outcome: 'Pending',
        followUpNotes: 'Needs review.',
      })
    },
    { action: 'Created', itemType: 'WorkflowImprovement', itemId: id, user, summary: `Created workflow item ${problem}.` },
  )
}

function addQcEvent(updateDb: (recipe: (draft: LabDatabase) => void, audit: Omit<AuditEvent, 'id' | 'dateTime'>) => void, user: string) {
  const eventType = window.prompt('QC event type')
  if (!eventType) return
  const id = `QC-${Date.now()}`
  updateDb(
    (draft) => {
      draft.qcEvents.push({
        id,
        eventType,
        section: 'Inventory',
        date: today,
        description: 'QC/compliance placeholder event.',
        correctiveAction: 'Corrective action pending.',
        responsibleStaff: user,
        reviewStatus: 'Open',
        notification: 'Notification field pending.',
        completionDate: '',
        supportingDocument: 'Document placeholder',
      })
    },
    { action: 'Created', itemType: 'QCEvent', itemId: id, user, summary: `Created QC event ${eventType}.` },
  )
}

function completeTask(
  task: TaskItem,
  db: LabDatabase,
  updateDb: (recipe: (draft: LabDatabase) => void, audit: Omit<AuditEvent, 'id' | 'dateTime'>) => void,
  user: string,
  accessRole: AccessRole,
  canCompletePersonal: boolean,
) {
  const assignee = db.staff.find((person) => person.id === task.assignedTo)
  if (!canCompletePersonal || (accessRole === 'Staff' && assignee?.name !== user)) return
  updateDb(
    (draft) => {
      const target = draft.tasks.find((item) => item.id === task.id)
      if (target) {
        target.status = 'Complete'
        target.completionDate = new Date().toISOString().slice(0, 10)
      }
    },
    { action: 'Completed', itemType: 'Task', itemId: task.id, user, summary: `Marked ${task.title} complete.` },
  )
}

function getDuplicateAssignments(assignments: ScheduleAssignment[]) {
  const counts = new Map<string, number>()
  assignments.forEach((assignment) => {
    if (assignment.shift === 'Off/PTO') return
    const key = `${assignment.staffId}-${assignment.date}`
    counts.set(key, (counts.get(key) || 0) + 1)
  })
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([key]) => `Duplicate assignment detected for ${key.split('-').slice(0, 2).join('-')} on ${key.split('-').slice(2).join('-')}.`)
}

function getCoverageGaps(assignments: ScheduleAssignment[]) {
  const required: Bench[] = [
    'Bench 1 - Blood/CSF/Stool Cultures',
    'Bench 2 - Aerobic Cultures',
    'Bench 3 - Urine Cultures',
    'Bench 4 - Respiratory Culture',
  ]
  const coveredToday = new Set(assignments.filter((assignment) => assignment.date === today).map((assignment) => assignment.bench))
  return required.filter((bench) => !coveredToday.has(bench)).map((bench) => `Insufficient coverage: ${bench} has no assignment today.`)
}

function daysUntil(date: string) {
  const diff = new Date(`${date}T00:00:00`).getTime() - new Date(`${today}T00:00:00`).getTime()
  return Math.ceil(diff / 86_400_000)
}

function dueLabel(date: string) {
  const days = daysUntil(date)
  if (days < 0) return 'Overdue'
  if (days === 0) return 'Due today'
  return `${days} days`
}

function dueTone(date: string) {
  const days = daysUntil(date)
  if (days < 0) return 'bad'
  if (days <= 7) return 'warn'
  return 'info'
}

function statusTone(status: Status | string) {
  if (status === 'Complete' || status === 'Active') return 'good'
  if (status === 'Overdue' || status === 'Archived') return 'bad'
  if (status === 'Pending Review' || status === 'Under Review' || status === 'Draft') return 'warn'
  return 'info'
}

function priorityTone(priority: string) {
  if (priority === 'Critical') return 'bad'
  if (priority === 'High') return 'warn'
  if (priority === 'Medium') return 'info'
  return 'neutral'
}

function competencyTone(status: string, dueDate: string) {
  if (status === 'Restricted' || daysUntil(dueDate) < 0) return 'bad'
  if (status === 'Annual review due' || daysUntil(dueDate) <= 30) return 'warn'
  if (status === 'Competent') return 'good'
  return 'info'
}

function formatDate(date: string) {
  if (!date) return ''
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${date}T00:00:00`))
}

function formatDateTime(dateTime: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(dateTime))
}

export default App
