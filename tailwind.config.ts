import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a'
        },
        stage: {
          applied: '#6366f1',
          phone: '#8b5cf6',
          interview: '#f59e0b',
          offer: '#10b981',
          rejected: '#f43f5e'
        },
        accent: 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        'bg-app': 'var(--bg-app)',
        'bg-surface': 'var(--bg-surface)',
        'bg-subtle': 'var(--bg-subtle)',
        'bg-muted': 'var(--bg-muted)',
        'border-default': 'var(--border-default)',
        'border-strong': 'var(--border-strong)',
        'border-focus': 'var(--border-focus)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif']
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        full: 'var(--radius-full)',
      },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
      fontSize: {
        '11': ['11px', { lineHeight: '1.4' }],
        '12': ['12px', { lineHeight: '1.4' }],
        '13': ['13px', { lineHeight: '1.5' }],
        '14': ['14px', { lineHeight: '1.5' }],
        '16': ['16px', { lineHeight: '1.4' }],
        '20': ['20px', { lineHeight: '1.3' }],
      }
    }
  },
  plugins: []
};

export default config;
