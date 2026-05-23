import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { NextResponse, NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(token);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify app ownership
    const app = await prisma.jobApplication.findUnique({
      where: { id: params.id }
    });
    if (!app || app.userId !== session.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const notes = await prisma.note.findMany({
      where: { applicationId: params.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ data: notes });
  } catch (error) {
    console.error('[Notes GET Error]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(token);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content } = await request.json();

    if (!content || typeof content !== 'string' || content.length > 5000) {
      return NextResponse.json(
        { error: 'Content is required and max 5000 chars' },
        { status: 422 }
      );
    }

    // Verify app ownership
    const app = await prisma.jobApplication.findUnique({
      where: { id: params.id }
    });
    if (!app || app.userId !== session.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const note = await prisma.note.create({
      data: {
        applicationId: params.id,
        userId: session.userId,
        content
      }
    });

    return NextResponse.json({ data: note }, { status: 201 });
  } catch (error) {
    console.error('[Notes POST Error]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
