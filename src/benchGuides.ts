export type BenchGuideVisibility = 'Public-safe' | 'Private detail'

export interface BenchNotebookSection {
  title: string
  kicker: string
  items: string[]
}

export interface BenchPrivateNote {
  title: string
  summary: string
  visibility: BenchGuideVisibility
}

export interface BenchGuide {
  id: string
  name: string
  subtitle: string
  overview: string
  reviewStatus: string
  quickStart: string[]
  notebookSections: BenchNotebookSection[]
  privateNotes: BenchPrivateNote[]
  shiftReminders: string[]
}

export const benchGuides: BenchGuide[] = [
  {
    id: 'bench-3-urine-cultures',
    name: 'Bench 3 - Urine Cultures',
    subtitle: 'Pre-shift notebook',
    overview:
      'A quick read before starting the urine bench: what to check, what to keep visible, and which organism notes need the current approved bench guidance.',
    reviewStatus: 'Draft notebook',
    quickStart: [
      'Open the urine bench worklist and scan pending reads, workups, and follow-ups.',
      'Check QC, temperatures, reagent checks, and decontamination items before settling into culture reads.',
      'Separate plates or pending items into simple reads, workups, and follow-up review.',
      'Use the current SOP and senior tech guidance for exact workup and reporting decisions.',
    ],
    notebookSections: [
      {
        title: 'Before You Start',
        kicker: 'Get oriented before touching the stack.',
        items: [
          'Look for anything already pending from the prior day or handoff.',
          'Make sure the bench has what it needs for the first pass through urine cultures.',
          'Keep questionable items visible instead of burying them under routine reads.',
        ],
      },
      {
        title: 'QC and Temperatures',
        kicker: 'Do the housekeeping early so it does not chase you later.',
        items: [
          'Confirm required QC and temperature documentation is entered in the approved Epic/log workflow.',
          'If a QC or temperature item looks off, pause and ask a senior tech before moving forward.',
          'Anything unresolved should be easy to find again in the QC/compliance log or handoff.',
        ],
      },
      {
        title: 'Reading Rhythm',
        kicker: 'Keep the bench moving without losing the oddball items.',
        items: [
          'Review timed urine screens first when they are due.',
          'Group straightforward final/review items away from workups.',
          'Pull true workups into a separate visible pile or list.',
          'Do not let special follow-up items hide inside the routine stack.',
        ],
      },
      {
        title: 'Organism Reminders',
        kicker: 'These are memory joggers, not final procedure text.',
        items: [
          'Enterococcus group: check current bench note for confirmatory workup, Epic section workflow, and required code before finalizing.',
          'Yeast: confirm whether identification, comment, or additional handling is needed.',
          'Coag-negative Staph: verify reporting and susceptibility expectations before adding extra work.',
          'Group B Strep: check current SOP or senior tech guidance before finalizing.',
          'Diphtheroids, Lactobacillus, Aerococcus, and viridans group: review expected reporting notes before final.',
        ],
      },
      {
        title: 'Epic and Legacy LIS',
        kicker: 'Use current naming and do not let old LIS habits confuse the workflow.',
        items: [
          'Use current Epic workflow names when documenting urine workups.',
          'Legacy O-prefix labels from the old LIS are historical OMC Main indicators only.',
          'Do not copy old LIS strings forward unless they have been validated for current workflow.',
        ],
      },
      {
        title: 'Before You Leave',
        kicker: 'Make the next handoff boring and clear.',
        items: [
          'Check pending workups, unresolved QC items, and anything needing senior review.',
          'Leave a clear handoff note for anything that should not be finalized yet.',
          'Do not copy patient identifiers into this website or any public planning note.',
        ],
      },
    ],
    privateNotes: [
      {
        title: 'Enterococcus exact workup details',
        summary: 'Confirmatory test names, Epic section workflow, and code-level reminders belong in the private version.',
        visibility: 'Private detail',
      },
      {
        title: 'Exact Epic strings and codes',
        summary: 'Keep build-specific names, codes, and finalization steps out of the public site.',
        visibility: 'Private detail',
      },
      {
        title: 'SOP report wording',
        summary: 'Final report phrases and organism-specific comments should be linked from approved SOP content later.',
        visibility: 'Private detail',
      },
      {
        title: 'Special testing exceptions',
        summary: 'ESBL, Carba-R, TZP, and other exception workflows need authenticated/internal storage.',
        visibility: 'Private detail',
      },
    ],
    shiftReminders: [
      'This page is a shift-prep notebook, not the controlling SOP.',
      'When the notebook and SOP disagree, follow the current approved SOP and escalate.',
      'Use synthetic or de-identified examples only.',
    ],
  },
]
