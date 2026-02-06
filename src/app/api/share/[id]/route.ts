import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/share/:id - Получить проект по публичной ссылке
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const shareId = params.id;

    const sharedProject = await prisma.sharedProject.findUnique({
      where: { id: shareId },
    });

    if (!sharedProject) {
      return NextResponse.json(
        { error: 'Shared project not found' },
        { status: 404 }
      );
    }

    // Проверяем срок действия
    if (sharedProject.expiresAt && sharedProject.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Share link expired' },
        { status: 410 }
      );
    }

    return NextResponse.json({
      project: sharedProject.data,
    });
  } catch (error) {
    console.error('Get shared project error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
