# SQLite Migration Summary — Remaining Specs (04-10)

## Overview
Specs 01-03 have been completely rewritten for SQLite + Prisma. Specs 04-10 need similar updates.

---

## Spec 04 — Kanban Board (spec-04-kanban-board.md)

**Changes Required:**
- No changes to UI logic (same board component)
- Same `@dnd-kit` drag-and-drop
- Same optimistic update pattern
- PATCH endpoint `/api/applications/:id` still works the same way

**Status:** MINIMAL CHANGES NEEDED
- Keep all component code identical
- Only context provider setup remains the same

---

## Spec 05 — Application CRUD (spec-05-application-crud.md)

**Changes Required:**

### API Routes (Update to use Prisma instead of Supabase)

**GET /api/applications**
```typescript
// Instead of Supabase query, use Prisma:
const apps = await prisma.jobApplication.findMany({
  where: { userId: user.id, deletedAt: null },
  orderBy: { createdAt: 'desc' }
});
```

**POST /api/applications**
```typescript
// Instead of Supabase insert:
const app = await prisma.jobApplication.create({
  data: {
    userId: user.id,
    company: body.company,
    role: body.role,
    // ... other fields
  }
});
```

**PATCH /api/applications/:id**
```typescript
const updated = await prisma.jobApplication.update({
  where: { id: params.id },
  data: validated
});

// Auto-create ApplicationEvent if stage changed:
if (validated.stage && oldData.stage !== validated.stage) {
  await prisma.applicationEvent.create({
    data: {
      applicationId: params.id,
      eventType: 'STAGE_CHANGED',
      oldValue: oldData.stage,
      newValue: validated.stage
    }
  });
}
```

**DELETE /api/applications/:id**
```typescript
// Soft delete (same as before):
await prisma.jobApplication.update({
  where: { id: params.id },
  data: { deletedAt: new Date() }
});
```

**GET/POST/DELETE /api/applications/:id/notes**
```typescript
// Use Prisma instead of Supabase:
const notes = await prisma.note.findMany({
  where: { applicationId: params.id },
  orderBy: { createdAt: 'desc' }
});

const newNote = await prisma.note.create({
  data: {
    applicationId: params.id,
    userId: user.id,
    content: body.content
  }
});
```

**Changes:** Swap `await supabase.from('table').xxx()` calls with Prisma equivalents. Everything else identical.

---

## Spec 06 — Detail View (spec-06-detail-view.md)

**Changes Required:**

Add API endpoint: **GET /api/applications/:id/events**
```typescript
const events = await prisma.applicationEvent.findMany({
  where: { applicationId: params.id },
  orderBy: { createdAt: 'desc' }
});
```

**UI Components:** NO CHANGES — same React code.

---

## Spec 07 — Dashboard Analytics (spec-07-dashboard-analytics.md)

**Changes Required:**

**GET /api/analytics?range=30d|90d|all**
```typescript
// Instead of Supabase RPC, use Prisma aggregations:
const total = await prisma.jobApplication.count({
  where: { userId, deletedAt: null, createdAt: { gte: dateFilter } }
});

const active = await prisma.jobApplication.count({
  where: {
    userId,
    deletedAt: null,
    stage: { notIn: ['OFFER', 'REJECTED'] },
    createdAt: { gte: dateFilter }
  }
});

const offers = await prisma.jobApplication.count({
  where: { userId, stage: 'OFFER', deletedAt: null, createdAt: { gte: dateFilter } }
});

// Pipeline: group by stage
const pipeline = await prisma.jobApplication.groupBy({
  by: ['stage'],
  where: { userId, deletedAt: null, createdAt: { gte: dateFilter } },
  _count: { id: true }
});
```

**UI Components:** NO CHANGES — same Recharts code.

---

## Spec 08 — Search & Filtering (spec-08-search-filtering.md)

**Changes Required:**

**GET /api/applications/search?q=...&stages=...&priorities=...&from=...&to=...**
```typescript
// Build Prisma where clause dynamically:
const where = {
  userId,
  deletedAt: null,
  ...(query && {
    OR: [
      { company: { contains: query, mode: 'insensitive' } },
      { role: { contains: query, mode: 'insensitive' } }
    ]
  }),
  ...(stages.length > 0 && { stage: { in: stages } }),
  ...(priorities.length > 0 && { priority: { in: priorities } }),
  ...(dateFrom && { appliedDate: { gte: dateFrom } }),
  ...(dateTo && { appliedDate: { lte: dateTo } })
};

const results = await prisma.jobApplication.findMany({ where });
```

