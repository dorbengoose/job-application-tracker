<!--
DON'T ADD: 
- Entire API Documentation
- Putdated code snippets
- Task Specific Instructions
- Hooks related stuff/instructions.
-->

# Project : Job Application Tracker
A kanban-style web app for tracking job applications.
Stack: Next.js 14, TypeScript, Tailwind, CSS, Supabase
The app runs at localhost: 4000 during development.

# Essential Commands
- Start dev server : `npm run dev`
- Run tests: `npm tests`
- Type check: `npm run typecheck`
- Build: `npm run build`
- Lint: `npm run lint`


## Conventions
- Functions/variables : camelCase
- CSS classes: kebab-case
- Files: kebab-case.tsx for components
- API routes: /api/resource-name (REST conventions)

## Structure
/app - Next.js app directory
/components: reusable UI components
/lib - utilites and helpers
/types - Typescript type definitions
/supabase - database migrtions and types
State management: React Context (no Redux)

## Testing
- Framework: Vitest + React Testing Library
- Run a single test: `npm test --grep "TestName"`
- Test files mirror source: /components/Button.tsx -> /components/Button.test.tsx
- Always run tests after making changes. Prioritize structural main changes. 
- If errors -> Enter a console.log on the terminal . Specify location and error type 

## Rules
- Never commit directly to main
- Never hardcore credentials -always use environment variables
- Always handle errors explicitly - no silent failures
- Prefer explicity over clever -readable code beats compact code

## Verification
- After code changes: run `npm run typecheck && npm test`
- After UI changes: take a screenshot and compare to requirements
- After database changes: verify with a test query
- When uncertain: Ask. Never assume.
