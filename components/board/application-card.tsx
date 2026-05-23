'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { JobApplication } from '@prisma/client';

interface ApplicationCardProps {
  application: JobApplication;
  onSelect?: (app: JobApplication) => void;
}

const priorityConfig = {
  HIGH:   { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: 'High' },
  MEDIUM: { color: '#d97706', bg: '#fffbeb', border: '#fde68a', label: 'Medium' },
  LOW:    { color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', label: 'Low' },
} as const;

const priorityDotColors = {
  HIGH:   '#dc2626',
  MEDIUM: '#d97706',
  LOW:    '#059669',
} as const;

export function ApplicationCard({ application, onSelect }: ApplicationCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: application.id
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    rotate: isDragging ? '1deg' : '0deg',
    boxShadow: isDragging ? 'var(--shadow-md)' : 'none',
    zIndex: isDragging ? 50 : 'auto',
    position: 'relative' as const,
  };

  const priority = application.priority as keyof typeof priorityConfig;
  const pc = priorityConfig[priority] || priorityConfig.MEDIUM;
  const dotColor = priorityDotColors[priority] || priorityDotColors.MEDIUM;

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        padding: '14px',
        cursor: 'grab',
        userSelect: 'none',
        transition: isDragging
          ? style.transition
          : 'border-color 0.15s, box-shadow 0.15s',
      }}
      {...attributes}
      {...listeners}
      onClick={() => onSelect?.(application)}
      onMouseEnter={(e) => {
        if (!isDragging) {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-strong)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-sm)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging) {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-default)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
        }
      }}
    >
      {/* Top row: company + priority dot */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
        <span
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            lineHeight: 1.3,
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {application.company}
        </span>
        {/* Priority dot */}
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: dotColor,
            flexShrink: 0,
            marginTop: '3px',
          }}
          title={`${priority} priority`}
        />
      </div>

      {/* Role */}
      <p
        style={{
          fontSize: '13px',
          color: 'var(--text-secondary)',
          marginBottom: '10px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {application.role}
      </p>

      {/* Bottom row: date + priority pill */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: '11px',
            color: 'var(--text-tertiary)',
          }}
        >
          {new Date(application.appliedDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>

        {/* Priority pill */}
        <span
          style={{
            fontSize: '11px',
            fontWeight: 500,
            color: pc.color,
            background: pc.bg,
            border: `1px solid ${pc.border}`,
            borderRadius: 'var(--radius-full)',
            padding: '1px 7px',
          }}
        >
          {pc.label}
        </span>
      </div>
    </div>
  );
}
