export type AccessRole = 'Admin/Sr Tech' | 'Staff' | 'Read-only'

export type StaffRole =
  | 'Lab Assistant'
  | 'Lab Assistant Trainee'
  | 'Clinical/Medical Lab Technician'
  | 'Clinical/Medical Laboratory Scientist'
  | 'Medical Technologist'
  | 'Sr Medical Technologist'
  | 'Sr Medical Laboratory Scientist'
  | 'Lab Education Coordinator'
  | 'Venipuncture Operations Coordinator'
  | 'Inventory Coordinator'
  | 'Inventory Personnel'

export type Bench =
  | 'Bench 1 - Blood/CSF/Stool Cultures'
  | 'Bench 2 - Aerobic Cultures'
  | 'Bench 3 - Urine Cultures'
  | 'Bench 4 - Respiratory Culture'
  | 'Bench 5 - Stool Kits + MALDI'
  | 'BACTEC Bench'
  | 'Mycology'
  | 'AFB'
  | 'Anaerobes'
  | 'Molecular'
  | 'MicroScan'
  | 'MALDI'
  | 'Set Up Bench'
  | 'Inventory'
  | 'Admin/Training'

export type ShiftType = 'Day' | 'Evening' | 'Night' | 'Weekend' | 'Holiday' | 'Off/PTO'

export type Status =
  | 'Open'
  | 'In Progress'
  | 'Complete'
  | 'Pending Review'
  | 'Overdue'
  | 'Archived'

export interface StaffMember {
  id: string
  name: string
  role: StaffRole
  primaryLocation: string
  employmentStatus: string
  benchCompetencies: Bench[]
  shiftPreference: string
  notes: string
  active: boolean
}

export interface ScheduleAssignment {
  id: string
  staffId: string
  date: string
  shift: ShiftType
  bench: Bench
  notes: string
}

export type CompetencyStatus =
  | 'Not trained'
  | 'Training'
  | 'Competent'
  | 'Annual review due'
  | 'Restricted'

export interface Competency {
  id: string
  staffId: string
  bench: Bench
  status: CompetencyStatus
  initialDate: string
  annualDueDate: string
  trainer: string
  notes: string
}

export type SopStatus = 'Draft' | 'Active' | 'Under Review' | 'Archived'

export interface Sop {
  id: string
  title: string
  section: string
  version: string
  effectiveDate: string
  reviewDueDate: string
  owner: string
  status: SopStatus
  changeSummary: string
  attachment: string
}

export type TaskCategory =
  | 'Daily'
  | 'Weekly'
  | 'Monthly'
  | 'QC'
  | 'Maintenance'
  | 'Training'
  | 'Admin'
  | 'Compliance'

export type Priority = 'Low' | 'Medium' | 'High' | 'Critical'

export interface TaskItem {
  id: string
  title: string
  category: TaskCategory
  assignedTo: string
  dueDate: string
  priority: Priority
  status: Status
  completionDate: string
  notes: string
}

export interface Reminder {
  id: string
  title: string
  type: string
  dueDate: string
  owner: string
  status: Status
}

export interface InstrumentLog {
  id: string
  instrument: string
  dateTime: string
  issue: string
  section: Bench
  troubleshooting: string
  workflowStep: 'Check' | 'Verify' | 'Execute' | 'Document'
  downtime: string
  vendorContacted: boolean
  ticketNumber: string
  resolution: string
  followUpNeeded: string
  documentedBy: string
}

export interface WorkflowImprovement {
  id: string
  problem: string
  proposedImprovement: string
  priority: Priority
  owner: string
  targetDate: string
  status: string
  outcome: string
  followUpNotes: string
}

export interface QCEvent {
  id: string
  eventType: string
  section: Bench
  date: string
  description: string
  correctiveAction: string
  responsibleStaff: string
  reviewStatus: Status
  notification: string
  completionDate: string
  supportingDocument: string
}

export interface AuditEvent {
  id: string
  action: string
  itemType: string
  itemId: string
  user: string
  dateTime: string
  summary: string
}

export interface LabDatabase {
  staff: StaffMember[]
  benches: Bench[]
  scheduleAssignments: ScheduleAssignment[]
  competencies: Competency[]
  sops: Sop[]
  tasks: TaskItem[]
  reminders: Reminder[]
  instrumentLogs: InstrumentLog[]
  workflowImprovements: WorkflowImprovement[]
  qcEvents: QCEvent[]
  auditEvents: AuditEvent[]
}
