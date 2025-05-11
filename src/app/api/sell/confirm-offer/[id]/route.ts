import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadFile } from '@/lib/s3';
import { createContractPdf } from '@/lib/pdf';
import { v4 as uuidv4 } from 'uuid';

export async function POST(
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
        artwork: true,
      },
    });

    // Проверяем, существует ли предложение и принадлежит ли оно пользователю
    if (!sellOffer) {
      return NextResponse.json(
        { message: 'Предложение не найдено' },
        { status: 404 }
      );
    }

    if (sellOffer.sellerId !== user.id) {
      return NextResponse.json(
        { message: 'У вас нет прав для подтверждения этого предложения' },
        { status: 403 }
      );
    }

    // Генерируем договор
    const contractFileName = `contract_${uuidv4()}.pdf`;

    // Преобразуем Decimal в строку перед передачей в функцию генерации договора
    const sellOfferForContract = {
      ...sellOffer,
      price: sellOffer.price ? sellOffer.price.toString() : null,
    };

    // Генерируем содержимое договора в текстовом формате
    const contractContent = generateContractContent(sellOfferForContract, user);

    // Преобразуем текст в PDF
    const pdfBuffer = await createContractPdf(contractContent);

    // Определяем путь в S3
    const s3Key = `contracts/${user.id}/${contractFileName}`;

    // Загружаем договор в S3
    const contractUrl = await uploadFile(s3Key, pdfBuffer, 'application/pdf');

    // Обновляем статус предложения на "активное" и сохраняем путь к договору
    await prisma.sellOffer.update({
      where: {
        id: id,
      },
      data: {
        status: 'ACTIVE',
        contractPath: contractUrl,
      },
    });

    // Отправляем уведомление на почту пользователя (в реальном проекте)
    // await sendEmailNotification(user.email, sellOffer.id);

    // Возвращаем успешный ответ с путем к договору
    return NextResponse.json({
      message: 'Предложение успешно подтверждено',
      contractUrl: contractUrl,
    });
  } catch (error) {
    console.error('Ошибка при подтверждении предложения:', error);
    return NextResponse.json(
      { message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// Функция для генерации содержимого договора
function generateContractContent(
  sellOffer: {
    isFree: boolean;
    price: string | number | null;
    contractType: 'EXCLUSIVE_RIGHTS' | 'LICENSE';
    licenseType: 'EXCLUSIVE' | 'NON_EXCLUSIVE' | null;
    isPerpetual: boolean | null;
    licenseDuration: number | null;
    artwork: {
      title: string;
      description: string;
    };
  },
  user: {
    lastName: string;
    firstName: string;
    middleName?: string | null;
    passportSeries?: string | null;
    passportNumber?: string | null;
    passportIssuedBy?: string | null;
    passportIssueDate?: Date | string | null;
    bankName?: string | null;
    bankBik?: string | null;
    bankAccount?: string | null;
    bankCorAccount?: string | null;
  }
): string {
  const currentDate = new Date().toLocaleDateString('ru-RU');
  const isFree = sellOffer.isFree;
  const price = isFree ? 'Безвозмездно' : `${sellOffer.price} руб.`;

  // Определяем тип договора
  let contractType = '';
  if (sellOffer.contractType === 'EXCLUSIVE_RIGHTS') {
    contractType = 'Договор об отчуждении исключительного права';
  } else {
    contractType = `Лицензионный договор (${
      sellOffer.licenseType === 'EXCLUSIVE'
        ? 'исключительная'
        : 'неисключительная'
    } лицензия)`;
  }

  // Определяем срок действия лицензии
  let licenseDuration = '';
  if (sellOffer.contractType === 'LICENSE') {
    if (sellOffer.isPerpetual) {
      licenseDuration = 'Бессрочно';
    } else {
      licenseDuration = `${sellOffer.licenseDuration} лет`;
    }
  }

  // Формируем шаблон договора
  let content = `
====================================================
${contractType.toUpperCase()}
====================================================

г. Москва                                ${currentDate}

${user.lastName} ${user.firstName} ${user.middleName || ''},
именуемый в дальнейшем "Правообладатель", с одной стороны,
и ___________________________, именуемый в дальнейшем "Приобретатель",
с другой стороны, заключили настоящий Договор о нижеследующем:

1. ПРЕДМЕТ ДОГОВОРА

1.1. Правообладатель передает Приобретателю права на произведение:
Название: ${sellOffer.artwork.title}
Описание: ${sellOffer.artwork.description}

2. УСЛОВИЯ ДОГОВОРА

2.1. Стоимость передачи прав: ${price}
`;

  // Добавляем условия в зависимости от типа договора
  if (sellOffer.contractType === 'EXCLUSIVE_RIGHTS') {
    content += `
2.2. По настоящему Договору Правообладатель передает Приобретателю исключительное право на произведение в полном объеме.
`;
  } else {
    content += `
2.2. По настоящему Договору Правообладатель предоставляет Приобретателю ${
      sellOffer.licenseType === 'EXCLUSIVE'
        ? 'исключительную'
        : 'неисключительную'
    } лицензию на использование произведения.
2.3. Срок действия лицензии: ${licenseDuration}
`;
  }

  // Завершение договора
  content += `
3. ОТВЕТСТВЕННОСТЬ СТОРОН

3.1. За неисполнение или ненадлежащее исполнение обязательств по настоящему Договору Стороны несут ответственность в соответствии с действующим законодательством.

4. РЕКВИЗИТЫ СТОРОН

Правообладатель:
${user.lastName} ${user.firstName} ${user.middleName || ''}
Паспорт: ${user.passportSeries || ''} ${user.passportNumber || ''}
Выдан: ${user.passportIssuedBy || ''}, ${
    user.passportIssueDate
      ? new Date(user.passportIssueDate).toLocaleDateString('ru-RU')
      : ''
  }
Банковские реквизиты:
${user.bankName || ''}
БИК: ${user.bankBik || ''}
Счет: ${user.bankAccount || ''}
К/с: ${user.bankCorAccount || ''}

Приобретатель:
_________________________
_________________________
_________________________

5. ПОДПИСИ СТОРОН

Правообладатель: _______________ / ${user.lastName} ${user.firstName[0]}. ${
    user.middleName ? user.middleName[0] + '.' : ''
  }

Приобретатель: _______________ / ________________
`;

  return content;
}
