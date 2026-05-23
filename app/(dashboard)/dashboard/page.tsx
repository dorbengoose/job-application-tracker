'use client';

import { useEffect } from 'react';
import { StatsCard } from '@/components/dashboard/stats-card';
import { StageBreakdownChart } from '@/components/dashboard/stage-breakdown-chart';
import { PriorityBreakdownChart } from '@/components/dashboard/priority-breakdown-chart';
import { useApplications } from '@/lib/context/applications-context';

export default function DashboardPage() {
  const { applications, loading, fetchApplications } = useApplications();

  useEffect(() => {
    fetchApplications();
  }, []);

  const activeApps = applications.filter((app) => !app.deletedAt);
  const appliedCount      = activeApps.filter((app) => app.stage === 'APPLIED').length;
  const phoneScreenCount  = activeApps.filter((app) => app.stage === 'PHONE_SCREEN').length;
  const interviewCount    = activeApps.filter((app) => app.stage === 'INTERVIEW').length;
  const offerCount        = activeApps.filter((app) => app.stage === 'OFFER').length;
  const rejectedCount     = activeApps.filter((app) => app.stage === 'REJECTED').length;

  const successRate = activeApps.length > 0
    ? Math.round((offerCount / activeApps.length) * 100)
    : 0;

  const highPriorityCount = activeApps.filter((app) => app.priority === 'HIGH').length;

  if (loading && applications.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header skeleton */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div className="skeleton" style={{ width: '140px', height: '28px' }} />
          <div className="skeleton" style={{ width: '200px', height: '16px' }} />
        </div>
        {/* Stats skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: '116px', borderRadius: 'var(--radius-lg)' }}
            />
          ))}
        </div>
        {/* Charts skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: '240px', borderRadius: 'var(--radius-lg)' }}
            />
          ))}
        </div>
      </div>
    );
  }

  const funnelSteps = [
    { label: 'Applied',      count: appliedCount,     color: '#6366f1', total: appliedCount },
    { label: 'Phone Screen', count: phoneScreenCount,  color: '#8b5cf6', total: appliedCount },
    { label: 'Interview',    count: interviewCount,    color: '#f59e0b', total: appliedCount },
    { label: 'Offer',        count: offerCount,        color: '#10b981', total: appliedCount },
    { label: 'Rejected',     count: rejectedCount,     color: '#f43f5e', total: appliedCount },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page header */}
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
          Analytics
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
          Overview of your job search progress
        </p>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <StatsCard
          label="Total Applications"
          value={activeApps.length}
          icon="📝"
          color="blue"
        />
        <StatsCard
          label="Offers Received"
          value={offerCount}
          icon="🎉"
          color="green"
        />
        <StatsCard
          label="In Progress"
          value={phoneScreenCount + interviewCount}
          icon="⏳"
          color="yellow"
        />
        <StatsCard
          label="Success Rate"
          value={`${successRate}%`}
          icon="📊"
          color="purple"
        />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        <StageBreakdownChart applications={applications} />
        <PriorityBreakdownChart applications={applications} />
      </div>

      {/* Application Funnel */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
        }}
      >
        <div style={{ marginBottom: '20px' }}>
          <h3
            style={{
              fontSize: '15px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              margin: 0,
              letterSpacing: '-0.2px',
            }}
          >
            Application Funnel
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '3px' }}>
            Conversion through each stage
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {funnelSteps.map((step) => {
            const pct = step.total > 0 ? (step.count / step.total) * 100 : 0;
            return (
              <div key={step.label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Label */}
                <span
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    width: '100px',
                    flexShrink: 0,
                  }}
                >
                  {step.label}
                </span>

                {/* Progress bar */}
                <div
                  style={{
                    flex: 1,
                    height: '6px',
                    background: 'var(--bg-muted)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${Math.max(pct, step.count > 0 ? 3 : 0)}%`,
                      height: '100%',
                      background: step.color,
                      borderRadius: '3px',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>

                {/* Count */}
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    width: '32px',
                    textAlign: 'right',
                    flexShrink: 0,
                  }}
                >
                  {step.count}
                </span>
              </div>
            );
          })}
        </div>

        {/* Summary row */}
        {activeApps.length > 0 && (
          <div
            style={{
              marginTop: '20px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-default)',
              display: 'flex',
              gap: '24px',
            }}
          >
            <div>
              <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 }}>
                High Priority
              </p>
              <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                {highPriorityCount}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 }}>
                Rejected
              </p>
              <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                {rejectedCount}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 }}>
                Active
              </p>
              <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                {phoneScreenCount + interviewCount}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
