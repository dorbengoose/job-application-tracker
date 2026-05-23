# Spec 03 — Local Authentication System (bcryptjs + Sessions)

## Preconditions
- spec-01 complete
- spec-02 complete (Prisma schema with User and Session models)

## Goal
Implement local session-based authentication using bcryptjs for password hashing and
JWT/session tokens stored in SQLite. Build sign-up, sign-in, sign-out flows.

## Critical Files to Create

### Backend
- `lib/auth.ts` (password hashing, session creation, validation)
- `middleware.ts` (session verification)
- `app/api/auth/signup/route.ts`
- `app/api/auth/login/route.ts`
- `app/api/auth/logout/route.ts`

### Frontend
- `app/(auth)/layout.tsx`
- `app/(auth)/login/page.tsx`
- `app/(auth)/signup/page.tsx`
- `app/(dashboard)/layout.tsx` (with user menu)
- `components/auth/login-form.tsx`
- `components/auth/signup-form.tsx`
- `components/ui/button.tsx`
- `components/ui/input.tsx`
- `components/ui/label.tsx`

## lib/auth.ts

```typescript
// lib/auth.ts
import { hash, compare } from 'bcryptjs';
import { randomBytes } from 'crypto';
import { prisma } from './prisma';

const SALT_ROUNDS = 10;
const TOKEN_EXPIRY_DAYS = 30;

// Hash password with bcryptjs
export async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS);
}

// Verify password against hash
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return compare(password, hash);
}

// Create a session token
export function generateToken(): string {
  return randomBytes(32).toString('hex');
}

// Create session in database
export async function createSession(userId: string): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRY_DAYS);

  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt
    }
  });

  return token;
}

// Get session and verify not expired
export async function getSession(token: string) {
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true }
  });

  if (!session) return null;
  if (new Date() > session.expiresAt) {
    // Session expired, delete it
    await prisma.session.delete({ where: { token } });
    return null;
  }

  return session;
}

// Delete session
export async function deleteSession(token: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { token }
  });
}

// Get user from session cookie
export async function getUserFromSession(request: Request): Promise<any | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.substring(7);
  const session = await getSession(token);
  return session?.user || null;
}
```

## middleware.ts

```typescript
// middleware.ts
import { type NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

// Public routes (no auth required)
const publicRoutes = ['/login', '/signup', '/'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Check for session token in cookie
  const token = request.cookies.get('session')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verify session is valid
  const session = await getSession(token);
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Session valid, proceed
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', session.userId);
  requestHeaders.set('x-user-email', session.user.email);

  return NextResponse.next({
    request: {
      headers: requestHeaders
    }
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']
};
```

## API Routes

### POST /api/auth/signup

```typescript
// app/api/auth/signup/route.ts
import { prisma } from '@/lib/prisma';
import { hashPassword, createSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password, fullName } = await request.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 422 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 422 }
      );
    }

    // Check if user exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName
      }
    });

    // Create session
    const token = await createSession(user.id);

    // Set session cookie
    const response = NextResponse.json(
      { message: 'Account created', user: { id: user.id, email: user.email } },
      { status: 201 }
    );

    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    });

    return response;
  } catch (error) {
    console.error('[Signup Error]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### POST /api/auth/login

```typescript
// app/api/auth/login/route.ts
import { prisma } from '@/lib/prisma';
import { verifyPassword, createSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 422 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create session
    const token = await createSession(user.id);

    // Set session cookie
    const response = NextResponse.json(
      { user: { id: user.id, email: user.email } },
      { status: 200 }
    );

    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30
    });

    return response;
  } catch (error) {
    console.error('[Login Error]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### POST /api/auth/logout

```typescript
// app/api/auth/logout/route.ts
import { deleteSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const token = request.cookies.get('session')?.value;

  if (token) {
    await deleteSession(token);
  }

  const response = NextResponse.json({ message: 'Logged out' });
  response.cookies.delete('session');
  return response;
}
```

## Frontend Components

### LoginForm

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Login failed');
        return;
      }

      router.push('/board');
    } catch (err) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          required
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Logging in...' : 'Log In'}
      </button>
    </form>
  );
}
```

### SignupForm

```typescript
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function SignupForm() {
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
      <div>
        <label className="block text-sm font-medium mb-1">Full Name</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Confirm Password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          required
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Creating account...' : 'Sign Up'}
      </button>
      <p className="text-sm text-center">
        Already have an account? <Link href="/login" className="text-blue-600 hover:underline">Log in</Link>
      </p>
    </form>
  );
}
```

## Acceptance Tests
- ✅ POST /api/auth/signup creates user in SQLite
- ✅ POST /api/auth/login verifies password hash
- ✅ Session cookie set after signup/login
- ✅ Session expires after 30 days
- ✅ Middleware blocks unauthenticated access to /dashboard
- ✅ Logout deletes session from database
- ✅ Password mismatch error shown before API call

## Definition of Done
- [ ] `lib/auth.ts` with password hashing and session logic
- [ ] Middleware protecting dashboard routes
- [ ] All three auth API routes functional
- [ ] LoginForm and SignupForm components created
- [ ] Session cookie set with httpOnly flag
- [ ] Password validation (min 8 chars)
- [ ] Duplicate email detection
- [ ] TypeScript: zero errors
