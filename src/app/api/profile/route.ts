import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// Схема валидации для обновления профиля
const profileUpdateSchema = z.object({
  firstName: z.string().min(1, 'Имя обязательно для заполнения'),
  lastName: z.string().min(1, 'Фамилия обязательна для заполнения'),
  middleName: z.string().optional(),
  email: z
    .string()
    .min(1, 'Электронная почта обязательна для заполнения')
    .email('Введите корректный адрес электронной почты'),
  phone: z.string().min(1, 'Телефон обязателен для заполнения'),

  // Дата рождения
  birthDate: z
    .string()
    .refine(
      (val) => {
        if (!val || val.length === 0) return true;

        const date = new Date(val);
        const now = new Date();
        const minDate = new Date('1900-01-01');

        return !isNaN(date.getTime()) && date <= now && date >= minDate;
      },
      {
        message:
          'Дата рождения должна быть корректной, не ранее 1900 года и не в будущем',
      }
    )
    .optional()
    .nullable(),

  // Улучшенная валидация паспортных данных
  passportSeries: z
    .string()
    .refine((val) => !val || val.length === 0 || /^\d{4}$/.test(val), {
      message: 'Серия паспорта должна содержать 4 цифры',
    })
    .optional()
    .nullable(),
  passportNumber: z
    .string()
    .refine((val) => !val || val.length === 0 || /^\d{6}$/.test(val), {
      message: 'Номер паспорта должен содержать 6 цифр',
    })
    .optional()
    .nullable(),
  passportCode: z
    .string()
    .refine((val) => !val || val.length === 0 || /^\d{3}-\d{3}$/.test(val), {
      message: 'Код подразделения должен быть в формате XXX-XXX',
    })
    .optional()
    .nullable(),
  passportIssueDate: z
    .string()
    .refine(
      (val) => {
        if (!val || val.length === 0) return true;

        const date = new Date(val);
        const now = new Date();
        const minDate = new Date('1991-01-01'); // Минимальная дата - 1991 год (распад СССР)

        return !isNaN(date.getTime()) && date <= now && date >= minDate;
      },
      {
        message:
          'Дата выдачи паспорта должна быть не ранее 1991 года и не в будущем',
      }
    )
    .optional()
    .nullable(),
  passportIssuedBy: z
    .string()
    .min(5, 'Укажите полное название органа, выдавшего паспорт')
    .optional()
    .nullable(),

  // Поля для альтернативного документа
  useAlternativeDocument: z.boolean().default(false),
  alternativeDocument: z
    .string()
    .max(100, 'Максимальная длина - 100 символов')
    .optional()
    .nullable(),
});

export async function PUT(request: Request) {
  try {
    // Получаем текущего пользователя
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
    }

    // Получаем данные из запроса
    const body = await request.json();
    console.log('Полученные данные:', body);

    // Преобразуем пустые строки в null для корректной обработки
    Object.keys(body).forEach((key) => {
      if (typeof body[key] === 'string' && body[key].trim() === '') {
        body[key] = null;
      }
    });

    // Проверяем, используется ли альтернативный документ
    const useAlternativeDocument = body.useAlternativeDocument === true;

    // Если используется альтернативный документ, проверяем его наличие
    if (useAlternativeDocument) {
      if (!body.alternativeDocument) {
        return NextResponse.json(
          {
            message: 'Ошибка валидации',
            errors: [
              {
                message: 'Необходимо указать данные альтернативного документа',
              },
            ],
          },
          { status: 400 }
        );
      }

      // Если используется альтернативный документ, очищаем поля паспорта
      body.passportSeries = null;
      body.passportNumber = null;
      body.passportCode = null;
      body.passportIssueDate = null;
      body.passportIssuedBy = null;
    } else {
      // Проверяем, что если одно из паспортных полей заполнено, то должны быть заполнены все
      const hasAnyPassportField =
        body.passportSeries ||
        body.passportNumber ||
        body.passportCode ||
        body.passportIssueDate ||
        body.passportIssuedBy;

      const hasAllPassportFields =
        body.passportSeries &&
        body.passportNumber &&
        body.passportCode &&
        body.passportIssueDate &&
        body.passportIssuedBy;

      if (hasAnyPassportField && !hasAllPassportFields) {
        return NextResponse.json(
          {
            message: 'Ошибка валидации',
            errors: [
              { message: 'Все паспортные данные должны быть заполнены' },
            ],
          },
          { status: 400 }
        );
      }

      // Если не используется альтернативный документ, очищаем его поле
      body.alternativeDocument = null;
    }

    // Валидируем данные
    const validatedData = profileUpdateSchema.parse(body);
    console.log('Валидированные данные:', validatedData);

    // Преобразуем дату из строки в объект Date
    const updateData = {
      ...validatedData,
      passportIssueDate: validatedData.passportIssueDate
        ? new Date(validatedData.passportIssueDate)
        : null,
      birthDate: validatedData.birthDate
        ? new Date(validatedData.birthDate)
        : null,
    };

    // Обновляем данные пользователя
    const updatedUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: updateData,
      select: {
        firstName: true,
        lastName: true,
        middleName: true,
        email: true,
        phone: true,
        birthDate: true,
        passportSeries: true,
        passportNumber: true,
        passportCode: true,
        passportIssueDate: true,
        passportIssuedBy: true,
        useAlternativeDocument: true,
        alternativeDocument: true,
      },
    });

    console.log('Обновленные данные:', updatedUser);

    return NextResponse.json(
      {
        message: 'Профиль успешно обновлен',
        data: updatedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Ошибка при обновлении профиля:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Ошибка валидации', errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
