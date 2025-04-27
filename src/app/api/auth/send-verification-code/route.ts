import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  createVerificationCode,
  sendEmailVerificationCode,
  sendSmsVerificationCode,
  canResendCode,
} from '@/lib/verification';
import { VerificationType } from '@/lib/types';

// Схема для валидации запроса
const verificationCodeSchema = z.object({
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
    const validatedData = verificationCodeSchema.parse(body);

    // Преобразуем тип из запроса в enum VerificationType
    const verificationType =
      validatedData.type === 'EMAIL'
        ? VerificationType.EMAIL
        : VerificationType.SMS;

    // Получаем последний код верификации
    const lastVerificationCode = await prisma.verificationCode.findFirst({
      where: {
        userId: user.id,
        type: verificationType,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Проверяем, можно ли отправить код повторно
    if (lastVerificationCode) {
      const canResend = await canResendCode(lastVerificationCode.id);

      if (!canResend) {
        return NextResponse.json(
          {
            message:
              'Слишком много попыток отправки кода. Пожалуйста, подождите.',
          },
          { status: 429 }
        );
      }
    }

    // Создаем новый код верификации
    const verificationCode = await createVerificationCode(
      user.id,
      verificationType
    );

    // Отправляем код
    let success = false;

    if (validatedData.type === 'EMAIL') {
      success = await sendEmailVerificationCode(
        user.email,
        verificationCode.code,
        verificationCode.id
      );
    } else {
      success = await sendSmsVerificationCode(
        user.phone,
        verificationCode.code,
        verificationCode.id
      );
    }

    if (!success) {
      return NextResponse.json(
        { message: 'Не удалось отправить код' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Код отправлен успешно' },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Ошибка валидации', errors: error.errors },
        { status: 400 }
      );
    }

    console.error('Send verification code error:', error);
    return NextResponse.json(
      { message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
