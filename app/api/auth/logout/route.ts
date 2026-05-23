import { deleteSession } from '@/lib/auth';
import { NextResponse, NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const token = request.cookies.get('session')?.value;

  if (token) {
    await deleteSession(token);
  }

  const response = NextResponse.json({ message: 'Logged out' });
  response.cookies.delete('session');
  return response;
}
