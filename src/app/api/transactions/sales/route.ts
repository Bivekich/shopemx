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

    // Получаем все предложения пользователя (независимо от статуса)
    const sales = await prisma.sellOffer.findMany({
      where: {
        sellerId: user.id,
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
        buyer: {
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
    const salesWithStringPrices = sales.map((sale) => ({
      ...sale,
      price: sale.price ? parseFloat(sale.price.toString()) : null,
    }));

    return NextResponse.json({
      sales: salesWithStringPrices,
    });
  } catch (error) {
    console.error('Ошибка при получении продаж:', error);
    return NextResponse.json(
      { message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
