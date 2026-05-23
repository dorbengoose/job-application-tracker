# Spec 08 — Search & Filtering

## Preconditions
- spec-04 (Kanban board), spec-05 (CRUD API) complete

## Goal
Add full-text search and multi-dimension filtering to the board view. Sync filter state
to URL query params for shareable, refresh-safe filters.

## Critical Files to Create

- `app/api/applications/search/route.ts`
- `components/search/search-bar.tsx`
- `components/search/filter-panel.tsx`
- `components/search/active-filters-bar.tsx`
- `lib/hooks/use-debounce.ts`
- `lib/hooks/use-filter-state.ts`

## FilterState Interface

```typescript
// lib/types/filters.ts
import type { Stage, Priority } from '@/types';

export interface FilterState {
  query: string;
  stages: Stage[];
  priorities: Priority[];
  dateFrom?: string;
  dateTo?: string;
}

export const DEFAULT_FILTER_STATE: FilterState = {
  query: '',
  stages: [],
  priorities: []
};
```

## Search API Endpoint

### GET /api/applications/search

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const query = url.searchParams.get('q') || '';
  const stagesParam = url.searchParams.get('stages');
  const prioritiesParam = url.searchParams.get('priorities');
  const dateFrom = url.searchParams.get('from');
  const dateTo = url.searchParams.get('to');

  let q = supabase
    .from('job_applications')
    .select('*')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  // Full-text search
  if (query) {
    q = q.or(
      `company.ilike.%${query}%,role.ilike.%${query}%`
    );
  }

  // Stage filter
  if (stagesParam) {
    const stages = stagesParam.split(',');
    q = q.in('stage', stages);
  }

  // Priority filter
  if (prioritiesParam) {
    const priorities = prioritiesParam.split(',');
    q = q.in('priority', priorities);
  }

  // Date range filter
  if (dateFrom) {
    q = q.gte('applied_date', dateFrom);
  }
  if (dateTo) {
    q = q.lte('applied_date', dateTo);
  }

  const { data, error, count } = await q;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data || [], count: count || 0 });
}
```

## Hooks

### useDebounce

```typescript
// lib/hooks/use-debounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

### useFilterState

```typescript
// lib/hooks/use-filter-state.ts
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { FilterState } from '@/lib/types/filters';
import { DEFAULT_FILTER_STATE } from '@/lib/types/filters';

export function useFilterState() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTER_STATE);

  // Parse filters from URL on mount
  useEffect(() => {
    const newFilters: FilterState = {
      query: searchParams.get('q') || '',
      stages: searchParams.get('stages')?.split(',').filter(Boolean) as any || [],
      priorities: searchParams.get('priorities')?.split(',').filter(Boolean) as any || [],
      dateFrom: searchParams.get('from') || undefined,
      dateTo: searchParams.get('to') || undefined
    };
    setFilters(newFilters);
  }, []);

  // Sync filters to URL
  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);

    const params = new URLSearchParams();
    if (updated.query) params.set('q', updated.query);
    if (updated.stages.length > 0) params.set('stages', updated.stages.join(','));
    if (updated.priorities.length > 0) params.set('priorities', updated.priorities.join(','));
    if (updated.dateFrom) params.set('from', updated.dateFrom);
    if (updated.dateTo) params.set('to', updated.dateTo);

    const queryString = params.toString();
    router.push(queryString ? `/board?${queryString}` : '/board');
  };

  const clearAllFilters = () => {
    setFilters(DEFAULT_FILTER_STATE);
    router.push('/board');
  };

  return { filters, updateFilters, clearAllFilters };
}
```

## Search Components

### SearchBar

```typescript
'use client';

import { useState } from 'react';
import { useDebounce } from '@/lib/hooks/use-debounce';
import type { FilterState } from '@/lib/types/filters';

interface SearchBarProps {
  filters: FilterState;
  onSearch: (query: string) => void;
}

export function SearchBar({ filters, onSearch }: SearchBarProps) {
  const [localQuery, setLocalQuery] = useState(filters.query);
  const debouncedQuery = useDebounce(localQuery, 300);

  useState(() => {
    onSearch(debouncedQuery);
  }, [debouncedQuery, onSearch]);

  return (
    <div className="flex gap-2 mb-6">
      <input
        type="text"
        placeholder="Search applications..."
        value={localQuery}
        onChange={(e) => setLocalQuery(e.target.value)}
        className="flex-1 px-4 py-2 border rounded-md"
      />
      <button
        onClick={() => setLocalQuery('')}
        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
      >
        Clear
      </button>
    </div>
  );
}
```

### FilterPanel

```typescript
'use client';

import type { FilterState } from '@/lib/types/filters';
import type { Stage, Priority } from '@/types';

const STAGES: Stage[] = ['applied', 'phone_screen', 'interview', 'offer', 'rejected'];
const PRIORITIES: Priority[] = ['low', 'medium', 'high'];

interface FilterPanelProps {
  filters: FilterState;
  onUpdate: (filters: Partial<FilterState>) => void;
}

export function FilterPanel({ filters, onUpdate }: FilterPanelProps) {
  return (
    <div className="bg-white p-4 rounded-lg border mb-6 space-y-4">
      <div>
        <h3 className="text-sm font-semibold mb-2">Stages</h3>
        <div className="space-y-2">
          {STAGES.map((stage) => (
            <label key={stage} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.stages.includes(stage)}
                onChange={(e) => {
                  const newStages = e.target.checked
                    ? [...filters.stages, stage]
                    : filters.stages.filter((s) => s !== stage);
                  onUpdate({ stages: newStages });
                }}
                className="rounded"
              />
              <span className="text-sm capitalize">{stage.replace('_', ' ')}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2">Priority</h3>
        <div className="space-y-2">
          {PRIORITIES.map((priority) => (
            <label key={priority} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.priorities.includes(priority)}
                onChange={(e) => {
                  const newPriorities = e.target.checked
                    ? [...filters.priorities, priority]
                    : filters.priorities.filter((p) => p !== priority);
                  onUpdate({ priorities: newPriorities });
                }}
                className="rounded"
              />
              <span className="text-sm capitalize">{priority}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2">Date Range</h3>
        <div className="space-y-2">
          <input
            type="date"
            value={filters.dateFrom || ''}
            onChange={(e) => onUpdate({ dateFrom: e.target.value || undefined })}
            className="w-full px-2 py-1 border rounded text-sm"
            placeholder="From"
          />
          <input
            type="date"
            value={filters.dateTo || ''}
            onChange={(e) => onUpdate({ dateTo: e.target.value || undefined })}
            className="w-full px-2 py-1 border rounded text-sm"
            placeholder="To"
          />
        </div>
      </div>
    </div>
  );
}
```

