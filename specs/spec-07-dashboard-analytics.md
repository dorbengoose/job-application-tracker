# Spec 07 — Dashboard & Analytics

## Preconditions
- spec-05 (CRUD API) complete

## Goal
Build the dashboard home page with live stats, pipeline chart, conversion funnel,
and activity feed powered by an aggregation API endpoint.

## Critical Files to Create

- `app/(dashboard)/dashboard/page.tsx`
- `app/api/analytics/route.ts`
- `components/dashboard/stats-grid.tsx`
- `components/dashboard/stat-card.tsx`
- `components/dashboard/pipeline-chart.tsx`
- `components/dashboard/conversion-funnel.tsx`
- `components/dashboard/activity-feed.tsx`
- `components/dashboard/date-range-filter.tsx`

## Analytics API Endpoint

### GET /api/analytics?range=30d|90d|all

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
  const range = url.searchParams.get('range') || '30d';

  // Build date filter
  let dateFilter = '';
  if (range === '30d') {
    dateFilter = "AND created_at >= NOW() - INTERVAL '30 days'";
  } else if (range === '90d') {
    dateFilter = "AND created_at >= NOW() - INTERVAL '90 days'";
  }

  // Get application stats
  const { data: statsData, error: statsError } = await supabase
    .rpc('get_analytics', {
      p_user_id: user.id,
      p_date_filter: dateFilter
    });

  if (statsError) {
    return NextResponse.json({ error: statsError.message }, { status: 500 });
  }

  // Get stage counts for pipeline
  const { data: stageData, error: stageError } = await supabase
    .from('job_applications')
    .select('stage')
    .eq('user_id', user.id)
    .is('deleted_at', null);

  if (stageError) {
    return NextResponse.json({ error: stageError.message }, { status: 500 });
  }

  // Calculate pipeline data
  const pipeline = [
    { stage: 'applied', count: (stageData || []).filter((a: any) => a.stage === 'applied').length },
    { stage: 'phone_screen', count: (stageData || []).filter((a: any) => a.stage === 'phone_screen').length },
    { stage: 'interview', count: (stageData || []).filter((a: any) => a.stage === 'interview').length },
    { stage: 'offer', count: (stageData || []).filter((a: any) => a.stage === 'offer').length },
    { stage: 'rejected', count: (stageData || []).filter((a: any) => a.stage === 'rejected').length }
  ];

  // Calculate funnel percentages
  const totalApps = pipeline.reduce((sum, p) => sum + p.count, 0);
  const funnel = pipeline.map((p) => ({
    ...p,
    percentage: totalApps > 0 ? Math.round((p.count / totalApps) * 100) : 0
  }));

  // Get activity feed
  const { data: activityData, error: activityError } = await supabase
    .from('application_events')
    .select(`
      id,
      event_type,
      old_value,
      new_value,
      created_at,
      job_applications (company, role)
    `)
    .eq('job_applications.user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  if (activityError) {
    return NextResponse.json({ error: activityError.message }, { status: 500 });
  }

  const stats = statsData?.[0] || {
    total: 0,
    active: 0,
    offers: 0,
    response_rate: 0
  };

  return NextResponse.json({
    stats: {
      total: stats.total || 0,
      active: stats.active || 0,
      offers: stats.offers || 0,
      responseRate: Math.round(stats.response_rate || 0)
    },
    pipeline,
    funnel,
    activity: activityData || []
  });
}
```

## Supabase RLS Function for Analytics

```sql
CREATE OR REPLACE FUNCTION get_analytics(p_user_id UUID, p_date_filter TEXT)
RETURNS TABLE (
  total BIGINT,
  active BIGINT,
  offers BIGINT,
  response_rate NUMERIC
) AS $$
DECLARE
  v_sql TEXT;
  v_total BIGINT;
  v_response BIGINT;
BEGIN
  -- Build dynamic SQL with date filter
  v_sql := 'SELECT COUNT(*) FROM job_applications WHERE user_id = $1 AND deleted_at IS NULL ' || p_date_filter;
  EXECUTE v_sql INTO v_total USING p_user_id;

  v_sql := 'SELECT COUNT(*) FROM job_applications WHERE user_id = $1 AND deleted_at IS NULL AND stage != ''rejected'' ' || p_date_filter;
  EXECUTE v_sql INTO v_response USING p_user_id;

  RETURN QUERY
  SELECT
    v_total,
    (SELECT COUNT(*) FROM job_applications WHERE user_id = p_user_id AND deleted_at IS NULL AND stage NOT IN ('offer', 'rejected')),
    (SELECT COUNT(*) FROM job_applications WHERE user_id = p_user_id AND deleted_at IS NULL AND stage = 'offer'),
    CASE WHEN v_total > 0 THEN ROUND((v_response::NUMERIC / v_total) * 100, 1) ELSE 0 END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Dashboard Components

### StatsGrid

