'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  sortableKeyboardCoordinates
} from '@dnd-kit/sortable';
import type { JobApplication } from '@prisma/client';
import { BoardColumn } from './board-column';
import { useApplications } from '@/lib/context/applications-context';
import { useToast } from '@/lib/context/toast-context';
import { updateApplication } from '@/lib/api/applications';

const STAGES = [
  { id: 'APPLIED', label: 'Applied' },
  { id: 'PHONE_SCREEN', label: 'Phone Screen' },
  { id: 'INTERVIEW', label: 'Interview' },
  { id: 'OFFER', label: 'Offer' },
  { id: 'REJECTED', label: 'Rejected' }
];

interface KanbanBoardProps {
  onSelectCard?: (app: JobApplication) => void;
  applications?: JobApplication[];
}

export function KanbanBoard({ onSelectCard, applications: propsApplications }: KanbanBoardProps) {
  const { applications: contextApplications, updateApplication: updateCtx } = useApplications();
  const applications = propsApplications || contextApplications;
  const { addToast } = useToast();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;

    if (!over) return;

    const appId = active.id as string;
    const newStage = over.id as string;
    const validStages = ['APPLIED', 'PHONE_SCREEN', 'INTERVIEW', 'OFFER', 'REJECTED'];

    if (!validStages.includes(newStage)) return;

    const app = applications.find((a) => a.id === appId);
    if (!app || app.stage === newStage) return;

    try {
      await updateApplication(appId, { stage: newStage as any });
      updateCtx(appId, { ...app, stage: newStage });
      addToast(`Moved to ${newStage.replace(/_/g, ' ')}`, 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to update stage', 'error');
    }
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  const applicationsByStage = STAGES.reduce((acc, stage) => {
    acc[stage.id] = applications.filter((app) => app.stage === stage.id && !app.deletedAt);
    return acc;
  }, {} as Record<string, JobApplication[]>);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-5 gap-4">
        {STAGES.map((stage) => (
          <BoardColumn
            key={stage.id}
            stage={stage.id}
            label={stage.label}
            applications={applicationsByStage[stage.id]}
            onSelectCard={onSelectCard}
          />
        ))}
      </div>
    </DndContext>
  );
}
