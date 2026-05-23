'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { JobApplication } from '@prisma/client';

interface PriorityBreakdownChartProps {
  applications: JobApplication[];
}

export function PriorityBreakdownChart({ applications }: PriorityBreakdownChartProps) {
  const priorities = ['LOW', 'MEDIUM', 'HIGH'];

  const data = priorities.map((priority) => {
    const count = applications.filter((app) => app.priority === priority && !app.deletedAt).length;
    return {
      name: priority,
      count
    };
  });

  if (data.every((item) => item.count === 0)) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Applications by Priority</h3>
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Applications by Priority</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" name="Applications" fill="#3B82F6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
