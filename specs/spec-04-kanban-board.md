# Spec 04 — Kanban Board UI

## Preconditions
- spec-01, spec-02, spec-03 complete
- spec-05 API layer complete (GET /api/applications endpoint)

## Goal
Build the Kanban board with 5 columns, drag-and-drop stage transitions using @dnd-kit,
optimistic UI updates with rollback, and responsive layout.

## Critical Files to Create

- `app/(dashboard)/board/page.tsx`
- `components/board/kanban-board.tsx`
- `components/board/kanban-column.tsx`
- `components/board/application-card.tsx`
- `components/board/column-header.tsx`
- `components/board/drag-overlay-card.tsx`
- `components/board/skeleton-board.tsx`
- `lib/context/applications-context.tsx`

## Column Configuration

```typescript
// components/board/columns.ts
import type { Stage } from '@/types';

export const COLUMNS: Array<{ stage: Stage; label: string; color: string }> = [
  { stage: 'applied', label: 'Applied', color: 'bg-indigo-50 border-indigo-200' },
  { stage: 'phone_screen', label: 'Phone Screen', color: 'bg-amber-50 border-amber-200' },
  { stage: 'interview', label: 'Interview', color: 'bg-blue-50 border-blue-200' },
  { stage: 'offer', label: 'Offer', color: 'bg-green-50 border-green-200' },
  { stage: 'rejected', label: 'Rejected', color: 'bg-red-50 border-red-200' }
];
```

## ApplicationsContext

```typescript
// lib/context/applications-context.tsx
'use client';

import { createContext, useContext, useReducer, ReactNode } from 'react';
import type { JobApplication } from '@/types';

interface ApplicationsContextType {
  applications: JobApplication[];
  loading: boolean;
  error: string | null;
  fetchApplications: () => Promise<void>;
  updateApplication: (id: string, updates: Partial<JobApplication>) => void;
  addApplication: (app: JobApplication) => void;
  removeApplication: (id: string) => void;
}

const ApplicationsContext = createContext<ApplicationsContextType | undefined>(undefined);

type Action =
  | { type: 'SET_APPLICATIONS'; payload: JobApplication[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_APPLICATION'; payload: JobApplication }
  | { type: 'ADD_APPLICATION'; payload: JobApplication }
  | { type: 'REMOVE_APPLICATION'; payload: string };

function reducer(state: any, action: Action): any {
  switch (action.type) {
    case 'SET_APPLICATIONS':
      return { ...state, applications: action.payload, loading: false, error: null };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'UPDATE_APPLICATION':
      return {
        ...state,
        applications: state.applications.map((app: JobApplication) =>
          app.id === action.payload.id ? action.payload : app
        )
      };
    case 'ADD_APPLICATION':
      return { ...state, applications: [action.payload, ...state.applications] };
    case 'REMOVE_APPLICATION':
      return {
        ...state,
        applications: state.applications.filter((app: JobApplication) => app.id !== action.payload)
      };
    default:
      return state;
  }
}

export function ApplicationsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    applications: [],
    loading: false,
    error: null
  });

  const fetchApplications = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const res = await fetch('/api/applications');
      if (!res.ok) throw new Error('Failed to fetch');
      const { data } = await res.json();
      dispatch({ type: 'SET_APPLICATIONS', payload: data });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load applications' });
    }
  };

  const updateApplication = (id: string, updates: Partial<JobApplication>) => {
    const app = state.applications.find((a: JobApplication) => a.id === id);
    if (app) {
      dispatch({ type: 'UPDATE_APPLICATION', payload: { ...app, ...updates } });
    }
  };

  const addApplication = (app: JobApplication) => {
    dispatch({ type: 'ADD_APPLICATION', payload: app });
  };

  const removeApplication = (id: string) => {
    dispatch({ type: 'REMOVE_APPLICATION', payload: id });
  };

  return (
    <ApplicationsContext.Provider
      value={{ ...state, fetchApplications, updateApplication, addApplication, removeApplication }}
    >
      {children}
    </ApplicationsContext.Provider>
  );
}

export function useApplications() {
  const context = useContext(ApplicationsContext);
  if (!context) {
    throw new Error('useApplications must be used within ApplicationsProvider');
  }
  return context;
}
```

## KanbanBoard Component

