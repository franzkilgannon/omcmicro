export type BenchGuideVisibility = 'Public-safe' | 'Restricted future content'

export interface BenchGuideSource {
  title: string
  detail: string
  status: string
}

export interface BenchGuideSection {
  title: string
  intent: string
  visibility: BenchGuideVisibility
  items: string[]
}

export interface BenchGuideIntakeItem {
  title: string
  source: string
  bucket: string
  visibility: BenchGuideVisibility
  nextAction: string
}

export interface BenchGuide {
  id: string
  name: string
  subtitle: string
  overview: string
  reviewStatus: string
  sourceDocs: BenchGuideSource[]
  sections: BenchGuideSection[]
  intakeItems: BenchGuideIntakeItem[]
  improvementQuestions: string[]
  futureFields: string[]
}

export const benchGuides: BenchGuide[] = [
  {
    id: 'bench-3-urine-cultures',
    name: 'Bench 3 - Urine Cultures',
    subtitle: 'Urine culture visibility map',
    overview:
      'Organizes the urine bench into review buckets so SOP structure, training needs, competency checkpoints, reminders, and workflow improvement ideas can be discussed without publishing restricted procedure details.',
    reviewStatus: 'Initial intake',
    sourceDocs: [
      {
        title: 'Urine culture SOP',
        detail: 'Use for official section structure, ownership, review status, and SOP tracker linkage.',
        status: 'Structure only',
      },
      {
        title: 'Notebook quick notes',
        detail: 'Use headings and themes to identify what should become checklists, training cards, or senior-review items.',
        status: 'Needs review',
      },
      {
        title: 'Legacy LIS labels',
        detail:
          'O-prefix examples such as OSEC and OPYR indicate historical Ochsner Main Campus performance in the prior LIS.',
        status: 'Normalize later',
      },
    ],
    sections: [
      {
        title: 'Daily Readiness',
        intent: 'Turn routine bench opening and closing work into task/checklist items.',
        visibility: 'Public-safe',
        items: [
          'Temperature, QC, decontamination, reagent, and logbook checks.',
          'Weekend urine bench support reminders.',
          'Items that should connect to QC/compliance logs.',
        ],
      },
      {
        title: 'Screening Workflow',
        intent: 'Separate screening concepts from step-by-step procedural text.',
        visibility: 'Restricted future content',
        items: [
          '18-hour urine screen.',
          '24-hour urine screen.',
          'Read-category decision points.',
        ],
      },
      {
        title: 'Workup Decision Support',
        intent: 'Identify future decision-tree cards after senior review.',
        visibility: 'Restricted future content',
        items: [
          'When identification is needed.',
          'When susceptibility testing is not routinely performed.',
          'When workup needs escalation or special testing.',
        ],
      },
      {
        title: 'Organism-Specific Notes',
        intent: 'Group organism notes so they are easier to validate and maintain.',
        visibility: 'Restricted future content',
        items: [
          'Coagulase-negative Staphylococcus.',
          'Yeast.',
          'Alpha hemolytic / viridans Streptococcus.',
          'Group B Streptococcus.',
          'Enterococcus.',
          'Aerococcus, diphtheroids, Lactobacillus, and related urine notes.',
        ],
      },
      {
        title: 'Special Testing / Exceptions',
        intent: 'Keep uncommon or high-risk paths visible without publishing internal procedure text.',
        visibility: 'Restricted future content',
        items: [
          'ESBL workflow bucket.',
          'TZP for Acinetobacter bucket.',
          'Carba-R bucket.',
          'GN broth follow-up bucket.',
        ],
      },
      {
        title: 'Legacy LIS and Epic Normalization',
        intent: 'Track old LIS naming so future Epic-era terminology stays clean.',
        visibility: 'Restricted future content',
        items: [
          'O-prefix labels are historical site indicators, not separate bench procedures.',
          'Create a controlled mapping table later if needed.',
          'Use synthetic examples only in the public app.',
        ],
      },
    ],
    intakeItems: [
      {
        title: 'Temp, QC, decon',
        source: 'Notebook',
        bucket: 'Daily Readiness',
        visibility: 'Public-safe',
        nextAction: 'Convert to checklist categories after supervisor review.',
      },
      {
        title: '18-hour urine screen',
        source: 'Notebook',
        bucket: 'Screening Workflow',
        visibility: 'Restricted future content',
        nextAction: 'Create a decision-card draft in private storage only.',
      },
      {
        title: '24-hour urine screen',
        source: 'Notebook',
        bucket: 'Screening Workflow',
        visibility: 'Restricted future content',
        nextAction: 'Link to SOP tracker and competency review.',
      },
      {
        title: 'Workups',
        source: 'Notebook',
        bucket: 'Workup Decision Support',
        visibility: 'Restricted future content',
        nextAction: 'Split into organism groups and senior-review flags.',
      },
      {
        title: 'No MicroScan / sensitivity',
        source: 'Notebook',
        bucket: 'Workup Decision Support',
        visibility: 'Restricted future content',
        nextAction: 'Keep as restricted policy-support content until approved.',
      },
      {
        title: 'Coag-negative Staph',
        source: 'Notebook',
        bucket: 'Organism-Specific Notes',
        visibility: 'Restricted future content',
        nextAction: 'Validate wording against current SOP and Epic workflow.',
      },
      {
        title: 'Yeast',
        source: 'Notebook',
        bucket: 'Organism-Specific Notes',
        visibility: 'Restricted future content',
        nextAction: 'Use synthetic examples only if this becomes training content.',
      },
      {
        title: 'Alpha hemolytic / viridans Strep',
        source: 'Notebook',
        bucket: 'Organism-Specific Notes',
        visibility: 'Restricted future content',
        nextAction: 'Group with other organism note cards.',
      },
      {
        title: 'Group B Strep',
        source: 'Notebook',
        bucket: 'Organism-Specific Notes',
        visibility: 'Restricted future content',
        nextAction: 'Mark for senior review because it can affect follow-up logic.',
      },
      {
        title: 'Enterococcus',
        source: 'Notebook',
        bucket: 'Organism-Specific Notes',
        visibility: 'Restricted future content',
        nextAction: 'Separate identification notes from report wording examples.',
      },
      {
        title: 'ESBL',
        source: 'Notebook',
        bucket: 'Special Testing / Exceptions',
        visibility: 'Restricted future content',
        nextAction: 'Create restricted special-testing bucket.',
      },
      {
        title: 'TZP for Acinetobacter',
        source: 'Notebook',
        bucket: 'Special Testing / Exceptions',
        visibility: 'Restricted future content',
        nextAction: 'Create restricted exception workflow bucket.',
      },
      {
        title: 'Carba-R',
        source: 'Notebook',
        bucket: 'Special Testing / Exceptions',
        visibility: 'Restricted future content',
        nextAction: 'Create restricted escalation workflow bucket.',
      },
      {
        title: 'General notes and result examples',
        source: 'Notebook',
        bucket: 'Improvement Backlog',
        visibility: 'Restricted future content',
        nextAction: 'Rewrite as synthetic examples before any public display.',
      },
    ],
    improvementQuestions: [
      'Which items are official SOP content versus local bench tips?',
      'Which steps should become daily tasks, competency checkpoints, or reminders?',
      'Which organism groups need senior technologist or supervisor review first?',
      'Which details must wait for authentication, role-based access, and internal hosting?',
    ],
    futureFields: [
      'benchId',
      'sectionOwner',
      'sourceDocuments',
      'reviewStatus',
      'lastReviewedDate',
      'visibilityLevel',
      'linkedSopIds',
      'linkedCompetencyIds',
      'linkedTaskTemplateIds',
    ],
  },
]
