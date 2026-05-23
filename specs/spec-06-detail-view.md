# Spec 06 — Application Detail View (Slide-Over Panel)

## Preconditions
- spec-04, spec-05 complete

## Goal
Clicking an application card opens a slide-over panel showing full details, notes,
contacts, and timeline. URL updates to /applications/:id.

## Critical Files to Create

- `app/(dashboard)/applications/[id]/page.tsx`
- `components/detail/detail-panel.tsx`
- `components/detail/detail-header.tsx`
- `components/detail/notes-section.tsx`
- `components/detail/contacts-section.tsx`
- `components/detail/timeline-section.tsx`
- `components/detail/documents-section.tsx`

## Detail Panel Layout

```typescript
// components/detail/detail-panel.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { JobApplication, Note, ApplicationEvent } from '@/types';
import { DetailHeader } from './detail-header';
import { NotesSection } from './notes-section';
import { ContactsSection } from './contacts-section';
import { TimelineSection } from './timeline-section';
import { DocumentsSection } from './documents-section';

interface DetailPanelProps {
  appId: string;
}

export function DetailPanel({ appId }: DetailPanelProps) {
  const router = useRouter();
  const [app, setApp] = useState<JobApplication | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [events, setEvents] = useState<ApplicationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'contacts' | 'documents'>('overview');

  useEffect(() => {
    async function loadData() {
      try {
        const [appRes, notesRes, eventsRes] = await Promise.all([
          fetch(`/api/applications/${appId}`),
          fetch(`/api/applications/${appId}/notes`),
          fetch(`/api/applications/${appId}/events`)
        ]);

        if (appRes.ok) {
          const { data } = await appRes.json();
          setApp(data);
        }

        if (notesRes.ok) {
          const { data } = await notesRes.json();
          setNotes(data);
        }

        if (eventsRes.ok) {
          const { data } = await eventsRes.json();
          setEvents(data);
        }
      } catch (err) {
        console.error('Failed to load application', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [appId]);

  useEffect(() => {
    function handleEscKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        router.back();
      }
    }

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [router]);

  if (loading) {
    return <div className="p-6 text-gray-500">Loading...</div>;
  }

  if (!app) {
    return <div className="p-6 text-red-600">Application not found</div>;
  }

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black bg-opacity-40" onClick={() => router.back()} />

      <div className="w-96 bg-white shadow-xl flex flex-col animate-in slide-in-from-right">
        <DetailHeader app={app} onClose={() => router.back()} />

        <div className="flex gap-4 border-b px-6 py-3">
          {['overview', 'notes', 'contacts', 'documents'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`pb-2 text-sm font-medium transition ${
                activeTab === tab
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-4 text-sm">
              <div>
                <label className="text-gray-600">Company</label>
                <p className="font-semibold">{app.company}</p>
              </div>
              <div>
                <label className="text-gray-600">Role</label>
                <p className="font-semibold">{app.role}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-600">Stage</label>
                  <p className="font-semibold capitalize">{app.stage}</p>
                </div>
                <div>
                  <label className="text-gray-600">Priority</label>
                  <p className="font-semibold capitalize">{app.priority}</p>
                </div>
              </div>
              {app.jobUrl && (
                <div>
                  <label className="text-gray-600">Job URL</label>
                  <a href={app.jobUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 break-all">
                    {app.jobUrl}
                  </a>
                </div>
              )}
              {app.location && (
                <div>
                  <label className="text-gray-600">Location</label>
                  <p className="font-semibold">{app.location}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'notes' && <NotesSection appId={appId} notes={notes} onNoteAdded={(n) => setNotes([n, ...notes])} />}
          {activeTab === 'contacts' && <ContactsSection app={app} onUpdate={(updated) => setApp(updated)} />}
          {activeTab === 'documents' && <DocumentsSection app={app} onUpdate={(updated) => setApp(updated)} />}
        </div>

        <TimelineSection events={events} />
      </div>
    </div>
  );
}
```

## Detail Page

```typescript
// app/(dashboard)/applications/[id]/page.tsx
'use client';

import { DetailPanel } from '@/components/detail/detail-panel';

export default function ApplicationDetailPage({ params }: { params: { id: string } }) {
  return <DetailPanel appId={params.id} />;
}
```

## Notes Section

```typescript
'use client';

import { useState } from 'react';
import type { Note } from '@/types';
import { useToast } from '@/components/ui/toast-provider';

interface NotesSectionProps {
  appId: string;
  notes: Note[];
  onNoteAdded: (note: Note) => void;
}

export function NotesSection({ appId, notes, onNoteAdded }: NotesSectionProps) {
  const { addToast } = useToast();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/applications/${appId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });

      if (res.ok) {
        const { data } = await res.json();
        onNoteAdded(data);
        setContent('');
        addToast('Note added', 'success');
      } else {
        addToast('Failed to add note', 'error');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleAddNote} className="space-y-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a note..."
          maxLength={5000}
          className="w-full px-3 py-2 border rounded-md text-sm resize-none h-24"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">{content.length}/5000</span>
          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </form>

      <div className="space-y-3 pt-4 border-t">
        {notes.length === 0 ? (
          <p className="text-sm text-gray-500">No notes yet</p>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="p-3 bg-gray-50 rounded text-sm">
              <p className="text-gray-700">{note.content}</p>
              <p className="text-xs text-gray-500 mt-2">{new Date(note.createdAt).toLocaleDateString()}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

## Contacts Section

```typescript
'use client';

import { useState } from 'react';
import type { JobApplication, Contact } from '@/types';
import { useToast } from '@/components/ui/toast-provider';

interface ContactsSectionProps {
  app: JobApplication;
  onUpdate: (app: JobApplication) => void;
}

export function ContactsSection({ app, onUpdate }: ContactsSectionProps) {
  const { addToast } = useToast();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<Contact>({ name: '' });

  const contacts = app.contacts || [];

  async function handleSave() {
    const updated = { ...app };
    if (editingIndex !== null) {
      updated.contacts[editingIndex] = formData;
    } else {
      updated.contacts = [...contacts, formData];
    }

    try {
      const res = await fetch(`/api/applications/${app.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts: updated.contacts })
      });

      if (res.ok) {
        const { data } = await res.json();
        onUpdate(data);
        setEditingIndex(null);
        setFormData({ name: '' });
        addToast('Contact saved', 'success');
      }
    } catch {
      addToast('Failed to save contact', 'error');
    }
  }

  return (
    <div className="space-y-4">
      {contacts.map((contact, idx) => (
        <div key={idx} className="p-3 bg-gray-50 rounded">
          <p className="font-semibold text-sm">{contact.name}</p>
          {contact.email && <p className="text-xs text-gray-600">{contact.email}</p>}
          {contact.phone && <p className="text-xs text-gray-600">{contact.phone}</p>}
          {contact.role && <p className="text-xs text-gray-600">{contact.role}</p>}
          <button
            onClick={() => {
              setEditingIndex(idx);
              setFormData(contact);
            }}
            className="text-xs text-blue-600 mt-2 hover:underline"
          >
            Edit
          </button>
        </div>
      ))}

      {editingIndex !== null && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded space-y-2">
          <input
            type="text"
            placeholder="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-2 py-1 text-sm border rounded"
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.email || ''}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-2 py-1 text-sm border rounded"
          />
          <button onClick={handleSave} className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">
            Save
          </button>
        </div>
      )}

      {editingIndex === null && (
        <button
          onClick={() => setEditingIndex(-1)}
          className="text-sm text-blue-600 hover:underline"
        >
          + Add Contact
        </button>
      )}
    </div>
  );
}
```

## Timeline Section

```typescript
'use client';

