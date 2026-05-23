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
  const appliedCount = activeApps.filter((app) => app.stage === 'APPLIED').length;
  const phoneScreenCount = activeApps.filter((app) => app.stage === 'PHONE_SCREEN').length;
  const interviewCount = activeApps.filter((app) => app.stage === 'INTERVIEW').length;
  const offerCount = activeApps.filter((app) => app.stage === 'OFFER').length;
  const rejectedCount = activeApps.filter((app) => app.stage === 'REJECTED').length;

  const successRate = activeApps.length > 0
    ? Math.round((offerCount / activeApps.length) * 100)
    : 0;

  const highPriorityCount = activeApps.filter((app) => app.priority === 'HIGH').length;

  if (loading && applications.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Total Applications"
          value={activeApps.length}
          icon="📝"
          color="blue"
        />
        <StatsCard
          label="Offers"
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StageBreakdownChart applications={applications} />
        <PriorityBreakdownChart applications={applications} />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Funnel</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Applied</span>
            <div className="flex items-center gap-3">
              <div className="w-64 bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
              <span className="text-gray-900 font-semibold">{appliedCount}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Phone Screen</span>
            <div className="flex items-center gap-3">
              <div className="w-64 bg-gray-200 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${appliedCount > 0 ? (phoneScreenCount / appliedCount) * 100 : 0}%` }}></div>
              </div>
              <span className="text-gray-900 font-semibold">{phoneScreenCount}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Interview</span>
            <div className="flex items-center gap-3">
              <div className="w-64 bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-600 h-2 rounded-full" style={{ width: `${phoneScreenCount > 0 ? (interviewCount / phoneScreenCount) * 100 : 0}%` }}></div>
              </div>
              <span className="text-gray-900 font-semibold">{interviewCount}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Offer</span>
            <div className="flex items-center gap-3">
              <div className="w-64 bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: `${interviewCount > 0 ? (offerCount / interviewCount) * 100 : 0}%` }}></div>
              </div>
              <span className="text-gray-900 font-semibold">{offerCount}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Rejected</span>
            <div className="flex items-center gap-3">
              <div className="w-64 bg-gray-200 rounded-full h-2">
                <div className="bg-red-600 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
              <span className="text-gray-900 font-semibold">{rejectedCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
