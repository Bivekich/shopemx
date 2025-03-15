import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET - получение списка заявок на подтверждение
export async function GET() {
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

    // Получаем все заявки, отсортированные по дате создания (сначала новые)
    // и включаем информацию о пользователе
    const requests = await prisma.verificationRequest.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            email: true,
            phone: true,
            birthDate: true,
            passportSeries: true,
            passportNumber: true,
            passportCode: true,
            passportIssueDate: true,
            passportIssuedBy: true,
            useAlternativeDocument: true,
            alternativeDocument: true,
            bankName: true,
            bankBik: true,
            bankAccount: true,
            bankCorAccount: true,
          },
        },
      },
    });

    return NextResponse.json({ requests }, { status: 200 });
  } catch (error) {
    console.error('Ошибка при получении заявок на подтверждение:', error);
    return NextResponse.json(
      { message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