import type { ApplicationEvent } from '@/types';

interface TimelineSectionProps {
  events: ApplicationEvent[];
}

export function TimelineSection({ events }: TimelineSectionProps) {
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'created':
        return '📝';
      case 'stage_changed':
        return '➡️';
      default:
        return '•';
    }
  };

  return (
    <div className="border-t bg-gray-50 p-4 max-h-32 overflow-y-auto">
      <p className="text-xs font-semibold text-gray-600 mb-3">Timeline</p>
      <div className="space-y-2">
        {events.length === 0 ? (
          <p className="text-xs text-gray-500">No events yet</p>
        ) : (
          events.map((event) => (
            <div key={event.id} className="text-xs">
              <p className="text-gray-700">
                {getEventIcon(event.eventType)} {event.eventType.replace(/_/g, ' ')}
                {event.newValue && ` → ${event.newValue}`}
              </p>
              <p className="text-gray-500">{new Date(event.createdAt).toLocaleDateString()}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

## Documents Section

```typescript
'use client';

import { useState, useEffect } from 'react';
import type { JobApplication } from '@/types';
import { useToast } from '@/components/ui/toast-provider';

interface DocumentsSectionProps {
  app: JobApplication;
  onUpdate: (app: JobApplication) => void;
}

export function DocumentsSection({ app, onUpdate }: DocumentsSectionProps) {
  const { addToast } = useToast();
  const [docs, setDocs] = useState(app.documents || {});
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/applications/${app.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents: docs })
      });

      if (res.ok) {
        const { data } = await res.json();
        onUpdate(data);
        addToast('Documents saved', 'success');
      }
    } catch {
      addToast('Failed to save documents', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Resume URL</label>
        <input
          type="url"
          value={docs.resumeUrl || ''}
          onChange={(e) => setDocs({ ...docs, resumeUrl: e.target.value })}
          placeholder="https://..."
          className="w-full px-3 py-2 border rounded-md text-sm mt-1"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Cover Letter URL</label>
        <input
          type="url"
          value={docs.coverLetterUrl || ''}
          onChange={(e) => setDocs({ ...docs, coverLetterUrl: e.target.value })}
          placeholder="https://..."
          className="w-full px-3 py-2 border rounded-md text-sm mt-1"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Job Posting URL</label>
        <input
          type="url"
          value={docs.jobPostingUrl || ''}
          onChange={(e) => setDocs({ ...docs, jobPostingUrl: e.target.value })}
          placeholder="https://..."
          className="w-full px-3 py-2 border rounded-md text-sm mt-1"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
      >
        {saving ? 'Saving...' : 'Save Documents'}
      </button>
    </div>
  );
}
```

## Additional API Route Needed

### GET /api/applications/[id]/events

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('application_events')
    .select('*')
    .eq('application_id', params.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data || [] });
}
```

## Acceptance Tests
- ✅ Detail panel opens on card click
- ✅ URL updates to /applications/:id
- ✅ ESC key closes panel
- ✅ Notes persist after reload
- ✅ Timeline shows stage change events
- ✅ Contacts can be added/edited
- ✅ Focus management works (returns to card on close)

## Definition of Done
- [ ] Panel renders with all 4 tabs
- [ ] Notes section allows CRUD operations
- [ ] Contacts section allows editing
- [ ] Timeline shows events correctly
- [ ] Documents section saves URL fields
- [ ] ESC and backdrop click close panel
- [ ] URL navigation works
- [ ] TypeScript: zero errors