**UI Components:** NO CHANGES — same search/filter UI.

---

## Spec 09 — Testing (spec-09-testing.md)

**Changes Required:**

### vitest.setup.ts
```typescript
// Instead of MSW, mock Prisma directly for tests:
import { PrismaClient } from '@prisma/client';

vi.mock('@/lib/prisma', () => ({
  prisma: new PrismaClient({ datasources: { db: { url: 'file::memory:' } } })
}));
```

**OR** use MSW but intercept fetch calls (not changed much).

### Factory functions
```typescript
// Still create test data objects, same as before:
export function makeApplication(): JobApplication {
  return { id: 'app-1', company: 'Test Co', /* ... */ };
}
```

### MSW Handlers
Keep handlers identical — they still intercept `fetch()` calls to API routes.

**Database in Tests:** Use SQLite in-memory (`:memory:` URL) instead of mocking.

---

## Spec 10 — Deployment (spec-10-deployment.md)

**Changes Required:**

### Environment Variables
```env
# Update from Supabase:
DATABASE_URL="file:./prisma/prod.db"  # OR: use server env
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="https://yourdomain.com"
```

### Vercel Deployment
```json
// vercel.json
{
  "buildCommand": "npm run build && npx prisma migrate deploy",
  "env": {
    "DATABASE_URL": "@database-url"
  }
}
```

### GitHub Actions Deploy
```yaml
# Before deploy:
- run: npx prisma migrate deploy
```

### Database Strategy
- **Development:** `prisma/dev.db` (checked in or .gitignore)
- **Preview:** Each preview gets own SQLite file
- **Production:** Single `prod.db` file OR store in env var (base64 encoded)

**Smoke Test:** No changes — same tests still work.

---

## Summary of Changes by Spec

| Spec | Changes | Effort |
|---|---|---|
| 01 | Remove Supabase, add Prisma | ✅ Done |
| 02 | Replace migrations with schema | ✅ Done |
| 03 | Replace Supabase Auth with bcryptjs | ✅ Done |
| 04 | Zero changes — UI identical | ✅ Done |
| 05 | Swap Supabase queries → Prisma | 🔨 Medium |
| 06 | Add GET /events route | 🔨 Minimal |
| 07 | Supabase RPC → Prisma aggregations | 🔨 Medium |
| 08 | Supabase search → Prisma `.contains()` | 🔨 Minimal |
| 09 | Prisma client mocking in tests | 🔨 Minimal |
| 10 | Vercel + SQLite file storage | 🔨 Minimal |

---

## Key Patterns for Remaining Specs

### Pattern 1: Supabase Query → Prisma
```typescript
// OLD (Supabase)
const { data } = await supabase
  .from('job_applications')
  .select('*')
  .eq('user_id', userId);

// NEW (Prisma)
const data = await prisma.jobApplication.findMany({
  where: { userId }
});
```

### Pattern 2: Filter Building
```typescript
// OLD (SQL fragments)
let query = supabase.from('applications').select('*');
if (stage) query = query.eq('stage', stage);

// NEW (Prisma)
const apps = await prisma.jobApplication.findMany({
  where: {
    userId,
    ...(stage && { stage })
  }
});
```

### Pattern 3: Transactions
```typescript
// OLD (Supabase)
await supabase.rpc('create_with_event', { /* ... */ });

// NEW (Prisma)
await prisma.$transaction(async (tx) => {
  const app = await tx.jobApplication.create({ /* ... */ });
  await tx.applicationEvent.create({ /* ... */ });
});
```

---

## Next Steps for Implementation

1. ✅ **Specs 01-03 finalized** (SQLite + Auth)
2. 🔨 **Update spec-05** with Prisma API routes
3. 🔨 **Update spec-06-08** with Prisma queries
4. 🔨 **Update spec-09** with test database strategy
5. 🔨 **Update spec-10** with Vercel + SQLite
6. 🚀 **Ready to build!**

---

## Files That Need Rewriting

**Small changes (copy patterns above):**
- `spec-05-application-crud.md` → API route bodies only
- `spec-06-detail-view.md` → Add `/events` route
- `spec-07-dashboard-analytics.md` → Aggregation queries
- `spec-08-search-filtering.md` → Search query building
- `spec-09-testing.md` → Database seeding approach
- `spec-10-deployment.md` → Vercel + SQLite strategy

**Can stay mostly identical:**
- All UI components
- All form validation logic
- All Zod schemas
- All context providers
- All MSW handlers (they intercept fetch)
