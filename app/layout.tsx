import type { Metadata } from 'next';
import { ToastProvider } from '@/lib/context/toast-context';
import { ApplicationsProvider } from '@/lib/context/applications-context';
import './globals.css';

export const metadata: Metadata = {
  title: 'Job Application Tracker',
  description: 'Track your job applications with ease',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ApplicationsProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ApplicationsProvider>
      </body>
    </html>
  );
}
