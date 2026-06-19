# OMC Micro Working Definition

OMC Micro is a secure internal Microbiology staffing and operations hub used to coordinate bench coverage, staff competencies, schedules, tasks, SOP reviews, reminders, instrument issues, QC/compliance events, and workflow improvements without storing patient-identifiable information.

It should feel like a daily operations control board, not a marketing site and not a social staff directory.

## Core Design Principles

### Mobile-First

- Optimize for iPhone use.
- Prefer card views before spreadsheet views.
- Keep tap targets large.
- Use quick filters and minimal typing for daily workflows.
- Make `Today`, `This Week`, and `Due Soon` views easy to reach.

### Operations-Focused

- Prioritize bench coverage, staffing gaps, overdue items, and unresolved issues.
- Avoid unnecessary graphics or decorative elements.
- Every page should answer: `What needs attention?`

### Compliance-Aware

- Do not store PHI.
- Do not enter MRNs, accession numbers, DOBs, patient names, or culture-specific patient identifiers.
- QC/compliance logs should use operational event IDs only.
- Build with CLIA/CAP-style readiness in mind: dates, responsible person, status, corrective action, review, and audit trail.

### Expandable

- Start simple with local/mock data.
- Structure data so it can later move to Supabase, Firebase, PostgreSQL, SQLite, or an approved internal database.
- Keep benches, roles, statuses, and shift types easy to centralize and migrate.

## Module Map

| Module | Primary purpose | Highest-value feature |
| --- | --- | --- |
| Dashboard | Daily command center | Today's coverage, gaps, due items, unresolved logs |
| Staff Roster | Staff directory and availability reference | Searchable staff cards with role, bench skills, and shift preference |
| Schedule | Shift and bench planning | Weekly/monthly coverage view with conflict flags |
| Competencies | Bench qualification tracking | Staff-by-bench matrix with due/overdue indicators |
| SOP Tracker | Document control support | Version, review date, owner, status, archive flag |
| Tasks | Daily/weekly/monthly work tracking | Assigned tasks with priority and completion status |
| Reminders | Operational alerts | QC, PM, reagent, competency, and review reminders |
| Instrument/Error Log | Analyzer/system issue documentation | Check / Verify / Execute / Document workflow |
| Workflow Improvement Log | Continuous improvement tracking | Problem -> proposed change -> outcome |
| QC/Compliance Log | Corrective action and quality events | Event, impact, corrective action, review, closure |
| Audit Trail | Accountability layer | Automatic record of create/edit/complete/archive actions |

## Staff Roster Direction

Current visible roster columns:

```text
Name | Title | Location | Status | Benches | Shift Pref
```

Recommended staff fields for the future database:

- Staff ID
- Display Name
- Title
- Location
- Employment/Work Status
- Primary Shift Preference
- Secondary Shift Preference
- Bench Competencies
- Training Restrictions
- Can Work Independently
- Can Precept
- Weekend Eligibility
- Holiday Eligibility
- Notes
- Active/Inactive
- Last Updated
- Updated By

Mobile display should avoid a wide table. Preferred card pattern:

```text
Name
Title
Location
Status badge
Bench chips
Shift preference
```

## Standard Status Language

### Staff Status

- Active
- Training
- Float/PRN
- Leave
- Restricted
- Inactive

### Bench Competency Status

- Not Trained
- In Training
- Observed Only
- Competent
- Annual Review Due
- Restricted
- Expired

### Schedule Status

- Draft
- Posted
- Changed
- Coverage Concern
- Final

### SOP Status

- Draft
- Active
- Technical Review
- Supervisor/Director Review
- Annual Review Due
- Under Revision
- Archived
- Retired

### Task Status

- Not Started
- In Progress
- Blocked
- Complete
- Verified

### QC/Compliance Status

- Open
- Investigation Pending
- Corrective Action Pending
- Supervisor Review
- Closed
- Trend Monitoring

### Instrument/Error Status

- Open
- Monitoring
- Vendor Contacted
- Resolved
- Follow-Up Required
- Closed

## Schedule Planning Logic

Schedule assignments should eventually validate:

- Duplicate staff assignment on the same date/shift.
- Bench assignment where the staff member is not competent.
- Trainee assigned without a competent/preceptor staff member.
- Required bench left uncovered.
- Staff assigned while marked PTO/leave/unavailable.
- Missing senior/lead coverage where required.
- Schedule changes after posting.

Future coverage requirements should be modeled separately:

- Day of week
- Shift
- Bench/area
- Minimum staff required
- Required role/skill
- Can trainee cover
- Requires senior/lead

## Dashboard Priorities

The dashboard should stay high-signal:

- Today's Staffing
- Today's Bench Coverage
- Needs Attention
- Tasks Due Today
- Overdue Tasks
- SOPs Due for Review
- Competencies Due Soon
- Open Instrument Issues
- Open QC/Compliance Events
- Upcoming Reminders
- Recent Schedule Changes

Recommended language:

- Needs Attention
- Due Within 7 Days
- Open Issues
- Recently Updated
- Coverage Concern
- Corrective Action Pending
- Annual Review Due

## Instrument/Error Workflow

Use the professional troubleshooting sequence:

1. Check: document the observed issue.
2. Verify: confirm the issue and scope.
3. Execute: record troubleshooting and corrective steps.
4. Document: close the loop with resolution, downtime, follow-up, and notification status.

## QC/Compliance Workflow

Recommended event flow:

1. Event Identified
2. Immediate Action Taken
3. Investigation
4. Corrective Action
5. Review
6. Closure
7. Trend Monitoring

Use operational language only, such as:

- AFB QC issue
- Media QC failure
- Temperature excursion
- Instrument QC out of range
- Delayed maintenance documentation
- Competency documentation gap
- SOP review overdue

## Audit Trail Concept

The audit trail should be automatic and read-only.

Each event should capture:

- Audit ID
- Date/time
- User
- Action
- Module
- Item ID
- Previous status
- New status
- Summary of change

Do not make audit records manually editable.

## Build Order

1. App shell, navigation, dashboard mock cards
2. Staff Roster and Bench list
3. Competency matrix
4. Schedule builder with coverage flags
5. Tasks and reminders
6. SOP tracker
7. Instrument/Error Log
8. QC/Compliance Log
9. Workflow Improvement Log
10. Audit trail and role-based access

The immediate planning target is the Staff Roster plus Bench Competency data dictionary. That drives scheduling correctly and prevents the app from becoming only a staff list.