```typescript
'use client';

import { DndContext, DragEndEvent, DragCancelEvent } from '@dnd-kit/core';
import { useEffect, useRef } from 'react';
import { useApplications } from '@/lib/context/applications-context';
import { KanbanColumn } from './kanban-column';
import { COLUMNS } from './columns';
import type { JobApplication } from '@/types';

export function KanbanBoard() {
  const { applications, loading, error, fetchApplications, updateApplication } = useApplications();
  const dragStartRef = useRef<JobApplication[] | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const appId = active.id as string;
    const newStage = over.id as string;
    const app = applications.find((a) => a.id === appId);

    if (!app || dragStartRef.current === null) return;

    // Optimistic update
    updateApplication(appId, { ...app, stage: newStage as any });

    try {
      await fetch(`/api/applications/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage })
      });
    } catch {
      // Rollback on error
      updateApplication(appId, app);
    }
  }

  function handleDragStart() {
    dragStartRef.current = [...applications];
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-6 overflow-x-auto p-6 bg-gray-50 min-h-screen">
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.stage}
            column={column}
            applications={applications.filter((a) => a.stage === column.stage && !a.deletedAt)}
            loading={loading}
          />
        ))}
      </div>
    </DndContext>
  );
}
```

## KanbanColumn Component

```typescript
'use client';

import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ApplicationCard } from './application-card';
import { ColumnHeader } from './column-header';
import type { JobApplication } from '@/types';

interface KanbanColumnProps {
  column: { stage: string; label: string; color: string };
  applications: JobApplication[];
  loading: boolean;
}

export function KanbanColumn({ column, applications, loading }: KanbanColumnProps) {
  return (
    <div className="flex-shrink-0 w-80">
      <ColumnHeader label={column.label} count={applications.length} />
      <SortableContext items={applications.map((a) => a.id)} strategy={verticalListSortingStrategy}>
        <div className={`${column.color} rounded-lg border p-4 min-h-96 space-y-3`}>
          {applications.map((app) => (
            <ApplicationCard key={app.id} application={app} />
          ))}
          {applications.length === 0 && !loading && (
            <div className="text-sm text-gray-400 text-center py-8">No applications</div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
```

## ApplicationCard Component

```typescript
'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';
import type { JobApplication } from '@/types';

interface ApplicationCardProps {
  application: JobApplication;
}

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-red-100 text-red-700'
};

export function ApplicationCard({ application }: ApplicationCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({
    id: application.id
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <Link
      href={`/applications/${application.id}`}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="block p-4 bg-white rounded-lg shadow hover:shadow-md transition cursor-grab active:cursor-grabbing border border-gray-200"
    >
      <h3 className="font-semibold text-sm text-gray-900 truncate">{application.company}</h3>
      <p className="text-xs text-gray-600 truncate">{application.role}</p>
      <div className="flex items-center justify-between mt-3 text-xs">
        <span className="text-gray-500">{application.appliedDate}</span>
        <span className={`px-2 py-1 rounded-full ${PRIORITY_COLORS[application.priority]}`}>
          {application.priority}
        </span>
      </div>
    </Link>
  );
}
```

## ColumnHeader Component

```typescript
export function ColumnHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-semibold text-gray-900">{label}</h2>
      <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-gray-600 bg-gray-200 rounded-full">
        {count}
      </span>
    </div>
  );
}
```

## Board Page

```typescript
// app/(dashboard)/board/page.tsx
'use client';

import { KanbanBoard } from '@/components/board/kanban-board';
import { ApplicationsProvider } from '@/lib/context/applications-context';

export default function BoardPage() {
  return (
    <ApplicationsProvider>
      <KanbanBoard />
    </ApplicationsProvider>
  );
}
```

## Acceptance Tests
- ✅ Board renders all 5 columns
- ✅ Each column shows correct card count
- ✅ Dragging card to new column calls PATCH
- ✅ Card rolls back to original column on PATCH error
- ✅ Board responsive on mobile (horizontal scroll)

## Definition of Done
- [ ] Kanban board renders with live data
- [ ] Drag-and-drop persists stage changes to database
- [ ] Optimistic UI with rollback on error
- [ ] Skeleton loader shows while loading
- [ ] Mobile-responsive layout with horizontal scroll
- [ ] TypeScript: zero errors
