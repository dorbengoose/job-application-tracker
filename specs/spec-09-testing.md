# Spec 09 — Test Suite & Coverage

## Preconditions
- spec-01 complete (Vitest configured)
- All feature specs complete or in progress

## Goal
Achieve 70% line coverage and 65% branch coverage. Provide reusable test utilities,
factory functions, and MSW handlers. Run accessibility checks on key components.

## Critical Files to Create

- `vitest.setup.ts` (expanded)
- `tests/utils/render.tsx`
- `tests/factories/index.ts`
- `tests/mocks/handlers.ts`
- `tests/mocks/server.ts`
- All `*.test.ts` and `*.test.tsx` files (co-located with source)

## Test Render Wrapper

```typescript
// tests/utils/render.tsx
import { render, RenderOptions } from '@testing-library/react';
import { ApplicationsProvider } from '@/lib/context/applications-context';
import { ToastProvider } from '@/components/ui/toast-provider';
import React from 'react';

function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <ApplicationsProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </ApplicationsProvider>
  );
}

export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

export * from '@testing-library/react';
export { renderWithProviders as render };
```

## Factory Functions

```typescript
// tests/factories/index.ts
import type { JobApplication, Note, ApplicationEvent } from '@/types';

let appIdCounter = 0;
let noteIdCounter = 0;
let eventIdCounter = 0;

export function makeApplication(overrides?: Partial<JobApplication>): JobApplication {
  return {
    id: `app-${++appIdCounter}`,
    userId: 'user-test-1',
    company: 'Acme Corp',
    role: 'Senior Engineer',
    jobUrl: 'https://example.com/job',
    location: 'San Francisco, CA',
    stage: 'applied',
    priority: 'medium',
    source: 'LinkedIn',
    appliedDate: '2025-01-15',
    contacts: [],
    documents: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  };
}

export function makeNote(overrides?: Partial<Note>): Note {
  return {
    id: `note-${++noteIdCounter}`,
    applicationId: 'app-1',
    userId: 'user-test-1',
    content: 'This is a test note',
    createdAt: new Date().toISOString(),
    ...overrides
  };
}

export function makeApplicationEvent(overrides?: Partial<ApplicationEvent>): ApplicationEvent {
  return {
    id: `event-${++eventIdCounter}`,
    applicationId: 'app-1',
    eventType: 'created',
    createdAt: new Date().toISOString(),
    ...overrides
  };
}

export function resetCounters() {
  appIdCounter = 0;
  noteIdCounter = 0;
  eventIdCounter = 0;
}
```

## MSW Mock Handlers

```typescript
// tests/mocks/handlers.ts
import { http, HttpResponse } from 'msw';
import { makeApplication, makeNote, makeApplicationEvent } from '../factories';

export const handlers = [
  // Applications
  http.get('/api/applications', () =>
    HttpResponse.json({
      data: [makeApplication(), makeApplication({ company: 'Tech Co' })],
      count: 2
    })
  ),

  http.post('/api/applications', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ data: makeApplication(body as any) }, { status: 201 });
  }),

  http.get('/api/applications/:id', ({ params }) =>
    HttpResponse.json({ data: makeApplication({ id: params.id as string }) })
  ),

  http.patch('/api/applications/:id', async ({ params, request }) => {
    const body = await request.json();
    return HttpResponse.json({
      data: makeApplication({ id: params.id as string, ...body as any })
    });
  }),

  http.delete('/api/applications/:id', () =>
    HttpResponse.json({ message: 'Application deleted' })
  ),

  // Notes
  http.get('/api/applications/:id/notes', () =>
    HttpResponse.json({ data: [makeNote(), makeNote()] })
  ),

  http.post('/api/applications/:id/notes', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      { data: makeNote({ ...body as any }) },
      { status: 201 }
    );
  }),

  http.delete('/api/applications/:id/notes/:noteId', () =>
    HttpResponse.json({ message: 'Note deleted' })
  ),

  // Events
  http.get('/api/applications/:id/events', () =>
    HttpResponse.json({ data: [makeApplicationEvent()] })
  ),

  // Analytics
  http.get('/api/analytics', () =>
    HttpResponse.json({
      stats: { total: 10, active: 7, offers: 1, responseRate: 40 },
      pipeline: [
        { stage: 'applied', count: 5 },
        { stage: 'phone_screen', count: 2 },
        { stage: 'interview', count: 1 },
        { stage: 'offer', count: 1 },
        { stage: 'rejected', count: 1 }
      ],
      funnel: [
        { stage: 'applied', count: 5, percentage: 100 },
        { stage: 'phone_screen', count: 2, percentage: 40 },
        { stage: 'interview', count: 1, percentage: 20 },
        { stage: 'offer', count: 1, percentage: 20 },
        { stage: 'rejected', count: 1, percentage: 20 }
      ],
      activity: []
    })
  ),

  // Search
  http.get('/api/applications/search', async ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');
    const apps = [makeApplication(), makeApplication({ company: 'Tech Co' })];
    const filtered = query
      ? apps.filter(
          (a) =>
            a.company.toLowerCase().includes(query.toLowerCase()) ||
            a.role.toLowerCase().includes(query.toLowerCase())
        )
      : apps;

    return HttpResponse.json({ data: filtered, count: filtered.length });
  }),

  // Auth
  http.post('/api/auth/signup', async ({ request }) => {
    const body = await request.json() as any;
    if (!body.email || !body.password) {
      return HttpResponse.json({ error: 'Missing fields' }, { status: 422 });
    }
    return HttpResponse.json({ message: 'Check your email', user: { id: 'new-user', email: body.email } }, { status: 201 });
  }),

  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as any;
    if (body.email === 'invalid@example.com') {
      return HttpResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    return HttpResponse.json({ user: { id: 'user-1', email: body.email } });
  }),

  http.post('/api/auth/logout', () =>
    HttpResponse.json({ message: 'Logged out' })
  )
];
```

