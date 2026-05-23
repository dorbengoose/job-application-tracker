# Job Application Tracker — Specs Folder

## Overview

This folder contains 10 comprehensive specification files for building a **Job Application Tracker** web app using:
- **Next.js 14** (App Router)
- **TypeScript** (strict mode)
- **Tailwind CSS** (styling)
- **SQLite + Prisma** (local database)
- **bcryptjs + Sessions** (authentication)
- **Vitest + React Testing Library** (testing)

## Specs Breakdown

### Phase 1: Foundation (Specs 01-03)

| Spec | Title | Status | Purpose |
|------|-------|--------|---------|
| **spec-01-infrastructure.md** | Bootstrap & Toolchain | ✅ COMPLETE | Next.js 14 + Prisma init, npm config, TypeScript setup |
| **spec-02-database.md** | SQLite + Prisma Schema | ✅ COMPLETE | Database schema definition, Prisma migrations, types |
| **spec-03-authentication.md** | Local Auth System | ✅ COMPLETE | bcryptjs password hashing, session-based auth, login/signup |

### Phase 2: Core Features (Specs 04-08)

| Spec | Title | Status | Purpose |
|------|-------|--------|---------|
| **spec-04-kanban-board.md** | Kanban Board UI | ✅ READY | 5-column drag-and-drop board, optimistic updates |
| **spec-05-application-crud.md** | Application CRUD API | 🔄 UPDATE NEEDED | REST endpoints + forms for job applications |
| **spec-06-detail-view.md** | Detail Panel | 🔄 UPDATE NEEDED | Slide-over panel with notes, contacts, timeline |
| **spec-07-dashboard-analytics.md** | Analytics Dashboard | 🔄 UPDATE NEEDED | Stats, pipeline chart, conversion funnel |
| **spec-08-search-filtering.md** | Search & Filters | 🔄 UPDATE NEEDED | Full-text search, URL-synced filters |

### Phase 3: Polish & Deploy (Specs 09-10)

| Spec | Title | Status | Purpose |
|------|-------|--------|---------|
| **spec-09-testing.md** | Test Suite | 🔄 UPDATE NEEDED | Vitest, factories, MSW mocks, 70/65% coverage |
| **spec-10-deployment.md** | Production Deploy | 🔄 UPDATE NEEDED | Vercel + SQLite file, CI/CD, Lighthouse audit |

---

## Quick Start

### Prerequisites
- Node.js 20+
- npm 10+

### Setup
```bash
# 1. Install dependencies
npm ci

# 2. Initialize Prisma and create SQLite database
npx prisma migrate dev --name init

# 3. (Optional) Seed with test data
npm run db:seed

# 4. Start development server
npm run dev
```

The app runs at **http://localhost:4000**

---

## Architecture Overview

### Database (SQLite + Prisma)
```
users (id, email, password_hash, fullName, createdAt)
  ├── job_applications (id, userId, company, role, stage, priority, ...)
  │   ├── notes (id, applicationId, userId, content, createdAt)
  │   └── application_events (id, applicationId, eventType, ...)
  └── sessions (id, userId, token, expiresAt)
```

### API Routes
```
/api/auth/
  ├── signup (POST)
  ├── login (POST)
  └── logout (POST)

/api/applications/
  ├── route (GET: list, POST: create)
  ├── [id]/route (GET: single, PATCH: update, DELETE: soft-delete)
  ├── [id]/notes/route (GET: list, POST: create, DELETE: delete)
  ├── [id]/events/route (GET: timeline events)
  ├── search/route (GET: full-text search + filters)
```

### Pages
```
/(auth)
  ├── login (login form)
  └── signup (signup form)

/(dashboard)
  ├── board (kanban board)
  ├── dashboard (stats + charts)
  └── applications/[id] (detail panel)
```

---

## Implementation Order

Follow this order to build the app:

1. **spec-01** → Initialize Next.js + Prisma
2. **spec-02** → Create SQLite database
3. **spec-03** → Build auth system
4. **spec-05** → Build API endpoints
5. **spec-04** → Build kanban board UI
6. **spec-06** → Build detail panel
7. **spec-07** → Build dashboard analytics
8. **spec-08** → Add search & filters
9. **spec-09** → Write tests
10. **spec-10** → Deploy to Vercel

---

## Key Technologies

| Technology | Purpose | Version |
|---|---|---|
| Next.js | Web framework | 14.2.5 |
| TypeScript | Type safety | 5.5.4 |
| Tailwind CSS | Styling | 3.4.7 |
| Prisma | Database ORM | 5.8.0 |
| SQLite | Local database | 3.x |
| bcryptjs | Password hashing | 2.4.3 |
| @dnd-kit | Drag & drop | 6.1.0 |
| Recharts | Charts | 2.12.7 |
| Zod | Validation | 3.23.8 |
| Vitest | Testing | 2.0.5 |

---

## Environment Variables

Create `.env.local` (copy from `.env.example`):
```env
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:4000"
```

---

## npm Scripts

```bash
# Development
npm run dev              # Start dev server on port 4000
npm run build            # Build for production
npm run start            # Start production server

# Code quality
npm run lint             # Run ESLint
npm run typecheck        # Check TypeScript
npm test                 # Run tests
npm run test:coverage    # Generate coverage report

# Database
npm run db:migrate       # Create/apply migrations
npm run db:push          # Sync schema to database
npm run db:seed          # Populate test data
npm run db:studio        # Open Prisma Studio GUI
```

---

## Testing Strategy

### Unit Tests
- API route handlers
- Validation schemas
- Utility functions

### Component Tests
- Forms (login, signup, application form)
- UI components (buttons, inputs, cards)
- Context providers

### Integration Tests
- Full auth flow (signup → login → logout)
- CRUD operations (create, read, update, delete apps)
- Search and filtering

### Database Testing
- Use SQLite in-memory (`:memory:` URL) for test isolation
- Factory functions generate test data
- MSW mocks API endpoints for UI tests

**Coverage Target:** 70% lines, 65% branches

---

## Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect repo to Vercel
3. Set environment variables
4. Vercel auto-deploys on push to main

### Database
- **Development:** `prisma/dev.db` (SQLite file)
- **Production:** SQLite file stored on Vercel filesystem OR base64-encoded in env var

---

## Milestones

| Milestone | Sprint | Success Criteria |
|-----------|--------|-----------------|
| **M1 — Infrastructure Ready** | 0 | Dev server runs, Prisma schema valid, CI passes |
| **M2 — Data + Auth Live** | 2 | Auth flows work, database persists, session valid |
| **M3 — Core Feature Complete** | 6 | Board + CRUD + detail panel working end-to-end |
| **M4 — Production Ready** | 10 | 70/65% coverage, Lighthouse ≥80/95/95, zero secrets |

---

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Vitest Documentation](https://vitest.dev/)

---

## Notes

- **No Supabase needed** — Everything is local SQLite
- **No external auth service** — bcryptjs + session tokens
- **No RLS complexity** — Auth checks in API handlers
- **Dev-first approach** — Full functionality locally before deploy
- **Type-safe throughout** — TypeScript strict mode + Prisma types

---

## Questions?

Refer to individual spec files for detailed requirements and code examples.
Each spec is self-contained and ready for implementation.
