'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { JobApplication } from '@prisma/client';
import { ApplicationCard } from './application-card';

interface BoardColumnProps {
  stage: string;
  label: string;
  applications: JobApplication[];
  onSelectCard?: (app: JobApplication) => void;
}

const stageMeta: Record<string, { dot: string; label: string }> = {
  APPLIED:      { dot: '#6366f1', label: 'APPLIED' },
  PHONE_SCREEN: { dot: '#8b5cf6', label: 'PHONE SCREEN' },
  INTERVIEW:    { dot: '#f59e0b', label: 'INTERVIEW' },
  OFFER:        { dot: '#10b981', label: 'OFFER' },
  REJECTED:     { dot: '#f43f5e', label: 'REJECTED' },
};

export function BoardColumn({ stage, label, applications, onSelectCard }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const meta = stageMeta[stage] || stageMeta.APPLIED;

  return (
    <div
      style={{
        background: isOver ? '#f8f8f8' : 'var(--bg-subtle)',
        border: `1px solid ${isOver ? 'var(--border-strong)' : 'var(--border-default)'}`,
        borderRadius: 'var(--radius-lg)',
        minHeight: '520px',
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      {/* Column Header */}
      <div
        style={{
          padding: '16px 16px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Stage dot */}
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: meta.dot,
              flexShrink: 0,
            }}
          />
          {/* Stage label */}
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}
          >
            {meta.label}
          </span>
        </div>
        {/* Count badge */}
        <span
          style={{
            background: 'var(--bg-muted)',
            color: 'var(--text-secondary)',
            borderRadius: 'var(--radius-full)',
            fontSize: '11px',
            padding: '1px 7px',
            fontWeight: 600,
            minWidth: '20px',
            textAlign: 'center',
          }}
        >
          {applications.length}
        </span>
      </div>

      {/* Card Drop Zone */}
      <div
        ref={setNodeRef}
        style={{
          flex: 1,
          padding: '0 12px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          overflowY: 'auto',
        }}
      >
        <SortableContext items={applications.map((a) => a.id)} strategy={verticalListSortingStrategy}>
          {applications.map((app) => (
            <ApplicationCard
              key={app.id}
              application={app}
              onSelect={onSelectCard}
            />
          ))}
        </SortableContext>

        {applications.length === 0 && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '80px',
            }}
          >
            <p
              style={{
                fontSize: '12px',
                color: 'var(--text-disabled)',
                textAlign: 'center',
              }}
            >
              No applications
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
