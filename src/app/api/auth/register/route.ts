import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateToken, setAuthCookie } from '@/lib/auth';
import { registerFormSchema } from '@/lib/validations';
import { normalizePhoneNumber } from '@/lib/validations';
import { VerificationType } from '@/lib/types';
import {
  createVerificationCode,
  sendEmailVerificationCode,
  sendSmsVerificationCode,
  sendLoginNotification,
} from '@/lib/verification';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  try {
    // Получаем данные из запроса
    const body = await request.json();

    // Валидируем данные
    const validatedData = registerFormSchema.parse(body);

    // Нормализуем номер телефона
    const normalizedPhone = normalizePhoneNumber(validatedData.phone);

    // Проверяем, существует ли пользователь с таким номером телефона
    const existingUserByPhone = await prisma.user.findUnique({
      where: {
        phone: normalizedPhone,
      },
    });

    if (existingUserByPhone) {
      return NextResponse.json(
        {
          message: 'Пользователь с таким номером телефона уже существует',
          field: 'phone',
        },
        { status: 409 }
      );
    }

    // Проверяем, существует ли пользователь с таким email
    const existingUserByEmail = await prisma.user.findUnique({
      where: {
        email: validatedData.email,
      },
    });

    if (existingUserByEmail) {
      return NextResponse.json(
        {
          message: 'Пользователь с таким email уже существует',
          field: 'email',
        },
        { status: 409 }
      );
    }

    // Хешируем пароль
    const hashedPassword = await hashPassword(validatedData.password);

    // Создаем пользователя
    const user = await prisma.user.create({
      data: {
        phone: normalizedPhone,
        email: validatedData.email,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        middleName: validatedData.middleName,
        password: hashedPassword,
      },
    });

    // Генерируем токен и устанавливаем куки
    const token = generateToken(user.id);
    setAuthCookie(token);

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

    // Получаем информацию о запросе для уведомления
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || 'Не определен';
    const userAgent = headersList.get('user-agent') || 'Не определен';
    const time = new Date().toLocaleString('ru-RU', {
      timeZone: 'Europe/Moscow',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    // Отправляем уведомление о входе в аккаунт
    sendLoginNotification(user.email, {
      firstName: user.firstName,
      lastName: user.lastName,
      ip,
      userAgent,
      time,
    }).catch((error) => {
      console.error('Ошибка при отправке уведомления о входе:', error);
    });

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

    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
