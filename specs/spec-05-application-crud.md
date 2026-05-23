# Spec 05 — Application CRUD (API + UI)

## Preconditions
- spec-01, spec-02, spec-03 complete

## Goal
Build all REST API endpoints for job applications with Zod validation, and complete
CRUD UI forms (create, edit, delete) with modals and toasts.

## Critical Files to Create

### API Routes
- `app/api/applications/route.ts`
- `app/api/applications/[id]/route.ts`
- `app/api/applications/[id]/notes/route.ts`
- `lib/validation/application-schemas.ts`
- `lib/api/error-handler.ts`
- `lib/api/applications.ts`

### UI Components
- `components/applications/application-form.tsx`
- `components/applications/create-application-modal.tsx`
- `components/applications/delete-confirm-dialog.tsx`
- `components/ui/modal.tsx`
- `components/ui/toast.tsx`
- `components/ui/toast-provider.tsx`

## Zod Schemas

```typescript
// lib/validation/application-schemas.ts
import { z } from 'zod';

export const CreateApplicationSchema = z.object({
  company: z.string().min(1, 'Company is required').max(200),
  role: z.string().min(1, 'Role is required').max(200),
  stage: z.enum(['applied', 'phone_screen', 'interview', 'offer', 'rejected']),
  priority: z.enum(['low', 'medium', 'high']),
  appliedDate: z.string().refine((d) => new Date(d) <= new Date(), {
    message: 'Applied date cannot be in the future'
  }),
  jobUrl: z.string().url().optional().or(z.literal('')),
  location: z.string().max(200).optional(),
  salaryMin: z.number().min(0).optional(),
  salaryMax: z.number().min(0).optional(),
  source: z.string().max(100).optional()
}).refine(
  (data) => !data.salaryMin || !data.salaryMax || data.salaryMax >= data.salaryMin,
  { message: 'Max salary must be >= min salary', path: ['salaryMax'] }
);

export const UpdateApplicationSchema = CreateApplicationSchema.partial();
export type CreateApplicationInput = z.infer<typeof CreateApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof UpdateApplicationSchema>;
```

## API Routes

### GET /api/applications

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('job_applications')
    .select('*')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, count: data?.length || 0 });
}
```

### POST /api/applications

```typescript
import { createClient } from '@/lib/supabase/server';
import { CreateApplicationSchema } from '@/lib/validation/application-schemas';
import { handleApiError } from '@/lib/api/error-handler';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = CreateApplicationSchema.parse(body);

    const { data, error } = await supabase
      .from('job_applications')
      .insert([{ user_id: user.id, ...validated }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### GET /api/applications/[id]

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
    .from('job_applications')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ data });
}
```

### PATCH /api/applications/[id]

```typescript
import { createClient } from '@/lib/supabase/server';
import { UpdateApplicationSchema } from '@/lib/validation/application-schemas';
import { handleApiError } from '@/lib/api/error-handler';
import { NextResponse } from 'next/server';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = UpdateApplicationSchema.parse(body);

    const { data, error } = await supabase
      .from('job_applications')
      .update(validated)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### DELETE /api/applications/[id]

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await supabase
    .from('job_applications')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ message: 'Application deleted' });
}
```

### GET/POST/DELETE /api/applications/[id]/notes

```typescript
// GET - list notes
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
    .from('notes')
    .select('*')
    .eq('application_id', params.id)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data || [] });
}

// POST - create note
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { content } = await request.json();

  if (!content || typeof content !== 'string' || content.length > 5000) {
    return NextResponse.json(
      { error: 'Content is required and max 5000 chars' },
      { status: 422 }
    );
  }

  const { data, error } = await supabase
    .from('notes')
    .insert([{ application_id: params.id, user_id: user.id, content }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
```

## Error Handler

```typescript
// lib/api/error-handler.ts
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    const fields: Record<string, string> = {};
    error.errors.forEach((e) => {
      if (e.path[0]) {
        fields[e.path[0] as string] = e.message;
      }
    });
    return NextResponse.json(
      { error: 'Validation failed', fields },
      { status: 422 }
    );
  }

  console.error('[API Error]', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

## UI Components

### ApplicationForm

```typescript
'use client';

import { useState } from 'react';
import type { JobApplication } from '@/types';
import { CreateApplicationSchema } from '@/lib/validation/application-schemas';

interface ApplicationFormProps {
  application?: JobApplication;
  onSubmit: (data: any) => Promise<void>;
}

export function ApplicationForm({ application, onSubmit }: ApplicationFormProps) {
  const [formData, setFormData] = useState(application || {});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    try {
      CreateApplicationSchema.parse(formData);
    } catch (error: any) {
      if (error.errors) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((e: any) => {
          if (e.path[0]) {
            fieldErrors[e.path[0]] = e.message;
          }
        });
        setErrors(fieldErrors);
      }
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (err: any) {
      setErrors({ submit: err.message || 'Failed to save' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Company *</label>
        <input
          type="text"
          value={formData.company || ''}
          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
          className="w-full px-3 py-2 border rounded-md"
          required
        />
        {errors.company && <p className="text-sm text-red-600 mt-1">{errors.company}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Role *</label>
        <input
          type="text"
          value={formData.role || ''}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          className="w-full px-3 py-2 border rounded-md"
          required
        />
        {errors.role && <p className="text-sm text-red-600 mt-1">{errors.role}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Stage *</label>
        <select
          value={formData.stage || 'applied'}
          onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
          className="w-full px-3 py-2 border rounded-md"
          required
        >
          <option value="applied">Applied</option>
          <option value="phone_screen">Phone Screen</option>
          <option value="interview">Interview</option>
          <option value="offer">Offer</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Priority *</label>
        <select
          value={formData.priority || 'medium'}
          onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
          className="w-full px-3 py-2 border rounded-md"
          required
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Applied Date *</label>
        <input
          type="date"
          value={formData.appliedDate || ''}
          onChange={(e) => setFormData({ ...formData, appliedDate: e.target.value })}
          className="w-full px-3 py-2 border rounded-md"
          required
        />
        {errors.appliedDate && <p className="text-sm text-red-600 mt-1">{errors.appliedDate}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Job URL</label>
        <input
          type="url"
          value={formData.jobUrl || ''}
          onChange={(e) => setFormData({ ...formData, jobUrl: e.target.value })}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="https://..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Location</label>
        <input
          type="text"
          value={formData.location || ''}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>

      {errors.submit && <p className="text-sm text-red-600">{errors.submit}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save Application'}
      </button>
    </form>
  );
}
```

### Toast System

```typescript
// components/ui/toast-provider.tsx
'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (message: string, type: 'success' | 'error' | 'info', duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info', duration = 3000) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-2 rounded-md text-white text-sm ${
              toast.type === 'success' ? 'bg-green-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
```

## Acceptance Tests
- ✅ POST /api/applications returns 201 with valid data
- ✅ POST returns 422 when required field missing
- ✅ PATCH /api/applications/:id returns 403 for another user's app
- ✅ DELETE soft-deletes (sets deleted_at)
- ✅ Form shows validation errors before network call
- ✅ Form pre-fills in edit mode

## Definition of Done
- [ ] All 7 API endpoints functional
- [ ] Zod validation enforced on all endpoints
- [ ] Soft delete confirmed (deleted_at set, not hard delete)
- [ ] ApplicationForm component complete
- [ ] Toast system working
- [ ] TypeScript: zero errors
