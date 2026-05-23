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
