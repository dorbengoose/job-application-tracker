import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { UpdateApplicationSchema } from '@/lib/validation/application-schemas';
import { handleApiError } from '@/lib/api/error-handler';
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

    const app = await prisma.jobApplication.findUnique({
      where: { id: params.id }
    });

    if (!app || app.userId !== session.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ data: app });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
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

    // Check ownership
    const existing = await prisma.jobApplication.findUnique({
      where: { id: params.id }
    });

    if (!existing || existing.userId !== session.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const body = await request.json();
    const validated = UpdateApplicationSchema.parse(body);

    // Track stage changes
    const updateData: any = { ...validated };
    if (validated.appliedDate) {
      updateData.appliedDate = new Date(validated.appliedDate);
    }

    const updated = await prisma.jobApplication.update({
      where: { id: params.id },
      data: updateData
    });

    // Create stage change event
    if (validated.stage && existing.stage !== validated.stage) {
      await prisma.applicationEvent.create({
        data: {
          applicationId: params.id,
          eventType: 'STAGE_CHANGED',
          oldValue: existing.stage,
          newValue: validated.stage
        }
      });
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
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

    const existing = await prisma.jobApplication.findUnique({
      where: { id: params.id }
    });

    if (!existing || existing.userId !== session.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Soft delete
    await prisma.jobApplication.update({
      where: { id: params.id },
      data: { deletedAt: new Date() }
    });

    return NextResponse.json({ message: 'Application deleted' });
  } catch (error) {
    return handleApiError(error);
  }
}
