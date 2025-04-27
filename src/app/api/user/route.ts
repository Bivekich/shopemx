import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

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

    // Возвращаем базовую информацию о пользователе
    return NextResponse.json({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        middleName: user.middleName,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Ошибка при получении данных пользователя:', error);
    return NextResponse.json(
      { message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
