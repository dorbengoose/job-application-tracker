'use client';

import { useCallback, useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

const STAGES = ['APPLIED', 'PHONE_SCREEN', 'INTERVIEW', 'OFFER', 'REJECTED'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];

const STAGE_LABELS: Record<string, string> = {
  APPLIED:      'Applied',
  PHONE_SCREEN: 'Phone',
  INTERVIEW:    'Interview',
  OFFER:        'Offer',
  REJECTED:     'Rejected',
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW:    'Low',
  MEDIUM: 'Medium',
  HIGH:   'High',
};

interface FilterBarProps {
  onFilterChange: (filters: {
    search: string;
    stages: string[];
    priorities: string[];
  }) => void;
}

function FilterBarContent({ onFilterChange }: FilterBarProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [stages, setStages] = useState<string[]>(
    searchParams.get('stages')?.split(',').filter(Boolean) || []
  );
  const [priorities, setPriorities] = useState<string[]>(
    searchParams.get('priorities')?.split(',').filter(Boolean) || []
  );

  useEffect(() => {
    onFilterChange({ search, stages, priorities });

    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (stages.length > 0) params.set('stages', stages.join(','));
    if (priorities.length > 0) params.set('priorities', priorities.join(','));

    const queryString = params.toString();
    const newPath = queryString ? `/board?${queryString}` : '/board';
    router.push(newPath);
  }, [search, stages, priorities, onFilterChange, router]);

  const toggleStage = useCallback((stage: string) => {
    setStages((prev) =>
      prev.includes(stage)
        ? prev.filter((s) => s !== stage)
        : [...prev, stage]
    );
  }, []);

  const togglePriority = useCallback((priority: string) => {
    setPriorities((prev) =>
      prev.includes(priority)
        ? prev.filter((p) => p !== priority)
        : [...prev, priority]
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSearch('');
    setStages([]);
    setPriorities([]);
  }, []);

  const hasFilters = search || stages.length > 0 || priorities.length > 0;

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        {/* Search Input */}
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '180px' }}>
          {/* Magnifying glass icon */}
          <svg
            width="14"
            height="14"
            viewBox="0 0 15 15"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              position: 'absolute',
              left: '11px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-tertiary)',
              pointerEvents: 'none',
            }}
          >
            <path
              d="M10 6.5a3.5 3.5 0 11-7 0 3.5 3.5 0 017 0zm-.889 3.182l2.957 2.957"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="text"
            placeholder="Search by company or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              height: '36px',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              paddingLeft: '34px',
              paddingRight: '12px',
              fontSize: '13px',
              color: 'var(--text-primary)',
              background: 'var(--bg-subtle)',
              outline: 'none',
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-focus)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,112,243,0.12)';
              e.currentTarget.style.background = 'var(--bg-surface)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-default)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.background = 'var(--bg-subtle)';
            }}
          />
        </div>

        {/* Divider */}
        <div style={{ width: '1px', height: '28px', background: 'var(--border-default)', flexShrink: 0 }} />

        {/* Stage Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
              whiteSpace: 'nowrap',
            }}
          >
            Stage
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {STAGES.map((stage) => {
              const isActive = stages.includes(stage);
              return (
                <button
                  key={stage}
                  onClick={() => toggleStage(stage)}
                  style={{
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.1s',
                    border: isActive ? '1px solid var(--accent)' : '1px solid var(--border-default)',
                    background: isActive ? 'var(--accent)' : 'transparent',
                    color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  }}
                >
                  {STAGE_LABELS[stage]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: '1px', height: '28px', background: 'var(--border-default)', flexShrink: 0 }} />

        {/* Priority Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
              whiteSpace: 'nowrap',
            }}
          >
            Priority
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {PRIORITIES.map((priority) => {
              const isActive = priorities.includes(priority);
              return (
                <button
                  key={priority}
                  onClick={() => togglePriority(priority)}
                  style={{
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.1s',
                    border: isActive ? '1px solid var(--accent)' : '1px solid var(--border-default)',
                    background: isActive ? 'var(--accent)' : 'transparent',
                    color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  }}
                >
                  {PRIORITY_LABELS[priority]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Clear all — right-aligned */}
        {hasFilters && (
          <>
            <div style={{ flex: 1 }} />
            <button
              onClick={clearFilters}
              style={{
                fontSize: '12px',
                color: 'var(--text-tertiary)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '3px 6px',
                borderRadius: 'var(--radius-sm)',
                transition: 'color 0.1s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)'; }}
            >
              Clear all
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function FilterBar(props: FilterBarProps) {
  return (
    <Suspense
      fallback={
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
            height: '68px',
          }}
          className="skeleton"
        />
      }
    >
      <FilterBarContent {...props} />
    </Suspense>
  );
}
