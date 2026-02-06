import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// POST /api/share/create - Создать публичную ссылку на проект
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request.headers.get('authorization'));
    
    const body = await request.json();
    const { projectId, data } = body;

    if (!data) {
      return NextResponse.json(
        { error: 'Project data is required' },
        { status: 400 }
      );
    }

    // Если projectId указан, проверяем доступ к проекту
    if (projectId && auth) {
      const access = await prisma.projectCollaborator.findFirst({
        where: {
          projectId,
          userId: auth.userId,
        },
      });

      if (!access) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
    }

    // Создаём публичную ссылку
    const sharedProject = await prisma.sharedProject.create({
      data: {
        projectId: projectId || null,
        data,
        expiresAt: null, // Можно добавить срок действия
      },
    });

    // Определяем базовый URL из заголовков запроса
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const baseUrl = `${protocol}://${host}`;

    return NextResponse.json({
      shareId: sharedProject.id,
      shareUrl: `${baseUrl}/preview?id=${sharedProject.id}`,
    });
  } catch (error) {
    console.error('Create share link error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