## MSW Server Setup

```typescript
// tests/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

## vitest.setup.ts (Expanded)

```typescript
import '@testing-library/jest-dom';
import { server } from './tests/mocks/server';
import { resetCounters } from './tests/factories';

// Start MSW server
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers and factories between tests
afterEach(() => {
  server.resetHandlers();
  resetCounters();
});

// Clean up
afterAll(() => server.close());
```

## Core Test Files

### Test API Routes

```typescript
// tests/api/applications.test.ts
import { describe, it, expect } from 'vitest';

describe('POST /api/applications', () => {
  it('returns 201 with valid data', async () => {
    const response = await fetch('/api/applications', {
      method: 'POST',
      body: JSON.stringify({
        company: 'New Co',
        role: 'Engineer',
        stage: 'applied',
        priority: 'high',
        appliedDate: '2025-01-20'
      })
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.data.company).toBe('New Co');
  });

  it('returns 422 when required field missing', async () => {
    const response = await fetch('/api/applications', {
      method: 'POST',
      body: JSON.stringify({ role: 'Engineer' })
    });

    expect(response.status).toBe(422);
  });
});

describe('GET /api/applications/:id', () => {
  it('returns application by id', async () => {
    const response = await fetch('/api/applications/app-1');

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data.id).toBe('app-1');
  });
});

describe('DELETE /api/applications/:id', () => {
  it('soft deletes application', async () => {
    const response = await fetch('/api/applications/app-1', { method: 'DELETE' });

    expect(response.status).toBe(200);
  });
});
```

### Test Components

```typescript
// tests/components/application-form.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@/tests/utils/render';
import { ApplicationForm } from '@/components/applications/application-form';

describe('ApplicationForm', () => {
  it('renders all form fields', () => {
    render(<ApplicationForm onSubmit={async () => {}} />);

    expect(screen.getByLabelText(/company/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/stage/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
  });

  it('shows error on submit with missing required field', async () => {
    render(<ApplicationForm onSubmit={async () => {}} />);

    const submitButton = screen.getByText(/save/i);
    fireEvent.click(submitButton);

    expect(screen.getByText(/company is required/i)).toBeInTheDocument();
  });

  it('pre-fills fields in edit mode', () => {
    const app = { company: 'Test Co', role: 'Engineer', stage: 'interview' as const };
    render(<ApplicationForm application={app as any} onSubmit={async () => {}} />);

    expect(screen.getByDisplayValue('Test Co')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Engineer')).toBeInTheDocument();
  });
});
```

```typescript
// tests/components/kanban-board.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/tests/utils/render';
import { KanbanBoard } from '@/components/board/kanban-board';

describe('KanbanBoard', () => {
  it('renders all 5 columns', () => {
    render(<KanbanBoard />);

    expect(screen.getByText('Applied')).toBeInTheDocument();
    expect(screen.getByText('Phone Screen')).toBeInTheDocument();
    expect(screen.getByText('Interview')).toBeInTheDocument();
    expect(screen.getByText('Offer')).toBeInTheDocument();
    expect(screen.getByText('Rejected')).toBeInTheDocument();
  });

  it('shows loading skeleton while fetching', () => {
    render(<KanbanBoard />);
    // Skeleton elements should appear briefly during loading
    expect(screen.queryByText(/loading|skeleton/i)).toBeDefined();
  });
});
```

## Coverage Targets

- **Lines:** 70% minimum
- **Branches:** 65% minimum
- **Statements:** 70% minimum

## Excluded from Coverage

- `node_modules/`
- `.next/`
- `vitest.config.ts`
- `vitest.setup.ts`
- `tests/` folder itself
- `**/*.d.ts`
- `app/layout.tsx` (minimal)
- `app/page.tsx` (redirect only)

## Running Tests

```bash
npm test                  # Run all tests once
npm run test:watch       # Watch mode
npm run test:coverage    # Generate coverage report
```

## Acceptance Tests
- ✅ `npm run test:coverage` passes 70/65 thresholds
- ✅ All API route tests pass
- ✅ All component tests pass
- ✅ MSW intercepts all API calls
- ✅ Accessibility tests pass on key components

## Definition of Done
- [ ] All test files created
- [ ] Coverage reports generated
- [ ] 70% lines / 65% branches threshold met
- [ ] CI workflow includes coverage check
- [ ] All component tests use renderWithProviders
- [ ] All API mocks in MSW handlers
- [ ] No console errors in tests
- [ ] TypeScript: zero errors
