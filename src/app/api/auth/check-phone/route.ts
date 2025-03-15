import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { phoneSchema, normalizePhoneNumber } from '@/lib/validations';

// Схема для валидации запроса
const checkPhoneSchema = z.object({
  phone: phoneSchema,
});

export async function POST(request: Request) {
  try {
    // Получаем данные из запроса
    const body = await request.json();

    // Валидируем данные
    const validatedData = checkPhoneSchema.parse(body);

    // Нормализуем номер телефона
    const normalizedPhone = normalizePhoneNumber(validatedData.phone);

    // Ищем пользователя по номеру телефона
    const user = await prisma.user.findUnique({
      where: {
        phone: normalizedPhone,
      },
      select: {
        id: true, // Возвращаем только ID для безопасности
      },
    });

    // Если пользователь не найден, возвращаем ошибку
    if (!user) {
      return NextResponse.json(
        { message: 'Пользователь с таким номером телефона не найден' },
        { status: 404 }
      );
    }

    // Пользователь найден, возвращаем успешный ответ
    return NextResponse.json(
      { message: 'Пользователь найден' },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Ошибка валидации', errors: error.errors },
        { status: 400 }
      );
    }

    console.error('Check phone error:', error);
    return NextResponse.json(
      { message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
