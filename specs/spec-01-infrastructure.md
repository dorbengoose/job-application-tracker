# Spec 01 — Infrastructure & Project Bootstrap (SQLite Local)

## Preconditions
None. This is the first spec to implement.

## Goal
Initialize the Next.js 14 project with TypeScript, Tailwind CSS, Prisma ORM for SQLite,
ESLint, Prettier, and Vitest. Configure the dev server on port 4000. Scaffold full directory
structure. Set up GitHub Actions CI.

## Critical Files to Create/Modify

### Root Configuration Files
- `package.json` — all scripts and dependencies (Prisma + bcryptjs, NO Supabase)
- `next.config.ts` — Next.js configuration with security headers
- `tsconfig.json` — TypeScript with strict mode and path aliases
- `tailwind.config.ts` — Tailwind theme with custom color tokens
- `postcss.config.js` — PostCSS plugins
- `.eslintrc.json` — ESLint rules and plugins
- `.prettierrc` — Code formatting rules
- `.prettierignore` — Files to skip in prettier
- `.gitignore` — Version control exclusions
- `middleware.ts` — Session validation middleware
- `vitest.config.ts` — Vitest with jsdom and coverage thresholds
- `vitest.setup.ts` — Test environment setup
- `.env.example` — environment variable template

### Prisma
- `prisma/schema.prisma` — database schema (SQLite)

### App Directory
- `app/layout.tsx` — root layout
- `app/page.tsx` — home page (redirect to /dashboard)
- `app/globals.css` — global styles and Tailwind directives

### CI/CD
- `.github/workflows/ci.yml` — GitHub Actions CI pipeline

### Empty Directories
```
/app
  /(auth)/
  /(dashboard)/
  /api/
/components
  /auth/
  /board/
  /applications/
  /detail/
  /dashboard/
  /search/
  /ui/
/lib
  /auth.ts (PASSWORD & SESSION LOGIC)
  /api/
  /context/
  /hooks/
  /utils/
  /validation/
/types
/prisma
  /migrations/ (GENERATED)
/tests
  /factories/
  /utils/
  /mocks/
/specs
```

## package.json (Updated for SQLite)

```json
{
  "name": "job-application-tracker",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 4000",
    "build": "next build",
    "start": "next start -p 4000",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:seed": "prisma db seed",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "next": "14.2.5",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "@prisma/client": "5.8.0",
    "bcryptjs": "2.4.3",
    "@dnd-kit/core": "6.1.0",
    "@dnd-kit/sortable": "8.0.0",
    "@dnd-kit/utilities": "3.2.2",
    "recharts": "2.12.7",
    "react-markdown": "9.0.1",
    "zod": "3.23.8",
    "clsx": "2.1.1",
    "tailwind-merge": "2.4.0"
  },
  "devDependencies": {
    "typescript": "5.5.4",
    "@types/react": "18.3.3",
    "@types/react-dom": "18.3.0",
    "@types/node": "20.14.14",
    "@types/bcryptjs": "2.4.6",
    "tailwindcss": "3.4.7",
    "autoprefixer": "10.4.19",
    "postcss": "8.4.40",
    "eslint": "8.57.0",
    "eslint-config-next": "14.2.5",
    "@typescript-eslint/eslint-plugin": "7.18.0",
    "@typescript-eslint/parser": "7.18.0",
    "eslint-plugin-jsx-a11y": "6.9.0",
    "prettier": "3.3.3",
    "vitest": "2.0.5",
    "@vitest/coverage-v8": "2.0.5",
    "@testing-library/react": "16.0.0",
    "@testing-library/user-event": "14.5.2",
    "@testing-library/jest-dom": "6.4.6",
    "vitest-axe": "0.1.0",
    "msw": "2.3.5",
    "jsdom": "24.1.1",
    "@vitejs/plugin-react": "4.3.1",
    "prisma": "5.8.0",
    "@prisma/cli": "5.8.0"
  }
}
```

## .env.example

```env
# Database
DATABASE_URL="file:./prisma/dev.db"

# App
NEXT_PUBLIC_APP_URL=http://localhost:4000
NODE_ENV=development
```

## prisma/schema.prisma (Basic Template)

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  fullName  String?
  createdAt DateTime @default(now())

  applications JobApplication[]
  notes        Note[]
  sessions     Session[]
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
}

model JobApplication {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  company     String
  role        String
  jobUrl      String?
  location    String?
  salaryMin   Int?
  salaryMax   Int?
  stage       Stage    @default(APPLIED)
  priority    Priority @default(MEDIUM)
  source      String?
  appliedDate DateTime

  contacts    Json     @default("[]")
  documents   Json     @default("{}")

  deletedAt   DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  notes       Note[]
  events      ApplicationEvent[]

  @@index([userId])
  @@index([stage])
}

model Note {
  id            String   @id @default(cuid())
  applicationId String
  application   JobApplication @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  content       String
  createdAt     DateTime @default(now())
}

model ApplicationEvent {
  id            String   @id @default(cuid())
  applicationId String
  application   JobApplication @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  eventType     EventType
  oldValue      String?
  newValue      String?
  createdAt     DateTime @default(now())
}

enum Stage {
  APPLIED
  PHONE_SCREEN
  INTERVIEW
  OFFER
  REJECTED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
}

enum EventType {
  CREATED
  STAGE_CHANGED
  NOTE_ADDED
  NOTE_DELETED
}
```

## GitHub Actions CI (.github/workflows/ci.yml)

```yaml
name: CI

on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main, dev]

jobs:
  ci:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Generate Prisma client
        run: npx prisma generate
      
      - name: Run linter
        run: npm run lint
      
      - name: Type check
        run: npm run typecheck
      
      - name: Run tests with coverage
        run: npm run test:coverage
```

## Acceptance Tests
- ✅ `npm run dev` starts on port 4000 without errors
- ✅ `npm run lint` exits with code 0
- ✅ `npm run typecheck` exits with code 0
- ✅ `npm run test` exits with code 0
- ✅ `npm run build` succeeds
- ✅ `prisma/dev.db` created after first `npm run dev`
- ✅ All directory stubs created
- ✅ `.env.example` committed (no actual values)
- ✅ GitHub Actions CI workflow passes

## Definition of Done
- [ ] `npm run dev` runs on port 4000 without errors
- [ ] `npm run lint` exits 0
- [ ] `npm run typecheck` exits 0
- [ ] `npm run test` exits 0
- [ ] `npm run build` succeeds
- [ ] Prisma schema.prisma valid (no errors on `npx prisma generate`)
- [ ] All directories scaffolded
- [ ] `.env.example` committed with no secrets
- [ ] Initial commit with message "chore: bootstrap Next.js 14 + Prisma + SQLite"
