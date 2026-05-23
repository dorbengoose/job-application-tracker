import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { CreateApplicationSchema } from '@/lib/validation/application-schemas';
import { handleApiError } from '@/lib/api/error-handler';
import { NextResponse, NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(token);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apps = await prisma.jobApplication.findMany({
      where: { userId: session.userId, deletedAt: null },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ data: apps, count: apps.length });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(token);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = CreateApplicationSchema.parse(body);

    const app = await prisma.jobApplication.create({
      data: {
        userId: session.userId,
        company: validated.company,
        role: validated.role,
        stage: validated.stage,
        priority: validated.priority,
        appliedDate: new Date(validated.appliedDate),
        jobUrl: validated.jobUrl || null,
        location: validated.location || null,
        salaryMin: validated.salaryMin || null,
        salaryMax: validated.salaryMax || null,
        source: validated.source || null
      }
    });

    // Create creation event
    await prisma.applicationEvent.create({
      data: {
        applicationId: app.id,
        eventType: 'CREATED',
        newValue: app.stage
      }
    });

    return NextResponse.json({ data: app }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
