import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Получаем текущего пользователя
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: 'Пользователь не авторизован' },
        { status: 401 }
      );
    }

    // Получаем покупки пользователя
    const purchases = await prisma.sellOffer.findMany({
      where: {
        buyerId: user.id,
      },
      include: {
        artwork: {
          include: {
            author: {
              select: {
                firstName: true,
                lastName: true,
                middleName: true,
              },
            },
          },
        },
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Преобразуем Decimal в строку перед передачей клиенту
    const purchasesWithStringPrices = purchases.map((purchase) => ({
      ...purchase,
      price: purchase.price ? parseFloat(purchase.price.toString()) : null,
    }));

    return NextResponse.json({
      purchases: purchasesWithStringPrices,
    });
  } catch (error) {
    console.error('Ошибка при получении покупок:', error);
    return NextResponse.json(
      { message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
