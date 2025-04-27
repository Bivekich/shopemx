import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { compare } from 'bcrypt';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    // Получаем текущего пользователя
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
    }

    // Получаем пароль из запроса
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { message: 'Пароль обязателен' },
        { status: 400 }
      );
    }

    // Получаем хеш пароля из базы данных
    const dbUser = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
      select: {
        password: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json(
        { message: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Сравниваем пароли
    const passwordMatch = await compare(password, dbUser.password);

    if (!passwordMatch) {
      return NextResponse.json({ message: 'Неверный пароль' }, { status: 400 });
    }

    // Возвращаем успешный результат
    return NextResponse.json({
      message: 'Пароль подтвержден',
    });
  } catch (error) {
    console.error('Ошибка при проверке пароля:', error);
    return NextResponse.json(
      { message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
