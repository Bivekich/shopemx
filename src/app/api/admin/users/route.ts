import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET - получение списка пользователей
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

    // Получаем всех пользователей, отсортированных по дате создания (сначала новые)
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        middleName: true,
        email: true,
        phone: true,
        role: true,
        isVerified: true,
        createdAt: true,
        birthDate: true,
        // Паспортные данные
        passportSeries: true,
        passportNumber: true,
        passportCode: true,
        passportIssueDate: true,
        passportIssuedBy: true,
        // Альтернативный документ
        useAlternativeDocument: true,
        alternativeDocument: true,
        // Банковские данные
        bankName: true,
        bankBik: true,
        bankAccount: true,
        bankCorAccount: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error('Ошибка при получении списка пользователей:', error);
    return NextResponse.json(
      { message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
