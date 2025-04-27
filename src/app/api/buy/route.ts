import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendSms } from '@/lib/sms';

export async function POST(request: Request) {
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

    // Получаем данные запроса
    const { sellOfferId, buyerId } = await request.json();

    if (!sellOfferId || !buyerId) {
      return NextResponse.json(
        { message: 'Не указаны необходимые параметры' },
        { status: 400 }
      );
    }

    // Проверяем, что пользователь совершает покупку своим аккаунтом
    if (user.id !== buyerId) {
      return NextResponse.json(
        { message: 'Недостаточно прав для совершения данной операции' },
        { status: 403 }
      );
    }

    // Получаем данные о предложении продажи
    const sellOffer = await prisma.sellOffer.findUnique({
      where: {
        id: sellOfferId,
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

    // Проверяем, что предложение активно и доступно для покупки
    if (sellOffer.status !== 'ACTIVE') {
      return NextResponse.json(
        { message: 'Данное предложение недоступно для покупки' },
        { status: 400 }
      );
    }

    // Проверяем, что пользователь не покупает свое собственное произведение
    if (sellOffer.sellerId === buyerId) {
      return NextResponse.json(
        { message: 'Вы не можете купить свое собственное произведение' },
        { status: 400 }
      );
    }

    // Генерируем код подтверждения для продавца
    const confirmationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const confirmationExpires = new Date();
    confirmationExpires.setHours(confirmationExpires.getHours() + 24); // Код действителен 24 часа

    // Обновляем статус предложения и добавляем покупателя
    await prisma.sellOffer.update({
      where: {
        id: sellOfferId,
      },
      data: {
        status: 'ACCEPTED',
        buyerId,
        confirmationCode,
        confirmationExpires,
      },
    });

    // Получаем данные продавца
    const seller = await prisma.user.findUnique({
      where: {
        id: sellOffer.sellerId,
      },
      select: {
        phone: true,
        email: true,
        firstName: true,
      },
    });

    if (seller && seller.phone) {
      try {
        // Отправляем SMS с кодом подтверждения продавцу
        await sendSms(
          seller.phone,
          `Код подтверждения продажи: ${confirmationCode}. ShopEMX.`
        );
      } catch (error) {
        console.error('Ошибка при отправке SMS:', error);
        // Продолжаем выполнение, даже если SMS не отправлено
        // В реальном проекте здесь можно добавить логику для повторной отправки или уведомления администратора
      }
    }

    // Возвращаем успешный ответ
    return NextResponse.json({
      message: 'Покупка успешно совершена',
      offerId: sellOffer.id,
    });
  } catch (error) {
    console.error('Ошибка при покупке произведения:', error);
    return NextResponse.json(
      { message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
