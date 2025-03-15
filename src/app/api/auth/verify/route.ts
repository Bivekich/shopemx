import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { verificationFormSchema } from '@/lib/validations';
import { verifyCode, sendLoginNotification } from '@/lib/verification';
import { VerificationType } from '@/lib/types';

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
    const validatedData = verificationFormSchema.parse(body);

    // Проверяем коды верификации
    const [isSmsCodeValid, isEmailCodeValid] = await Promise.all([
      verifyCode(user.id, validatedData.smsCode, VerificationType.SMS),
      verifyCode(user.id, validatedData.emailCode, VerificationType.EMAIL),
    ]);

    if (!isSmsCodeValid) {
      return NextResponse.json(
        { message: 'Неверный код из SMS', field: 'smsCode' },
        { status: 400 }
      );
    }

    if (!isEmailCodeValid) {
      return NextResponse.json(
        { message: 'Неверный код из Email', field: 'emailCode' },
        { status: 400 }
      );
    }

    // Получаем заголовки запроса
    const ip = request.headers.get('x-forwarded-for') || 'Не определен';
    const userAgent = request.headers.get('user-agent') || 'Не определен';

    // Обновляем статус верификации и информацию о входе
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        lastLoginIp: ip,
        lastLoginUserAgent: userAgent,
        lastLoginAttempt: new Date(),
      },
    });

    // Отправляем уведомление о входе
    const time = new Date().toLocaleString('ru-RU', {
      timeZone: 'Europe/Moscow',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    await sendLoginNotification(user.email, {
      firstName: user.firstName,
      lastName: user.lastName,
      ip,
      userAgent,
      time,
    });

    return NextResponse.json(
      { message: 'Верификация выполнена успешно' },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Ошибка валидации', errors: error.errors },
        { status: 400 }
      );
    }

    console.error('Verification error:', error);
    return NextResponse.json(
      { message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
