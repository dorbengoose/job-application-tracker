'use client';

import { useState } from 'react';
import type { JobApplication } from '@prisma/client';
import { CreateApplicationSchema } from '@/lib/validation/application-schemas';

interface ApplicationFormProps {
  application?: JobApplication;
  onSubmit: (data: any) => Promise<void>;
  onCancel?: () => void;
}

export function ApplicationForm({ application, onSubmit, onCancel }: ApplicationFormProps) {
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
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Company *
        </label>
        <input
          type="text"
          value={(formData as any).company || ''}
          onChange={(e) => setFormData({ ...formData, company: e.target.value } as any)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        />
        {errors.company && <p className="text-sm text-red-600 mt-1">{errors.company}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Role *
        </label>
        <input
          type="text"
          value={(formData as any).role || ''}
          onChange={(e) => setFormData({ ...formData, role: e.target.value } as any)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        />
        {errors.role && <p className="text-sm text-red-600 mt-1">{errors.role}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Stage *
          </label>
          <select
            value={(formData as any).stage || 'APPLIED'}
            onChange={(e) => setFormData({ ...formData, stage: e.target.value } as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="APPLIED">Applied</option>
            <option value="PHONE_SCREEN">Phone Screen</option>
            <option value="INTERVIEW">Interview</option>
            <option value="OFFER">Offer</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priority *
          </label>
          <select
            value={(formData as any).priority || 'MEDIUM'}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value } as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Applied Date *
        </label>
        <input
          type="date"
          value={(formData as any).appliedDate || ''}
          onChange={(e) => setFormData({ ...formData, appliedDate: e.target.value } as any)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        />
        {errors.appliedDate && <p className="text-sm text-red-600 mt-1">{errors.appliedDate}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Job URL
        </label>
        <input
          type="url"
          value={(formData as any).jobUrl || ''}
          onChange={(e) => setFormData({ ...formData, jobUrl: e.target.value } as any)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="https://..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Location
        </label>
        <input
          type="text"
          value={(formData as any).location || ''}
          onChange={(e) => setFormData({ ...formData, location: e.target.value } as any)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Salary Min
          </label>
          <input
            type="number"
            value={(formData as any).salaryMin || ''}
            onChange={(e) =>
              setFormData({ ...formData, salaryMin: e.target.value ? parseInt(e.target.value) : undefined } as any)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Salary Max
          </label>
          <input
            type="number"
            value={(formData as any).salaryMax || ''}
            onChange={(e) =>
              setFormData({ ...formData, salaryMax: e.target.value ? parseInt(e.target.value) : undefined } as any)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.salaryMax && <p className="text-sm text-red-600 mt-1">{errors.salaryMax}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Source
        </label>
        <input
          type="text"
          value={(formData as any).source || ''}
          onChange={(e) => setFormData({ ...formData, source: e.target.value } as any)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="LinkedIn, Referral, etc."
        />
      </div>

      {errors.submit && <p className="text-sm text-red-600">{errors.submit}</p>}

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Application'}
        </button>
      </div>
    </form>
  );
}
