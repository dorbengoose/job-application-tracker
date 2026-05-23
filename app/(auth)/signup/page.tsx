'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName })
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Signup failed');
        return;
      }

      router.push('/board');
    } catch (err) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
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
  } as React.CSSProperties;

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    marginBottom: '6px',
  } as React.CSSProperties;

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = 'var(--border-focus)';
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,112,243,0.15)';
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = 'var(--border-default)';
    e.currentTarget.style.boxShadow = 'none';
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h2
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '4px',
          }}
        >
          Create an account
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
          Start tracking your job applications today.
        </p>
      </div>

      <div>
        <label style={labelStyle}>Full name</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          style={inputStyle}
          placeholder="Jane Doe"
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>

      <div>
        <label style={labelStyle}>Email address</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
          placeholder="you@example.com"
          required
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>

      <div>
        <label style={labelStyle}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
          placeholder="At least 8 characters"
          required
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>

      <div>
        <label style={labelStyle}>Confirm password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={inputStyle}
          required
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>

      {error && (
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
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          width: '100%',
          height: '40px',
          background: loading ? 'var(--border-strong)' : 'var(--accent)',
          color: '#ffffff',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          fontSize: '14px',
          fontWeight: 500,
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => {
          if (!loading) e.currentTarget.style.background = 'var(--accent-hover)';
        }}
        onMouseLeave={(e) => {
          if (!loading) e.currentTarget.style.background = 'var(--accent)';
        }}
      >
        {loading ? 'Creating account...' : 'Create account'}
      </button>

      <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-tertiary)' }}>
        Already have an account?{' '}
        <Link
          href="/login"
          style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