### ActiveFiltersBar

```typescript
'use client';

import type { FilterState } from '@/lib/types/filters';

interface ActiveFiltersBarProps {
  filters: FilterState;
  onRemoveFilter: (key: string, value?: string) => void;
  onClearAll: () => void;
}

export function ActiveFiltersBar({ filters, onRemoveFilter, onClearAll }: ActiveFiltersBarProps) {
  const hasActiveFilters =
    filters.query ||
    filters.stages.length > 0 ||
    filters.priorities.length > 0 ||
    filters.dateFrom ||
    filters.dateTo;

  if (!hasActiveFilters) {
    return null;
  }

  return (
    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-blue-900">Active Filters</p>
        <button
          onClick={onClearAll}
          className="text-xs text-blue-600 hover:text-blue-700 underline"
        >
          Clear All
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.query && (
          <FilterChip label={`Search: "${filters.query}"`} onRemove={() => onRemoveFilter('query')} />
        )}
        {filters.stages.map((stage) => (
          <FilterChip
            key={stage}
            label={`Stage: ${stage}`}
            onRemove={() => onRemoveFilter('stages', stage)}
          />
        ))}
        {filters.priorities.map((priority) => (
          <FilterChip
            key={priority}
            label={`Priority: ${priority}`}
            onRemove={() => onRemoveFilter('priorities', priority)}
          />
        ))}
        {filters.dateFrom && <FilterChip label={`From: ${filters.dateFrom}`} onRemove={() => onRemoveFilter('dateFrom')} />}
        {filters.dateTo && <FilterChip label={`To: ${filters.dateTo}`} onRemove={() => onRemoveFilter('dateTo')} />}
      </div>
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-blue-200 rounded-full text-sm">
      <span>{label}</span>
      <button onClick={onRemove} className="text-blue-600 hover:text-blue-700 font-bold">
        ×
      </button>
    </div>
  );
}
```

## Board Integration

Update `app/(dashboard)/board/page.tsx` to use search and filters:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { KanbanBoard } from '@/components/board/kanban-board';
import { SearchBar } from '@/components/search/search-bar';
import { FilterPanel } from '@/components/search/filter-panel';
import { ActiveFiltersBar } from '@/components/search/active-filters-bar';
import { ApplicationsProvider, useApplications } from '@/lib/context/applications-context';
import { useFilterState } from '@/lib/hooks/use-filter-state';
import type { JobApplication } from '@/types';

function BoardWithFilters() {
  const { filters, updateFilters, clearAllFilters } = useFilterState();
  const { updateApplications } = useApplications();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadFiltered() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filters.query) params.set('q', filters.query);
        if (filters.stages.length > 0) params.set('stages', filters.stages.join(','));
        if (filters.priorities.length > 0) params.set('priorities', filters.priorities.join(','));
        if (filters.dateFrom) params.set('from', filters.dateFrom);
        if (filters.dateTo) params.set('to', filters.dateTo);

        const res = await fetch(`/api/applications/search?${params}`);
        if (res.ok) {
          const { data } = await res.json();
          updateApplications(data);
        }
      } finally {
        setLoading(false);
      }
    }

    loadFiltered();
  }, [filters, updateApplications]);

  const handleRemoveFilter = (key: string, value?: string) => {
    if (value) {
      const arrayKey = key as 'stages' | 'priorities';
      updateFilters({
        [arrayKey]: filters[arrayKey].filter((v) => v !== value)
      });
    } else {
      updateFilters({ [key as any]: undefined });
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Job Applications</h1>
      <SearchBar filters={filters} onSearch={(q) => updateFilters({ query: q })} />
      <FilterPanel filters={filters} onUpdate={updateFilters} />
      <ActiveFiltersBar
        filters={filters}
        onRemoveFilter={handleRemoveFilter}
        onClearAll={clearAllFilters}
      />
      <KanbanBoard />
    </div>
  );
}

export default function BoardPage() {
  return (
    <ApplicationsProvider>
      <BoardWithFilters />
    </ApplicationsProvider>
  );
}
```

## Acceptance Tests
- ✅ Debounce hook fires max once per 300ms
- ✅ URL updates when filters applied
- ✅ URL filter state restored after page refresh
- ✅ Clear all resets all filters
- ✅ Active filters bar hidden when no filters
- ✅ Search for "Google" returns matching apps
- ✅ Multi-stage filter works

## Definition of Done
- [ ] Search API endpoint functional
- [ ] Full-text search works for company and role
- [ ] Stage multi-select filter works
- [ ] Priority filter works
- [ ] Date range filter works
- [ ] URL query params updated on filter change
- [ ] Page refresh preserves filter state
- [ ] Debounce working correctly (300ms)
- [ ] Active filters bar shows/hides correctly
- [ ] TypeScript: zero errors
