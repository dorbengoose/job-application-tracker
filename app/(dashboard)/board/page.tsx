'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { ApplicationForm } from '@/components/applications/application-form';
import { KanbanBoard } from '@/components/board/kanban-board';
import { FilterBar } from '@/components/board/filter-bar';
import { ApplicationDetailPanel } from '@/components/detail/application-detail-panel';
import { useApplications } from '@/lib/context/applications-context';
import { useToast } from '@/lib/context/toast-context';
import { createApplication } from '@/lib/api/applications';
import type { JobApplication } from '@prisma/client';

export default function BoardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    stages: [] as string[],
    priorities: [] as string[]
  });
  const { applications, loading, error, fetchApplications } = useApplications();
  const { addToast } = useToast();

  useEffect(() => {
    fetchApplications();
  }, []);

  async function handleSubmit(formData: any) {
    try {
      await createApplication(formData);
      setIsModalOpen(false);
      addToast('Application created successfully', 'success');
      await fetchApplications();
    } catch (err: any) {
      addToast(err.message || 'Failed to create application', 'error');
      throw err;
    }
  }

  const filteredApplications = applications.filter((app) => {
    if (!app || app.deletedAt) return false;

    const searchLower = filters.search.toLowerCase();
    if (searchLower && !app.company.toLowerCase().includes(searchLower) && !app.role.toLowerCase().includes(searchLower)) {
      return false;
    }

    if (filters.stages.length > 0 && !filters.stages.includes(app.stage)) {
      return false;
    }

    if (filters.priorities.length > 0 && !filters.priorities.includes(app.priority)) {
      return false;
    }

    return true;
  });

  if (loading && applications.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Loading applications...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Job Applications</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
        >
          New Application
        </button>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Job Application"
      >
        <ApplicationForm
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      {selectedApp && (
        <ApplicationDetailPanel
          application={selectedApp}
          isOpen={!!selectedApp}
          onClose={() => setSelectedApp(null)}
          onDelete={() => setSelectedApp(null)}
        />
      )}

      <FilterBar onFilterChange={setFilters} />

      {applications.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-600">No applications yet. Create your first one!</p>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-600">No applications match your filters</p>
        </div>
      ) : (
        <KanbanBoard onSelectCard={setSelectedApp} applications={filteredApplications} />
      )}
    </div>
  );
}
