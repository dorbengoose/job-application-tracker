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

const priorityConfig = {
  HIGH:   { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: 'High' },
  MEDIUM: { color: '#d97706', bg: '#fffbeb', border: '#fde68a', label: 'Medium' },
  LOW:    { color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', label: 'Low' },
} as const;

const stageConfig: Record<string, { color: string; bg: string; label: string }> = {
  APPLIED:      { color: '#6366f1', bg: '#eef2ff', label: 'Applied' },
  PHONE_SCREEN: { color: '#8b5cf6', bg: '#f5f3ff', label: 'Phone Screen' },
  INTERVIEW:    { color: '#f59e0b', bg: '#fffbeb', label: 'Interview' },
  OFFER:        { color: '#10b981', bg: '#ecfdf5', label: 'Offer' },
  REJECTED:     { color: '#f43f5e', bg: '#fff1f2', label: 'Rejected' },
};

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

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

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

  const priority = application.priority as keyof typeof priorityConfig;
  const pc = priorityConfig[priority] || priorityConfig.MEDIUM;
  const sc = stageConfig[application.stage] || stageConfig.APPLIED;

  const fieldLabelStyle: React.CSSProperties = {
    width: '120px',
    flexShrink: 0,
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  };

  const fieldValueStyle: React.CSSProperties = {
    fontSize: '13px',
    color: 'var(--text-primary)',
    flex: 1,
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fade-in"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: 40,
        }}
      />

      {/* Slide-over panel */}
      <div
        className="slide-in-right"
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          right: 0,
          width: '420px',
          maxWidth: '100vw',
          background: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-default)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '12px',
            flexShrink: 0,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              style={{
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                margin: 0,
                lineHeight: 1.3,
                letterSpacing: '-0.2px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {application.company}
            </h2>
            <p
              style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                marginTop: '2px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {application.role}
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close panel"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-sm)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-tertiary)',
              transition: 'background 0.1s, color 0.1s',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-muted)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-tertiary)';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 24px',
          }}
        >
          {isEditing ? (
            <ApplicationForm
              application={application}
              onSubmit={handleUpdate}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <>
              {/* Field rows */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                {/* Stage */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={fieldLabelStyle}>Stage</span>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 500,
                      color: sc.color,
                      background: sc.bg,
                      borderRadius: 'var(--radius-full)',
                      padding: '2px 10px',
                    }}
                  >
                    {sc.label}
                  </span>
                </div>

                {/* Priority */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={fieldLabelStyle}>Priority</span>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 500,
                      color: pc.color,
                      background: pc.bg,
                      border: `1px solid ${pc.border}`,
                      borderRadius: 'var(--radius-full)',
                      padding: '2px 10px',
                    }}
                  >
                    {pc.label}
                  </span>
                </div>

                {/* Applied Date */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={fieldLabelStyle}>Applied</span>
                  <span style={fieldValueStyle}>
                    {new Date(application.appliedDate).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                {/* Location */}
                {application.location && (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={fieldLabelStyle}>Location</span>
                    <span style={fieldValueStyle}>{application.location}</span>
                  </div>
                )}

                {/* Job URL */}
                {application.jobUrl && (
                  <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                    <span style={fieldLabelStyle}>Job URL</span>
                    <a
                      href={application.jobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        ...fieldValueStyle,
                        color: 'var(--accent)',
                        textDecoration: 'none',
                        wordBreak: 'break-all',
                        lineHeight: 1.4,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
                    >
                      {application.jobUrl}
                    </a>
                  </div>
                )}

                {/* Salary */}
                {(application.salaryMin || application.salaryMax) && (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={fieldLabelStyle}>Salary</span>
                    <span style={fieldValueStyle}>
                      {application.salaryMin ? `$${application.salaryMin.toLocaleString()}` : '—'}
                      {' – '}
                      {application.salaryMax ? `$${application.salaryMax.toLocaleString()}` : '—'}
                    </span>
                  </div>
                )}

                {/* Source */}
                {application.source && (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={fieldLabelStyle}>Source</span>
                    <span style={fieldValueStyle}>{application.source}</span>
                  </div>
                )}
              </div>

              {/* Notes section */}
              <div
                style={{
                  marginTop: '24px',
                  paddingTop: '20px',
                  borderTop: '1px solid var(--border-default)',
                }}
              >
                <h3
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: '12px',
                    letterSpacing: '-0.1px',
                  }}
                >
                  Notes
                </h3>

                {/* Add note input */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleAddNote();
                    }}
                    placeholder="Add a note..."
                    style={{
                      flex: 1,
                      height: '36px',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0 12px',
                      fontSize: '13px',
                      color: 'var(--text-primary)',
                      background: 'var(--bg-subtle)',
                      outline: 'none',
                      transition: 'border-color 0.15s',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-focus)';
                      e.currentTarget.style.background = 'var(--bg-surface)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-default)';
                      e.currentTarget.style.background = 'var(--bg-subtle)';
                    }}
                  />
                  <button
                    onClick={handleAddNote}
                    style={{
                      height: '36px',
                      padding: '0 14px',
                      background: 'var(--accent)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'background 0.1s',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-hover)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent)'; }}
                  >
                    Add
                  </button>
                </div>

                {/* Notes list */}
                {loadingNotes ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="skeleton" style={{ height: '52px', borderRadius: 'var(--radius-md)' }} />
                    <div className="skeleton" style={{ height: '52px', borderRadius: 'var(--radius-md)' }} />
                  </div>
                ) : notes.length === 0 ? (
                  <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', textAlign: 'center', padding: '16px 0' }}>
                    No notes yet. Add your first note above.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {notes.map((note) => (
                      <div
                        key={note.id}
                        style={{
                          background: 'var(--bg-subtle)',
                          border: '1px solid var(--border-default)',
                          borderRadius: 'var(--radius-md)',
                          padding: '10px 12px',
                        }}
                      >
                        <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                          {note.content}
                        </p>
                        <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                          {new Date(note.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer actions */}
        <div
          style={{
            borderTop: '1px solid var(--border-default)',
            padding: '16px 24px',
            display: 'flex',
            gap: '8px',
            justifyContent: 'flex-end',
            flexShrink: 0,
            background: 'var(--bg-surface)',
          }}
        >
          {!isEditing && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  height: '34px',
                  padding: '0 14px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  background: 'transparent',
                  border: '1px solid var(--border-default)',
                  cursor: 'pointer',
                  transition: 'all 0.1s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-muted)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                  e.currentTarget.style.borderColor = 'var(--border-strong)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                }}
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                style={{
                  height: '34px',
                  padding: '0 14px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#dc2626',
                  background: 'transparent',
                  border: '1px solid #fecaca',
                  cursor: 'pointer',
                  transition: 'all 0.1s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#fef2f2';
                  e.currentTarget.style.borderColor = '#fca5a5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = '#fecaca';
                }}
              >
                Delete
              </button>
            </>
          )}
          <button
            onClick={onClose}
            style={{
              height: '34px',
              padding: '0 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              background: 'transparent',
              border: '1px solid var(--border-default)',
              cursor: 'pointer',
              transition: 'all 0.1s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-muted)';
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.borderColor = 'var(--border-strong)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.borderColor = 'var(--border-default)';
            }}
          >
            {isEditing ? 'Cancel' : 'Close'}
          </button>
        </div>
      </div>
    </>
  );
}
