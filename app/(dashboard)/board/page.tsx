'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { ApplicationForm } from '@/components/applications/application-form';
import { KanbanBoard } from '@/components/board/kanban-board';
import { FilterBar } from '@/components/board/filter-bar';
import { ApplicationDetailPanel } from '@/components/detail/application-detail-panel';
import { useApplications } from '@/lib/context/applications-context';
import { useToast } from '@/lib/context/toast-context';
import { createApplication } from '@/lib/api/applications';
import type { JobApplication } from '@prisma/client';

// Skeleton loader — 5-column grid
function BoardSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
      {Array.from({ length: 5 }).map((_, colIdx) => (
        <div
          key={colIdx}
          style={{
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            minHeight: '520px',
            padding: '16px',
          }}
        >
          {/* Column header skeleton */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div className="skeleton" style={{ width: '8px', height: '8px', borderRadius: '50%' }} />
            <div className="skeleton" style={{ width: '80px', height: '12px' }} />
            <div style={{ flex: 1 }} />
            <div className="skeleton" style={{ width: '24px', height: '18px', borderRadius: '9999px' }} />
          </div>
          {/* Card skeletons */}
          {Array.from({ length: colIdx === 0 ? 3 : colIdx === 1 ? 2 : 1 }).map((_, i) => (
            <div
              key={i}
              className="skeleton"
              style={{
                height: '80px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '8px',
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// Empty state component
function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 24px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        textAlign: 'center',
      }}
    >
      {/* SVG Icon */}
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="7" height="18" rx="1.5" fill="var(--text-tertiary)" opacity="0.5"/>
          <rect x="14" y="3" width="7" height="10" rx="1.5" fill="var(--text-tertiary)" opacity="0.5"/>
          <rect x="14" y="16" width="7" height="5" rx="1.5" fill="var(--text-tertiary)" opacity="0.5"/>
        </svg>
      </div>
      <h3
        style={{
          fontSize: '15px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: '6px',
        }}
      >
        No applications yet
      </h3>
      <p
        style={{
          fontSize: '13px',
          color: 'var(--text-tertiary)',
          marginBottom: '20px',
          maxWidth: '280px',
          lineHeight: 1.6,
        }}
      >
        Start tracking your job search. Add your first application to get started.
      </p>
      <button
        onClick={onCreateClick}
        style={{
          height: '36px',
          padding: '0 16px',
          background: 'var(--accent)',
          color: '#fff',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          fontSize: '13px',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-hover)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent)'; }}
      >
        Add first application
      </button>
    </div>
  );
}

// No-results state
function NoResultsState() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 24px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '12px',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M10 6.5a3.5 3.5 0 11-7 0 3.5 3.5 0 017 0zm-.889 3.182l2.957 2.957"
            stroke="var(--text-tertiary)"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
        No results found
      </h3>
      <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
        No applications match your current filters.
      </p>
    </div>
  );
}

export default function BoardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    stages: [] as string[],
    priorities: [] as string[]
  });
  const { applications, loading, error, fetchApplications } = useApplications();
  const { addToast } = useToast();

  useEffect(() => {
    fetchApplications();
  }, []);

  async function handleSubmit(formData: any) {
    try {
      await createApplication(formData);
      setIsModalOpen(false);
      addToast('Application created successfully', 'success');
      await fetchApplications();
    } catch (err: any) {
      addToast(err.message || 'Failed to create application', 'error');
      throw err;
    }
  }

  const filteredApplications = applications.filter((app) => {
    if (!app || app.deletedAt) return false;

    const searchLower = filters.search.toLowerCase();
    if (searchLower && !app.company.toLowerCase().includes(searchLower) && !app.role.toLowerCase().includes(searchLower)) {
      return false;
    }

    if (filters.stages.length > 0 && !filters.stages.includes(app.stage)) {
      return false;
    }

    if (filters.priorities.length > 0 && !filters.priorities.includes(app.priority)) {
      return false;
    }

    return true;
  });

  if (loading && applications.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header skeleton */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="skeleton" style={{ width: '180px', height: '28px' }} />
          <div className="skeleton" style={{ width: '140px', height: '36px', borderRadius: 'var(--radius-md)' }} />
        </div>
        {/* Filter bar skeleton */}
        <div
          className="skeleton"
          style={{
            height: '68px',
            borderRadius: 'var(--radius-lg)',
          }}
        />
        {/* Board skeleton */}
        <BoardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '200px',
          background: 'var(--bg-surface)',
          border: '1px solid #fecaca',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <p style={{ color: '#dc2626', fontSize: '14px' }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.4px',
              margin: 0,
            }}
          >
            Job Applications
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
            {applications.filter((a) => !a.deletedAt).length} total application{applications.filter((a) => !a.deletedAt).length !== 1 ? 's' : ''}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            height: '36px',
            padding: '0 16px',
            background: 'var(--accent)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-hover)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent)'; }}
        >
          <svg width="13" height="13" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7.5 1v13M1 7.5h13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          New Application
        </button>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New Application"
      >
        <ApplicationForm
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      {/* Detail panel */}
      {selectedApp && (
        <ApplicationDetailPanel
          application={selectedApp}
          isOpen={!!selectedApp}
          onClose={() => setSelectedApp(null)}
          onDelete={() => setSelectedApp(null)}
        />
      )}

      {/* Filter bar */}
      <FilterBar onFilterChange={setFilters} />

      {/* Board or empty states */}
      {applications.length === 0 ? (
        <EmptyState onCreateClick={() => setIsModalOpen(true)} />
      ) : filteredApplications.length === 0 ? (
        <NoResultsState />
      ) : (
        <KanbanBoard onSelectCard={setSelectedApp} applications={filteredApplications} />
      )}
    </div>
  );
}
