# Bench Guides

Bench Guides are the planning layer between staff competency, SOP tracking, daily task work, and future decision support.

Because the current public site is hosted on GitHub Pages, Bench Guides must stay public-safe. Do not publish controlled SOP text, detailed LIS instructions, patient-linked examples, or internal-only workup details until the app has authentication or approved internal hosting.

## Bench 3 - Urine Cultures

Initial source package reviewed:

- Official urine culture SOP, uncontrolled copy
- Notebook screenshots for urine bench quick notes

## Public-Safe Buckets

Use these buckets to organize bench information before deciding what belongs in the application:

1. Source Package
2. Daily Readiness
3. Screening Workflow
4. Workup Decision Support
5. Organism-Specific Notes
6. Special Testing / Exceptions
7. Legacy LIS Notes
8. Improvement Questions

## Bench 3 Intake Map

Initial notebook/SOP headings were sorted this way:

| Intake item | Bucket | Public site handling |
| --- | --- | --- |
| Temp, QC, decon | Daily Readiness | Safe as checklist categories after review |
| 18-hour urine screen | Screening Workflow | Restricted placeholder only |
| 24-hour urine screen | Screening Workflow | Restricted placeholder only |
| Workups | Workup Decision Support | Restricted placeholder only |
| No MicroScan / sensitivity | Workup Decision Support | Restricted placeholder only |
| Coag-negative Staph | Organism-Specific Notes | Restricted placeholder only |
| Yeast | Organism-Specific Notes | Restricted placeholder only |
| Alpha hemolytic / viridans Strep | Organism-Specific Notes | Restricted placeholder only |
| Group B Strep | Organism-Specific Notes | Restricted placeholder only |
| Enterococcus | Organism-Specific Notes | Restricted placeholder only |
| ESBL | Special Testing / Exceptions | Restricted placeholder only |
| TZP for Acinetobacter | Special Testing / Exceptions | Restricted placeholder only |
| Carba-R | Special Testing / Exceptions | Restricted placeholder only |
| General notes and result examples | Improvement Backlog | Rewrite as synthetic examples before display |

Legacy labels such as OSEC and OPYR should be treated as historical Ochsner Main Campus indicators from the prior LIS, not separate bench procedures. Epic-era labels should be normalized later in a controlled mapping table.

## Internal Detail Handling

Detailed SOP steps, local workup instructions, and legacy LIS strings should eventually be stored only when the app has one of these:

- Authentication and role-based access
- Approved internal hosting
- Database access controls
- Audit logging for edits
- Clear ownership/review process for content updates

## Data Model Direction

Future Bench Guide fields:

```text
benchId
benchName
sectionOwner
sourceDocuments
dailyReadinessItems
screeningWorkflowItems
workupDecisionItems
organismNoteGroups
specialTestingGroups
legacyLisNotes
improvementQuestions
reviewStatus
lastReviewedDate
reviewedBy
visibilityLevel
```

`visibilityLevel` should separate public-safe headings from restricted internal details.
