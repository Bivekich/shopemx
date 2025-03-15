import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

const bankDetailsSchema = z.object({
  bankName: z
    .string()
    .min(2, 'Название банка должно содержать не менее 2 символов')
    .max(100, 'Название банка не должно превышать 100 символов')
    .optional()
    .nullable(),
  bankBik: z
    .string()
    .refine((val) => !val || val.length === 0 || /^\d{9}$/.test(val), {
      message: 'БИК должен содержать 9 цифр',
    })
    .optional()
    .nullable(),
  bankAccount: z
    .string()
    .refine((val) => !val || val.length === 0 || /^\d{20}$/.test(val), {
      message: 'Расчетный счет должен содержать 20 цифр',
    })
    .optional()
    .nullable(),
  bankCorAccount: z
    .string()
    .refine((val) => !val || val.length === 0 || /^\d{20}$/.test(val), {
      message: 'Корреспондентский счет должен содержать 20 цифр',
    })
    .optional()
    .nullable(),
});

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Полученные банковские данные:', body);

    // Проверяем, что если одно из банковских полей заполнено, то должны быть заполнены все необходимые
    const hasAnyBankField = body.bankName || body.bankBik || body.bankAccount;

    const hasAllRequiredBankFields =
      body.bankName && body.bankBik && body.bankAccount;

    if (hasAnyBankField && !hasAllRequiredBankFields) {
      return NextResponse.json(
        {
          message: 'Ошибка валидации',
          errors: [
            {
              message:
                'Все банковские реквизиты должны быть заполнены (название банка, БИК и расчетный счет)',
            },
          ],
        },
        { status: 400 }
      );
    }

    const validatedData = bankDetailsSchema.parse(body);
    console.log('Валидированные банковские данные:', validatedData);

    // Фильтруем null и undefined значения
    const updateData = Object.fromEntries(
      Object.entries(validatedData).filter(([, value]) => value !== undefined)
    );

    console.log('Данные для обновления:', updateData);

    const updatedUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: updateData,
      select: {
        bankName: true,
        bankBik: true,
        bankAccount: true,
        bankCorAccount: true,
      },
    });

    console.log('Обновленные банковские данные:', updatedUser);

    return NextResponse.json(
      {
        message: 'Банковские реквизиты успешно обновлены',
        data: updatedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Ошибка при обновлении банковских реквизитов:', error);

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
