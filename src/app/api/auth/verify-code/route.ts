import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { verifyCode } from '@/lib/verification';
import { VerificationType } from '@/lib/types';

// Схема для валидации запроса
const verifyCodeSchema = z.object({
  code: z.string().min(4).max(6),
  type: z.enum(['EMAIL', 'SMS']),
});

export async function POST(request: Request) {
  try {
    // Получаем текущего пользователя
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
    }

    // Получаем данные из запроса
    const body = await request.json();

    // Валидируем данные
    const validatedData = verifyCodeSchema.parse(body);

    // Преобразуем тип из запроса в enum VerificationType
    const verificationType =
      validatedData.type === 'EMAIL'
        ? VerificationType.EMAIL
        : VerificationType.SMS;

    // Проверяем код
    const isCodeValid = await verifyCode(
      user.id,
      validatedData.code,
      verificationType
    );

    if (!isCodeValid) {
      return NextResponse.json(
        { message: 'Неверный код подтверждения' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Код подтвержден успешно' },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Ошибка валидации', errors: error.errors },
        { status: 400 }
      );
    }

    console.error('Verify code error:', error);
    return NextResponse.json(
      { message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
