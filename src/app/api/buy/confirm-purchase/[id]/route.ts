import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Проверяем авторизацию пользователя
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
    }

    // Проверяем верификацию пользователя
    if (!user.isVerified) {
      return NextResponse.json(
        { message: 'Необходимо пройти верификацию' },
        { status: 403 }
      );
    }

    // Получаем данные о предложении продажи
    const { id } = await context.params;

    const sellOffer = await prisma.sellOffer.findUnique({
      where: {
        id: id,
      },
      include: {
        artwork: {
          include: {
            author: true,
          },
        },
      },
    });

    // Проверяем, существует ли предложение
    if (!sellOffer) {
      return NextResponse.json(
        { message: 'Предложение не найдено' },
        { status: 404 }
      );
    }

    // Проверяем, что пользователь является покупателем
    if (sellOffer.buyerId !== user.id) {
      return NextResponse.json(
        { message: 'У вас нет прав для подтверждения этой покупки' },
        { status: 403 }
      );
    }

    // Проверяем, что предложение находится в статусе ACCEPTED
    if (sellOffer.status !== 'ACCEPTED') {
      return NextResponse.json(
        { message: 'Данное предложение не может быть подтверждено' },
        { status: 400 }
      );
    }

    // Получаем код подтверждения из запроса
    const { confirmationCode } = await request.json();

    // Проверяем код подтверждения
    if (sellOffer.confirmationCode !== confirmationCode) {
      return NextResponse.json(
        { message: 'Неверный код подтверждения' },
        { status: 400 }
      );
    }

    // Обновляем статус предложения на COMPLETED и сохраняем путь к договору
    await prisma.sellOffer.update({
      where: {
        id: id,
      },
      data: {
        status: 'ACCEPTED',
      },
    });

    // Возвращаем успешный ответ с путем к договору
    return NextResponse.json({
      message: 'Покупка успешно подтверждена',
    });
  } catch (error) {
    console.error('Ошибка при подтверждении покупки:', error);
    return NextResponse.json(
      { message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
