import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// POST - одобрение заявки на подтверждение
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
    }

    // Проверяем, что пользователь является администратором
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Недостаточно прав для выполнения операции' },
        { status: 403 }
      );
    }

    const requestId = params.id;

    // Проверяем существование заявки
    const verificationRequest = await prisma.verificationRequest.findUnique({
      where: { id: requestId },
    });

    if (!verificationRequest) {
      return NextResponse.json(
        { message: 'Заявка не найдена' },
        { status: 404 }
      );
    }

    // Проверяем, что заявка находится в статусе "На рассмотрении"
    if (verificationRequest.status !== 'PENDING') {
      return NextResponse.json(
        { message: 'Заявка уже обработана' },
        { status: 400 }
      );
    }

    // Обновляем статус заявки на "Одобрена"
    await prisma.verificationRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        reviewedAt: new Date(),
        reviewedBy: user.id,
      },
    });

    // Обновляем статус пользователя на "Подтвержден"
    await prisma.user.update({
      where: { id: verificationRequest.userId },
      data: {
        isVerified: true,
      },
    });

    return NextResponse.json(
      { message: 'Заявка успешно одобрена' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Ошибка при одобрении заявки:', error);
    return NextResponse.json(
      { message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
