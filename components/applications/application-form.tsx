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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '40px',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)',
    padding: '0 12px',
    fontSize: '14px',
    color: 'var(--text-primary)',
    background: 'var(--bg-surface)',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    fontFamily: 'inherit',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 15 15' fill='none'%3E%3Cpath d='M3.5 6l4 4 4-4' stroke='%23888' strokeWidth='1.3' strokeLinecap='round' strokeLinejoin='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
    paddingRight: '30px',
    cursor: 'pointer',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    marginBottom: '6px',
  };

  const errorStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#dc2626',
    marginTop: '4px',
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = 'var(--border-focus)';
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,112,243,0.15)';
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = 'var(--border-default)';
    e.currentTarget.style.boxShadow = 'none';
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Company */}
      <div>
        <label style={labelStyle}>Company <span style={{ color: '#dc2626' }}>*</span></label>
        <input
          type="text"
          value={(formData as any).company || ''}
          onChange={(e) => setFormData({ ...formData, company: e.target.value } as any)}
          style={inputStyle}
          placeholder="e.g. Acme Corp"
          required
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        {errors.company && <p style={errorStyle}>{errors.company}</p>}
      </div>

      {/* Role */}
      <div>
        <label style={labelStyle}>Role <span style={{ color: '#dc2626' }}>*</span></label>
        <input
          type="text"
          value={(formData as any).role || ''}
          onChange={(e) => setFormData({ ...formData, role: e.target.value } as any)}
          style={inputStyle}
          placeholder="e.g. Senior Frontend Engineer"
          required
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        {errors.role && <p style={errorStyle}>{errors.role}</p>}
      </div>

      {/* Stage + Priority */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={labelStyle}>Stage <span style={{ color: '#dc2626' }}>*</span></label>
          <select
            value={(formData as any).stage || 'APPLIED'}
            onChange={(e) => setFormData({ ...formData, stage: e.target.value } as any)}
            style={selectStyle}
            required
            onFocus={handleFocus}
            onBlur={handleBlur}
          >
            <option value="APPLIED">Applied</option>
            <option value="PHONE_SCREEN">Phone Screen</option>
            <option value="INTERVIEW">Interview</option>
            <option value="OFFER">Offer</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <div>
          <label style={labelStyle}>Priority <span style={{ color: '#dc2626' }}>*</span></label>
          <select
            value={(formData as any).priority || 'MEDIUM'}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value } as any)}
            style={selectStyle}
            required
            onFocus={handleFocus}
            onBlur={handleBlur}
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>
      </div>

      {/* Applied Date */}
      <div>
        <label style={labelStyle}>Applied Date <span style={{ color: '#dc2626' }}>*</span></label>
        <input
          type="date"
          value={(formData as any).appliedDate || ''}
          onChange={(e) => setFormData({ ...formData, appliedDate: e.target.value } as any)}
          style={inputStyle}
          required
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        {errors.appliedDate && <p style={errorStyle}>{errors.appliedDate}</p>}
      </div>

      {/* Job URL */}
      <div>
        <label style={labelStyle}>Job URL</label>
        <input
          type="url"
          value={(formData as any).jobUrl || ''}
          onChange={(e) => setFormData({ ...formData, jobUrl: e.target.value } as any)}
          style={inputStyle}
          placeholder="https://..."
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>

      {/* Location */}
      <div>
        <label style={labelStyle}>Location</label>
        <input
          type="text"
          value={(formData as any).location || ''}
          onChange={(e) => setFormData({ ...formData, location: e.target.value } as any)}
          style={inputStyle}
          placeholder="e.g. New York, NY or Remote"
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>

      {/* Salary Min + Max */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={labelStyle}>Salary Min</label>
          <input
            type="number"
            value={(formData as any).salaryMin || ''}
            onChange={(e) =>
              setFormData({ ...formData, salaryMin: e.target.value ? parseInt(e.target.value) : undefined } as any)
            }
            style={inputStyle}
            placeholder="80000"
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </div>
        <div>
          <label style={labelStyle}>Salary Max</label>
          <input
            type="number"
            value={(formData as any).salaryMax || ''}
            onChange={(e) =>
              setFormData({ ...formData, salaryMax: e.target.value ? parseInt(e.target.value) : undefined } as any)
            }
            style={inputStyle}
            placeholder="120000"
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          {errors.salaryMax && <p style={errorStyle}>{errors.salaryMax}</p>}
        </div>
      </div>

      {/* Source */}
      <div>
        <label style={labelStyle}>Source</label>
        <input
          type="text"
          value={(formData as any).source || ''}
          onChange={(e) => setFormData({ ...formData, source: e.target.value } as any)}
          style={inputStyle}
          placeholder="LinkedIn, Referral, Company website..."
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>

      {/* Submit error */}
      {errors.submit && (
        <div
          style={{
            background: 'var(--danger-light)',
            border: '1px solid #fecaca',
            borderRadius: 'var(--radius-md)',
            padding: '10px 12px',
            fontSize: '13px',
            color: '#dc2626',
          }}
        >
          {errors.submit}
        </div>
      )}

      {/* Actions */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'flex-end',
          paddingTop: '4px',
        }}
      >
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              height: '36px',
              padding: '0 16px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              background: 'transparent',
              border: '1px solid var(--border-default)',
              cursor: 'pointer',
              transition: 'all 0.1s',
              fontFamily: 'inherit',
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
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{
            height: '36px',
            padding: '0 20px',
            background: loading ? 'var(--border-strong)' : 'var(--accent)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s',
            fontFamily: 'inherit',
          }}
          onMouseEnter={(e) => {
            if (!loading) e.currentTarget.style.background = 'var(--accent-hover)';
          }}
          onMouseLeave={(e) => {
            if (!loading) e.currentTarget.style.background = 'var(--accent)';
          }}
        >
          {loading ? 'Saving...' : 'Save Application'}
        </button>
      </div>
    </form>
  );
}
