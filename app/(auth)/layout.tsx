export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen flex items-center justify-center py-12 px-4"
      style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #e8edf5 100%)' }}
    >
      <div
        className="w-full"
        style={{ maxWidth: '400px' }}
      >
        {/* Card */}
        <div
          style={{
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-lg)',
            padding: '40px',
            border: '1px solid var(--border-default)',
          }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: '16px',
                letterSpacing: '-0.5px',
                marginBottom: '12px',
              }}
            >
              JT
            </div>
            <h1
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.3px',
                margin: 0,
              }}
            >
              Job Tracker
            </h1>
            <p
              style={{
                fontSize: '13px',
                color: 'var(--text-tertiary)',
                marginTop: '4px',
              }}
            >
              Track your job search journey
            </p>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
