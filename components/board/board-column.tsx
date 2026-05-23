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

const stageColors = {
  APPLIED: { bg: 'bg-blue-50', border: 'border-blue-200', header: 'bg-blue-100' },
  PHONE_SCREEN: { bg: 'bg-purple-50', border: 'border-purple-200', header: 'bg-purple-100' },
  INTERVIEW: { bg: 'bg-yellow-50', border: 'border-yellow-200', header: 'bg-yellow-100' },
  OFFER: { bg: 'bg-green-50', border: 'border-green-200', header: 'bg-green-100' },
  REJECTED: { bg: 'bg-red-50', border: 'border-red-200', header: 'bg-red-100' }
};

export function BoardColumn({ stage, label, applications, onSelectCard }: BoardColumnProps) {
  const { setNodeRef } = useDroppable({ id: stage });
  const colors = stageColors[stage as keyof typeof stageColors] || stageColors.APPLIED;

  return (
    <div className={`flex-1 rounded-lg border-2 ${colors.border} ${colors.bg} flex flex-col min-h-[500px]`}>
      <div className={`${colors.header} px-4 py-3 rounded-t-md mb-4`}>
        <h3 className="font-semibold text-gray-900">{label}</h3>
        <p className="text-sm text-gray-600">{applications.length} items</p>
      </div>
      <div ref={setNodeRef} className="flex-1 px-4 pb-4 space-y-3 overflow-y-auto">
        <SortableContext items={applications.map((a) => a.id)} strategy={verticalListSortingStrategy}>
          {applications.map((app) => (
            <ApplicationCard
              key={app.id}
              application={app}
              onSelect={onSelectCard}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
