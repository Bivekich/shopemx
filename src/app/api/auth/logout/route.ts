import { NextResponse } from 'next/server';
import { getCurrentUser, removeAuthCookie } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    // Получаем текущего пользователя
    const user = await getCurrentUser();

    // Если пользователь не авторизован, просто перенаправляем на главную
    if (!user) {
      return NextResponse.redirect(
        new URL('/', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      );
    }

    // Сбрасываем флаг верификации пользователя
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        isVerified: false,
      },
    });

    // Удаляем куки авторизации
    await removeAuthCookie();

    // Перенаправляем на страницу входа
    return NextResponse.redirect(
      new URL('/', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { message: 'Ошибка при выходе из аккаунта' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Получаем текущего пользователя
  const user = await getCurrentUser();

  // Если пользователь авторизован, сбрасываем флаг верификации
  if (user) {
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        isVerified: false,
      },
    });
  }

  // Удаляем куки авторизации
  await removeAuthCookie();

  // Перенаправляем на страницу входа
  return NextResponse.redirect(
    new URL('/', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
  );
}
