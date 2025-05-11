import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadFile } from '@/lib/s3';
import { createContractPdf } from '@/lib/pdf';
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

    // Создаем текстовый шаблон договора
    const contractContent = `
====================================================
ДОГОВОР КУПЛИ-ПРОДАЖИ ИНТЕЛЛЕКТУАЛЬНОЙ СОБСТВЕННОСТИ
====================================================

г. Москва                                ${new Date().toLocaleDateString(
      'ru-RU'
    )}

${sellOffer.artwork.author.lastName} ${sellOffer.artwork.author.firstName} ${
      sellOffer.artwork.author.middleName || ''
    },
именуемый в дальнейшем "Продавец", с одной стороны,
и ${user.lastName} ${user.firstName} ${user.middleName || ''},
именуемый в дальнейшем "Покупатель", с другой стороны,
заключили настоящий Договор о нижеследующем:

1. ПРЕДМЕТ ДОГОВОРА

1.1. Продавец передает Покупателю права на произведение:
Название: ${sellOffer.artwork.title}
Описание: ${sellOffer.artwork.description}

2. УСЛОВИЯ ДОГОВОРА

2.1. Стоимость передачи прав: ${
      sellOffer.isFree
        ? 'Безвозмездно'
        : `${sellOffer.price ? sellOffer.price.toString() : '0'} руб.`
    }
`;

    // Преобразуем текст в PDF
    const pdfBuffer = await createContractPdf(contractContent);

    // Определяем путь в S3
    const s3Key = `contracts/${user.id}/${contractFileName}`;

    // Загружаем контракт в S3
    const contractUrl = await uploadFile(s3Key, pdfBuffer, 'application/pdf');

    // Обновляем информацию о контракте в базе данных
    await prisma.sellOffer.update({
      where: {
        id: id,
      },
      data: {
        contractPath: contractUrl,
      },
    });

    // Возвращаем успешный ответ с путем к контракту
    return NextResponse.json({
      message: 'Контракт успешно сгенерирован',
      contractUrl: contractUrl,
    });
  } catch (error) {
    console.error('Ошибка при генерации контракта:', error);
    return NextResponse.json(
      { message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
