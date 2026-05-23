'use client';

import React from 'react';

interface StatsCardProps {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  trend?: string;
}

const colorConfig = {
  blue:   { dot: '#6366f1', bg: '#eef2ff' },
  green:  { dot: '#10b981', bg: '#ecfdf5' },
  red:    { dot: '#f43f5e', bg: '#fff1f2' },
  yellow: { dot: '#f59e0b', bg: '#fffbeb' },
  purple: { dot: '#8b5cf6', bg: '#f5f3ff' },
};

export function StatsCard({ label, value, icon, color = 'blue', trend }: StatsCardProps) {
  const cc = colorConfig[color];

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-strong)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-sm)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-default)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
        {/* Icon badge */}
        {icon && (
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-md)',
              background: cc.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
        )}

        {/* Color dot indicator */}
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: cc.dot,
            flexShrink: 0,
            marginTop: '4px',
          }}
        />
      </div>

      {/* Value */}
      <p
        style={{
          fontSize: '28px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          lineHeight: 1,
          letterSpacing: '-0.5px',
          marginBottom: '6px',
        }}
      >
        {value}
      </p>

      {/* Label */}
      <p
        style={{
          fontSize: '13px',
          fontWeight: 500,
          color: 'var(--text-secondary)',
        }}
      >
        {label}
      </p>

      {/* Optional trend */}
      {trend && (
        <p
          style={{
            fontSize: '11px',
            color: 'var(--text-tertiary)',
            marginTop: '4px',
          }}
        >
          {trend}
        </p>
      )}
    </div>
  );
}
