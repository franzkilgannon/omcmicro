# OMC Micro Operations Hub

A secure internal Microbiology staffing and operations hub used to coordinate bench coverage, staff competencies, schedules, tasks, SOP reviews, reminders, instrument issues, QC/compliance events, and workflow improvements without storing patient-identifiable information.

Version 1 is a local-first React + TypeScript prototype. It uses mock data and stores edits in browser `localStorage`.

## Compliance Notes

- Do not enter patient names, MRNs, accession numbers, dates of birth, or any PHI.
- Seed data is fake and intended only to demonstrate staffing, SOP, QC, and operations workflows.
- The data model includes CLIA/CAP-style fields such as effective dates, review due dates, owner/responsible staff, completion dates, status tracking, and audit events.
- Authentication is mocked through the `Mock access` selector: `Admin/Sr Tech`, `Staff`, and `Read-only`.

## Setup

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

Run the standard local verification:

```bash
npm run verify
```

Preview the production build:

```bash
npm run preview
```

## GitHub Pages Deployment

This project is prepared for GitHub Pages with the custom domain `omcmicro.com`.

1. Create a GitHub repository, recommended name: `omcmicro`.
2. Push this project to the repository's `main` branch.
3. In GitHub, open `Settings` -> `Pages`.
4. Set `Build and deployment` source to `GitHub Actions`.
5. The included workflow `.github/workflows/deploy-pages.yml` will run `npm ci`, `npm run verify`, build the app, add a `404.html` fallback for direct URLs such as `/staffroster`, and deploy `dist`.
6. In `Settings` -> `Pages`, confirm the custom domain is `omcmicro.com`.

The file `public/CNAME` contains:

```text
omcmicro.com
```

Because it lives in `public`, Vite copies it into the deployed `dist` folder during builds.

## Namecheap DNS

For an apex/root domain like `omcmicro.com`, configure these records in Namecheap Advanced DNS:

```text
Type      Host  Value           TTL
A Record  @     185.199.108.153 Automatic
A Record  @     185.199.109.153 Automatic
A Record  @     185.199.110.153 Automatic
A Record  @     185.199.111.153 Automatic
CNAME     www   YOUR-GITHUB-USERNAME.github.io Automatic
```

Replace `YOUR-GITHUB-USERNAME` with the GitHub account or organization that owns the repo.

After DNS propagates, GitHub Pages should issue HTTPS automatically. In GitHub Pages settings, enable `Enforce HTTPS` once available.

## Folder Structure

```text
docs/
  working-definition.md  Product definition, design principles, status language, and build order
  role-model.md          Med Tech versus Sr Med Tech capabilities and implementation plan
  bench-guides.md        Public-safe bench guide structure and Bench 3 intake notes
src/
  App.tsx       Main application shell, pages, quick-add actions, and audit writes
  App.css       Responsive layout, tables, cards, badges, and print schedule styles
  benchGuides.ts Public-safe bench guide data and future private-content boundaries
  data.ts       Non-PHI seed data and bench list
  storage.ts    localStorage load/save helpers and audit event factory
  types.ts      TypeScript domain models for future database mapping
  main.tsx      React entry point
```

## Modules Included

- Dashboard with today's staffing, bench coverage, needs-attention items, reminders, due SOP/competency items, and staffing conflict flags
- Bench Guides with public-safe pre-shift notebook pages for bench reminders, organism headings, handoff notes, and future private workup details
- Staff roster with role/title, location, employment status, competencies, shift preference, restrictions, and active state
- Schedule builder with week/month views, shift/bench assignments, duplicate assignment detection, coverage gap flags, notes, and print/export
- Bench competency matrix with status, initial date, annual due date, trainer/preceptor, notes, and due indicators
- SOP tracker with version, effective date, review due date, owner, status, change summary, and link placeholder
- Task management with category, assignee, due date, priority, status, completion date, and notes
- Important reminders for QC, maintenance, reagent, training, CAP/CLIA readiness, and meetings
- Instrument/error log with Check, Verify, Execute, Document workflow labels
- Workflow improvement log
- QC/compliance log
- Mock audit trail for created and completed items

## Adding Records

Use the `Mock access` selector and choose `Admin/Sr Tech` to expose quick-add buttons. Quick-add forms use simple browser prompts in version 1 so the project stays lightweight.

- Add staff from `Staff Roster`
- Add assignments from `Schedule`
- Add SOPs from `SOP Tracker`
- Add tasks from `Tasks`
- Add reminders from `Reminders`
- Add instrument logs, workflow improvements, and QC events from their modules

Each create or complete action writes a mock audit record with action, item type, item ID, user, date/time, and summary.

## Local Persistence

The app stores data under this browser key:

```text
omc-micro-lab-db-v3
```

Clear site data or remove that key from browser DevTools to reload the seed data.

## Future Database Path

The app is structured so `storage.ts` can be replaced with a real data service later. Candidate backends:

- Supabase or PostgreSQL for relational audit-friendly records
- Firebase for quick internal prototypes
- SQLite for a small on-prem/local network deployment

Before production/internal deployment, add real authentication, authorization enforcement on the server, encrypted transport, backups, retention policies, role review, and hospital security approval.

## Mobile QA Standard

Most staff are expected to use iPhones, so UI changes should be checked at an iPhone-sized viewport before calling them done. Current baseline:

- iPhone 13-style viewport around `390 x 844`
- No horizontal page overflow
- Tables collapse into labeled cards on mobile
- Staff Roster keeps a mobile sort control because desktop table headers are hidden on phones
- Touch targets should stay around 44px tall where practical
