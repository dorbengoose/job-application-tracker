'use client';

import { useState, useEffect } from 'react';
import type { JobApplication, Note } from '@prisma/client';
import { ApplicationForm } from '../applications/application-form';
import { useToast } from '@/lib/context/toast-context';
import { useApplications } from '@/lib/context/applications-context';
import { getNotes, createNote, deleteApplication, updateApplication } from '@/lib/api/applications';

interface ApplicationDetailPanelProps {
  application: JobApplication;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: () => void;
}

export function ApplicationDetailPanel({
  application,
  isOpen,
  onClose,
  onDelete
}: ApplicationDetailPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loadingNotes, setLoadingNotes] = useState(false);
  const { addToast } = useToast();
  const { removeApplication } = useApplications();

  useEffect(() => {
    if (isOpen) {
      loadNotes();
    }
  }, [isOpen, application.id]);

  async function loadNotes() {
    try {
      setLoadingNotes(true);
      const { data } = await getNotes(application.id);
      setNotes(data);
    } catch (err) {
      addToast('Failed to load notes', 'error');
    } finally {
      setLoadingNotes(false);
    }
  }

  async function handleAddNote() {
    if (!newNote.trim()) {
      addToast('Note cannot be empty', 'error');
      return;
    }

    try {
      const { data } = await createNote(application.id, newNote);
      setNotes([data, ...notes]);
      setNewNote('');
      addToast('Note added', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to add note', 'error');
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this application?')) {
      return;
    }

    try {
      await deleteApplication(application.id);
      removeApplication(application.id);
      addToast('Application deleted', 'success');
      onDelete?.();
      onClose();
    } catch (err: any) {
      addToast(err.message || 'Failed to delete application', 'error');
    }
  }

  async function handleUpdate(formData: any) {
    try {
      await updateApplication(application.id, formData);
      setIsEditing(false);
      addToast('Application updated', 'success');
      onClose();
    } catch (err: any) {
      addToast(err.message || 'Failed to update application', 'error');
      throw err;
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-end">
      <div className="bg-white w-full max-w-md h-full overflow-y-auto flex flex-col">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">
            {application.company} - {application.role}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            aria-label="Close panel"
          >
            ×
          </button>
        </div>

        <div className="flex-1 px-6 py-4 space-y-6 overflow-y-auto">
          {isEditing ? (
            <ApplicationForm
              application={application}
              onSubmit={handleUpdate}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                    Stage
                  </label>
                  <span className="inline-block px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                    {application.stage}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                    Priority
                  </label>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    application.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                    application.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {application.priority}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                    Applied Date
                  </label>
                  <p className="text-sm text-gray-900">
                    {new Date(application.appliedDate).toLocaleDateString()}
                  </p>
                </div>

                {application.location && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                      Location
                    </label>
                    <p className="text-sm text-gray-900">{application.location}</p>
                  </div>
                )}

                {application.jobUrl && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                      Job URL
                    </label>
                    <a
                      href={application.jobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline break-all"
                    >
                      {application.jobUrl}
                    </a>
                  </div>
                )}

                {(application.salaryMin || application.salaryMax) && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                      Salary Range
                    </label>
                    <p className="text-sm text-gray-900">
                      {application.salaryMin ? `$${application.salaryMin.toLocaleString()}` : 'N/A'}
                      {' - '}
                      {application.salaryMax ? `$${application.salaryMax.toLocaleString()}` : 'N/A'}
                    </p>
                  </div>
                )}

                {application.source && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                      Source
                    </label>
                    <p className="text-sm text-gray-900">{application.source}</p>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-semibold text-gray-900 mb-3">Notes</h3>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAddNote();
                        }
                      }}
                      placeholder="Add a note..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={handleAddNote}
                      className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>

                  {loadingNotes ? (
                    <p className="text-sm text-gray-600">Loading notes...</p>
                  ) : notes.length === 0 ? (
                    <p className="text-sm text-gray-600">No notes yet</p>
                  ) : (
                    <div className="space-y-2">
                      {notes.map((note) => (
                        <div key={note.id} className="bg-gray-50 p-3 rounded-md">
                          <p className="text-sm text-gray-900">{note.content}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(note.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="border-t border-gray-200 px-6 py-4 flex gap-2 justify-end">
          {!isEditing && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md"
              >
                Delete
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
          >
            {isEditing ? 'Cancel' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
