'use client';

import { useCallback, useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

const STAGES = ['APPLIED', 'PHONE_SCREEN', 'INTERVIEW', 'OFFER', 'REJECTED'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];

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

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      <div>
        <input
          type="text"
          placeholder="Search by company or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Stages</label>
          <div className="flex flex-wrap gap-2">
            {STAGES.map((stage) => (
              <button
                key={stage}
                onClick={() => toggleStage(stage)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                  stages.includes(stage)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {stage.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Priorities</label>
          <div className="flex flex-wrap gap-2">
            {PRIORITIES.map((priority) => (
              <button
                key={priority}
                onClick={() => togglePriority(priority)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                  priorities.includes(priority)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {priority}
              </button>
            ))}
          </div>
        </div>
      </div>

      {(search || stages.length > 0 || priorities.length > 0) && (
        <button
          onClick={clearFilters}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );
}

export function FilterBar(props: FilterBarProps) {
  return (
    <Suspense fallback={<div className="bg-white rounded-lg shadow p-4 h-20" />}>
      <FilterBarContent {...props} />
    </Suspense>
  );
}
