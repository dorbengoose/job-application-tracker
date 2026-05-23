import type { JobApplication, Note } from '@prisma/client';
import type { CreateApplicationInput, UpdateApplicationInput } from '@/lib/validation/application-schemas';

export async function fetchApplications() {
  const res = await fetch('/api/applications');
  if (!res.ok) throw new Error('Failed to fetch applications');
  return res.json() as Promise<{ data: JobApplication[]; count: number }>;
}

export async function createApplication(data: CreateApplicationInput) {
  const res = await fetch('/api/applications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create application');
  }
  return res.json() as Promise<{ data: JobApplication }>;
}

export async function getApplication(id: string) {
  const res = await fetch(`/api/applications/${id}`);
  if (!res.ok) throw new Error('Failed to fetch application');
  return res.json() as Promise<{ data: JobApplication }>;
}

export async function updateApplication(id: string, data: UpdateApplicationInput) {
  const res = await fetch(`/api/applications/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update application');
  }
  return res.json() as Promise<{ data: JobApplication }>;
}

export async function deleteApplication(id: string) {
  const res = await fetch(`/api/applications/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete application');
  return res.json();
}

export async function getNotes(applicationId: string) {
  const res = await fetch(`/api/applications/${applicationId}/notes`);
  if (!res.ok) throw new Error('Failed to fetch notes');
  return res.json() as Promise<{ data: Note[] }>;
}

export async function createNote(applicationId: string, content: string) {
  const res = await fetch(`/api/applications/${applicationId}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content })
  });
  if (!res.ok) throw new Error('Failed to create note');
  return res.json() as Promise<{ data: Note }>;
}
