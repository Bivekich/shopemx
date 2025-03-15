import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';

// Схема валидации для запроса
const rejectRequestSchema = z.object({
  reason: z.string().min(5, 'Укажите причину отклонения (минимум 5 символов)'),
});

// POST - отклонение заявки на подтверждение
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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

    const requestId = (await params).id;

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

    // Получаем и валидируем данные из запроса
    const body = await request.json();

    try {
      const { reason } = rejectRequestSchema.parse(body);

      // Обновляем статус заявки на "Отклонена"
      await prisma.verificationRequest.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          reviewedAt: new Date(),
          reviewedBy: user.id,
          rejectionReason: reason,
        },
      });

      return NextResponse.json(
        { message: 'Заявка отклонена' },
        { status: 200 }
      );
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          {
            message: 'Ошибка валидации',
            errors: validationError.errors,
          },
          { status: 400 }
        );
      }
      throw validationError;
    }
  } catch (error) {
    console.error('Ошибка при отклонении заявки:', error);
    return NextResponse.json(
      { message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
