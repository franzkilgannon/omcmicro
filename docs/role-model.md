# Role Model: Medical Laboratory Scientist vs Sr Medical Laboratory Scientist

This document converts the Med Tech and Sr Med Tech role PDFs into implementation guidance for OMC Micro.

Source documents reviewed:

- `D:\Ochsner\Medtech Role.pdf`
- `D:\Ochsner\Sr Medtech Role.pdf`

## Core Difference

The regular Medical Laboratory Scientist / Medical Technologist role represents an independently functioning bench technologist who performs testing, QC, maintenance, compliance activities, and routine troubleshooting within established procedures.

The Sr Medical Laboratory Scientist / Sr Medical Technologist role adds section-level responsibility: technical escalation, competency coordination, new procedure implementation, performance improvement/QC monitoring, and consultation with the supervisor/director or pathologist when appropriate.

In the application, title should not be the only thing that matters. The useful implementation is a role-capability model.

## Med Tech / MLS Capabilities

Typical capabilities to represent:

- Performs routine and specialized testing independently.
- Performs, reviews, and documents QC.
- Performs instrument maintenance and routine troubleshooting.
- Escalates out-of-control QC or technical issues appropriately.
- Follows regulatory, safety, accreditation, and proficiency testing requirements.
- Participates in performance improvement, inventory support, cost reduction, and supply/reagent workflows.
- May be competent on one or more benches.
- May create task, QC, instrument, schedule, and workflow records.

Recommended app permissions:

- View roster, schedule, tasks, SOPs, reminders, competencies, QC logs, and instrument logs.
- Create task/reminder/instrument issue entries.
- Mark assigned tasks complete.
- Document QC/compliance activity.
- Document troubleshooting steps.
- Cannot final-review competency signoff unless marked as preceptor/authorized.
- Cannot close higher-risk QC/compliance events unless assigned reviewer authority.

## Sr Med Tech / Sr MLS Capabilities

Additional capabilities to represent:

- Coordinates clinical competency in section.
- Helps coordinate section operations.
- Resolves day-to-day technical problems.
- Escalates to supervisor/director/pathologist as appropriate.
- Coordinates or supports new procedure implementation.
- Monitors performance improvement and QC activities.
- Helps maintain regulatory/accreditation readiness.
- Consults with supervisor/director.
- Can serve as lead/senior coverage when required by schedule rules.

Recommended app permissions:

- All Med Tech / MLS permissions.
- Can be marked as lead/senior coverage for a shift.
- Can precept or sign off competencies if authorized.
- Can review/verify task completion for assigned areas.
- Can review or close instrument logs.
- Can review QC/compliance events.
- Can own SOP review tasks.
- Can resolve coverage concerns or approve schedule changes after posting, if assigned that workflow.

## Staff Data Fields To Add

Add these fields behind the visible roster:

```text
roleLevel: Staff | Senior | Coordinator | Admin
canWorkIndependently: boolean
canPrecept: boolean
canSignCompetency: boolean
canReviewQcEvents: boolean
canCloseInstrumentLogs: boolean
canOwnSopReview: boolean
canLeadShift: boolean
authorizedSections: Bench[]
```

These fields should drive scheduling and review workflows more than title text alone.

## Schedule Implementation

Coverage requirements should support:

```text
requiresSeniorLead: boolean
requiresCompetentStaff: boolean
minimumStaffRequired: number
canTraineeCover: boolean
```

Validation rules:

- If a bench requires senior/lead coverage, at least one assigned staff member must have `canLeadShift`.
- If a trainee or restricted staff member is assigned, another assigned staff member should be competent and able to precept.
- If staff is assigned to a bench without competency, flag a coverage concern.
- If no competent staff is assigned to a required bench, flag uncovered coverage.

## Competency Implementation

Competency records should track:

```text
staffId
bench
status
initialDate
annualDueDate
trainerOrPreceptor
reviewer
signedOffBy
signedOffDate
restrictionNotes
```

Only staff with `canSignCompetency` should appear as signoff options.

Sr Med Techs and the Lab Education Coordinator are natural candidates for signoff/preceptor permissions, but the app should allow this to be configured per person.

## Instrument/Error Log Implementation

Use Sr Med Tech capabilities for escalation and closure:

- Any qualified staff can create an instrument issue.
- Med Tech / MLS can document Check, Verify, and Execute steps.
- Sr Med Tech / Sr MLS can be assigned as technical reviewer.
- Sr Med Tech / Sr MLS can close the issue after resolution, if authorized.

Useful fields:

```text
createdBy
assignedReviewer
requiresSeniorReview
vendorContacted
ticketNumber
finalStatus
closedBy
closedDate
```

## QC/Compliance Implementation

QC events should separate documentation from review/closure:

- Staff can create and document events.
- Sr Med Tech / Sr MLS or designated reviewer can review and close.
- Higher-risk events can require supervisor/pathologist notification.

Useful fields:

```text
responsibleStaff
reviewer
requiresSupervisorReview
requiresPathologistNotification
reviewStatus
closedBy
closedDate
```

## Dashboard Impact

Add high-signal dashboard cards later:

- Needs Senior Review
- Competencies Awaiting Signoff
- Open Instrument Issues Needing Review
- QC Events Awaiting Review
- Benches Missing Senior Coverage

## Implementation Order

1. Add role capability fields to staff data.
2. Mark Sr Med Tech / Sr MLS capability defaults.
3. Add preceptor/signoff fields to competency records.
4. Add senior-review fields to QC and instrument logs.
5. Add schedule validation for senior/lead coverage.
6. Add dashboard cards for items needing senior review.
