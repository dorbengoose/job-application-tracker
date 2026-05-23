'use client';

import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import type { JobApplication } from '@prisma/client';

interface StageBreakdownChartProps {
  applications: JobApplication[];
}

const COLORS = {
  APPLIED: '#3B82F6',
  PHONE_SCREEN: '#A855F7',
  INTERVIEW: '#F59E0B',
  OFFER: '#10B981',
  REJECTED: '#EF4444'
};

export function StageBreakdownChart({ applications }: StageBreakdownChartProps) {
  const stages = ['APPLIED', 'PHONE_SCREEN', 'INTERVIEW', 'OFFER', 'REJECTED'];

  const data = stages.map((stage) => {
    const count = applications.filter((app) => app.stage === stage && !app.deletedAt).length;
    return {
      name: stage.replace(/_/g, ' '),
      value: count
    };
  }).filter((item) => item.value > 0);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Applications by Stage</h3>
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Applications by Stage</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${value}`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => {
              const stageKey = entry.name.replace(/ /g, '_') as keyof typeof COLORS;
              return <Cell key={`cell-${index}`} fill={COLORS[stageKey] || '#8884d8'} />;
            })}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
