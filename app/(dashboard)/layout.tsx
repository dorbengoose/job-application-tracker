'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  const navLinks = [
    {
      href: '/board',
      label: 'Board',
      icon: (
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="1" width="5.5" height="13" rx="1" fill="currentColor" opacity="0.9"/>
          <rect x="8.5" y="1" width="5.5" height="7" rx="1" fill="currentColor" opacity="0.9"/>
          <rect x="8.5" y="10" width="5.5" height="4" rx="1" fill="currentColor" opacity="0.9"/>
        </svg>
      ),
    },
    {
      href: '/dashboard',
      label: 'Analytics',
      icon: (
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 11L5 7L8 10L14 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      {/* Top Nav */}
      <nav
        style={{
          height: '56px',
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-default)',
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}
      >
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '0 24px',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Left: Logo + Nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '12px',
                  letterSpacing: '-0.3px',
                  flexShrink: 0,
                }}
              >
                JT
              </div>
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.2px',
                }}
              >
                Job Tracker
              </span>
            </div>

            {/* Divider */}
            <div
              style={{
                width: '1px',
                height: '20px',
                background: 'var(--border-default)',
              }}
            />

            {/* Nav Links */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              {navLinks.map((link) => {
                const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                      background: isActive ? 'var(--bg-muted)' : 'transparent',
                      textDecoration: 'none',
                      transition: 'color 0.1s, background 0.1s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = 'var(--text-primary)';
                        e.currentTarget.style.background = 'var(--bg-subtle)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = 'var(--text-secondary)';
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <span style={{ opacity: isActive ? 1 : 0.7 }}>{link.icon}</span>
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right: Sign out */}
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              background: 'transparent',
              border: '1px solid var(--border-default)',
              cursor: 'pointer',
              transition: 'color 0.1s, background 0.1s, border-color 0.1s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.background = 'var(--bg-muted)';
              e.currentTarget.style.borderColor = 'var(--border-strong)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'var(--border-default)';
            }}
          >
            <svg width="13" height="13" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 1h6a1 1 0 011 1v2h-1V2H3v11h6v-2h1v2a1 1 0 01-1 1H3a1 1 0 01-1-1V2a1 1 0 011-1z" fill="currentColor"/>
              <path d="M10.5 5l2.5 2.5-2.5 2.5M13 7.5H6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Sign out
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '24px',
        }}
      >
        {children}
      </main>
    </div>
  );
}
