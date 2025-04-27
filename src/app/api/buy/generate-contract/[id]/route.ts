import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Проверяем авторизацию пользователя
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
    }

    // Проверяем верификацию пользователя
    if (!user.isVerified) {
      return NextResponse.json(
        { message: 'Необходимо пройти верификацию' },
        { status: 403 }
      );
    }

    // Получаем данные о предложении продажи
    const { id } = await context.params;

    const sellOffer = await prisma.sellOffer.findUnique({
      where: {
        id: id,
      },
      include: {
        artwork: {
          include: {
            author: true,
          },
        },
      },
    });

    // Проверяем, существует ли предложение
    if (!sellOffer) {
      return NextResponse.json(
        { message: 'Предложение не найдено' },
        { status: 404 }
      );
    }

    // Проверяем, что пользователь является покупателем или продавцом
    if (sellOffer.sellerId !== user.id && sellOffer.buyerId !== user.id) {
      return NextResponse.json(
        { message: 'У вас нет прав для просмотра этого контракта' },
        { status: 403 }
      );
    }

    // Генерируем договор для покупки
    const contractFileName = `purchase_contract_${uuidv4()}.pdf`;
    const contractsDir = join(process.cwd(), 'public', 'contracts');
    const userContractsDir = join(contractsDir, user.id);

    // Создаем директорию для хранения контрактов, если она не существует
    await mkdir(userContractsDir, { recursive: true });

    // Читаем шаблон PDF-файла
    // В реальном проекте здесь будет использоваться библиотека для модификации PDF
    // Сейчас просто копируем шаблон public.pdf
    const templatePath = join(process.cwd(), 'public', 'public.pdf');
    const templateContent = await readFile(templatePath);

    // Сохраняем договор как PDF
    await writeFile(join(userContractsDir, contractFileName), templateContent);

    // Обновляем информацию о контракте в базе данных
    await prisma.sellOffer.update({
      where: {
        id: id,
      },
      data: {
        contractPath: `/contracts/${user.id}/${contractFileName}`,
      },
    });

    // Возвращаем успешный ответ с путем к контракту
    return NextResponse.json({
      message: 'Контракт успешно сгенерирован',
      contractUrl: `/contracts/${user.id}/${contractFileName}`,
    });
  } catch (error) {
    console.error('Ошибка при генерации контракта:', error);
    return NextResponse.json(
      { message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