```typescript
'use client';

import { useEffect, useState } from 'react';
import { StatCard } from './stat-card';

interface Stats {
  total: number;
  active: number;
  offers: number;
  responseRate: number;
}

interface StatsGridProps {
  range: '30d' | '90d' | 'all';
}

export function StatsGrid({ range }: StatsGridProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      try {
        const res = await fetch(`/api/analytics?range=${range}`);
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
        }
      } catch (err) {
        console.error('Failed to load stats', err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, [range]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-lg h-20 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <StatCard label="Total Applications" value={stats.total.toString()} />
      <StatCard label="Active Pipeline" value={stats.active.toString()} />
      <StatCard label="Offers Received" value={stats.offers.toString()} />
      <StatCard label="Response Rate" value={`${stats.responseRate}%`} />
    </div>
  );
}
```

### StatCard

```typescript
export function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
      <p className="text-sm font-medium text-gray-600">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
    </div>
  );
}
```

### PipelineChart

```typescript
'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Pipeline {
  stage: string;
  count: number;
}

interface PipelineChartProps {
  range: '30d' | '90d' | 'all';
}

const STAGE_LABELS: Record<string, string> = {
  applied: 'Applied',
  phone_screen: 'Phone',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected'
};

const STAGE_COLORS: Record<string, string> = {
  applied: '#6366f1',
  phone_screen: '#f59e0b',
  interview: '#3b82f6',
  offer: '#10b981',
  rejected: '#ef4444'
};

export function PipelineChart({ range }: PipelineChartProps) {
  const [data, setData] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadChart() {
      setLoading(true);
      try {
        const res = await fetch(`/api/analytics?range=${range}`);
        if (res.ok) {
          const { pipeline } = await res.json();
          setData(pipeline);
        }
      } catch (err) {
        console.error('Failed to load chart', err);
      } finally {
        setLoading(false);
      }
    }

    loadChart();
  }, [range]);

  if (loading) {
    return <div className="bg-white p-6 rounded-lg shadow h-80 animate-pulse" />;
  }

  const chartData = data.map((d) => ({
    ...d,
    label: STAGE_LABELS[d.stage] || d.stage
  }));

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Pipeline</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### ConversionFunnel

```typescript
'use client';

import { useEffect, useState } from 'react';

interface FunnelData {
  stage: string;
  count: number;
  percentage: number;
}

interface ConversionFunnelProps {
  range: '30d' | '90d' | 'all';
}

const STAGE_LABELS: Record<string, string> = {
  applied: 'Applied',
  phone_screen: 'Phone Screen',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected'
};

export function ConversionFunnel({ range }: ConversionFunnelProps) {
  const [data, setData] = useState<FunnelData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFunnel() {
      setLoading(true);
      try {
        const res = await fetch(`/api/analytics?range=${range}`);
        if (res.ok) {
          const { funnel } = await res.json();
          setData(funnel);
        }
      } catch (err) {
        console.error('Failed to load funnel', err);
      } finally {
        setLoading(false);
      }
    }

    loadFunnel();
  }, [range]);

  if (loading) {
    return <div className="bg-white p-6 rounded-lg shadow h-80 animate-pulse" />;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Conversion Funnel</h3>
      <div className="space-y-4">
        {data.map((item) => (
          <div key={item.stage}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">{STAGE_LABELS[item.stage] || item.stage}</span>
              <span className="text-sm text-gray-600">{item.percentage}%</span>
            </div>
            <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 flex items-center justify-end pr-3"
                style={{ width: `${item.percentage}%` }}
              >
                {item.percentage > 10 && <span className="text-xs text-white font-semibold">{item.count}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### DateRangeFilter

```typescript
'use client';

export function DateRangeFilter({
  value,
  onChange
}: {
  value: '30d' | '90d' | 'all';
  onChange: (range: '30d' | '90d' | 'all') => void;
}) {
  return (
    <div className="flex gap-2 mb-6">
      {['30d', '90d', 'all'].map((range) => (
        <button
          key={range}
          onClick={() => onChange(range as any)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            value === range
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
          }`}
        >
          {range === '30d' ? 'Last 30 Days' : range === '90d' ? 'Last 90 Days' : 'All Time'}
        </button>
      ))}
    </div>
  );
}
```

### Dashboard Page

```typescript
'use client';

import { useState } from 'react';
import { StatsGrid } from '@/components/dashboard/stats-grid';
import { PipelineChart } from '@/components/dashboard/pipeline-chart';
import { ConversionFunnel } from '@/components/dashboard/conversion-funnel';
import { DateRangeFilter } from '@/components/dashboard/date-range-filter';

export default function DashboardPage() {
  const [range, setRange] = useState<'30d' | '90d' | 'all'>('30d');

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <DateRangeFilter value={range} onChange={setRange} />

      <StatsGrid range={range} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PipelineChart range={range} />
        <ConversionFunnel range={range} />
      </div>
    </div>
  );
}
```

## Acceptance Tests
- ✅ All 4 stats cards show correct counts
- ✅ Pipeline chart displays all 5 stages
- ✅ Conversion funnel shows percentage labels
- ✅ Date range filter updates all widgets
- ✅ Analytics endpoint responds < 500ms

## Definition of Done
- [ ] Analytics API endpoint functional
- [ ] Stats grid displays live data
- [ ] Pipeline chart renders with Recharts
- [ ] Conversion funnel calculates percentages correctly
- [ ] Date range filter changes all widgets
- [ ] Empty state handles zero applications
- [ ] TypeScript: zero errors
