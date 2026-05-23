'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { JobApplication } from '@prisma/client';

interface ApplicationCardProps {
  application: JobApplication;
  onSelect?: (app: JobApplication) => void;
}

export function ApplicationCard({ application, onSelect }: ApplicationCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: application.id
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  const priorityColors = {
    HIGH: 'bg-red-100 text-red-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    LOW: 'bg-green-100 text-green-800'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onSelect?.(application)}
      className="bg-white p-4 rounded-lg shadow hover:shadow-md cursor-move hover:bg-gray-50 transition"
    >
      <h3 className="font-semibold text-gray-900 text-sm mb-1">{application.company}</h3>
      <p className="text-gray-600 text-sm mb-2">{application.role}</p>
      <div className="flex items-center justify-between">
        <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColors[application.priority as keyof typeof priorityColors]}`}>
          {application.priority}
        </span>
        <span className="text-gray-500 text-xs">
          {new Date(application.appliedDate).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}
