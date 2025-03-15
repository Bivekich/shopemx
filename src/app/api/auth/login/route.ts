import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { comparePasswords, generateToken, setAuthCookie } from '@/lib/auth';
import { loginFormSchema } from '@/lib/validations';
import { normalizePhoneNumber } from '@/lib/validations';
import {
  createVerificationCode,
  sendEmailVerificationCode,
  sendSmsVerificationCode,
} from '@/lib/verification';
import { VerificationType } from '@/lib/types';

export async function POST(request: Request) {
  try {
    // Получаем данные из запроса
    const body = await request.json();

    // Валидируем данные
    const validatedData = loginFormSchema.parse(body);

    // Нормализуем номер телефона
    const normalizedPhone = normalizePhoneNumber(validatedData.phone);

    // Ищем пользователя по номеру телефона
    const user = await prisma.user.findUnique({
      where: {
        phone: normalizedPhone,
      },
    });

    // Если пользователь не найден, возвращаем ошибку
    if (!user) {
      return NextResponse.json(
        { message: 'Пользователь с таким номером телефона не найден' },
        { status: 404 }
      );
    }

    // Проверяем пароль
    const isPasswordValid = await comparePasswords(
      validatedData.password,
      user.password
    );

    // Если пароль неверный, возвращаем ошибку
    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Неверный пароль' }, { status: 401 });
    }

    // Сбрасываем флаг верификации пользователя, чтобы требовать верификацию при каждом входе
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        isVerified: false,
      },
    });

    // Генерируем токен и устанавливаем куки
    const token = generateToken(user.id);
    await setAuthCookie(token);

    // Создаем и отправляем коды верификации
    const emailVerificationCode = await createVerificationCode(
      user.id,
      VerificationType.EMAIL
    );

    const smsVerificationCode = await createVerificationCode(
      user.id,
      VerificationType.SMS
    );

    // Отправляем коды
    await Promise.all([
      sendEmailVerificationCode(
        user.email,
        emailVerificationCode.code,
        emailVerificationCode.id
      ),
      sendSmsVerificationCode(
        user.phone,
        smsVerificationCode.code,
        smsVerificationCode.id
      ),
    ]);

    // Перенаправляем на страницу верификации
    const verifyUrl = new URL(
      '/verify',
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    );

    return NextResponse.redirect(verifyUrl);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Ошибка валидации', errors: error.errors },
        { status: 400 }
      );
    }

    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
