import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { uploadFile } from '@/lib/s3';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function POST(request: Request) {
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

    // Получаем данные формы
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ message: 'Файл не найден' }, { status: 400 });
    }

    // Получаем остальные данные формы
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const isFree = formData.get('isFree') === 'true';
    const price = formData.get('price') as string;
    const contractType = formData.get('contractType') as
      | 'EXCLUSIVE_RIGHTS'
      | 'LICENSE';
    const isExclusiveLicense = formData.get('isExclusiveLicense') === 'true';
    const isPerpetualLicense = formData.get('isPerpetualLicense') === 'true';
    const licenseDuration = formData.get('licenseDuration') as string;

    // Валидация данных
    if (!title || !description || !contractType) {
      return NextResponse.json(
        { message: 'Пожалуйста, заполните все обязательные поля' },
        { status: 400 }
      );
    }

    // Валидация цены для платных сделок
    if (!isFree && (!price || !/^(?:\d{1,8}(?:,\d{0,2})?)$/.test(price))) {
      return NextResponse.json(
        { message: 'Пожалуйста, укажите корректную цену' },
        { status: 400 }
      );
    }

    // Валидация срока лицензии для временных лицензий
    if (
      contractType === 'LICENSE' &&
      !isPerpetualLicense &&
      (!licenseDuration || !/^[1-9][0-9]?$/.test(licenseDuration))
    ) {
      return NextResponse.json(
        { message: 'Пожалуйста, укажите корректный срок лицензии' },
        { status: 400 }
      );
    }

    try {
      // Создаем уникальное имя файла
      const fileExtension = file.name.split('.').pop() || '';
      const fileName = `${uuidv4()}.${fileExtension}`;

      // Определяем путь в S3
      const s3Key = `artworks/${user.id}/${fileName}`;

      // Загружаем файл в S3
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      const fileUrl = await uploadFile(s3Key, fileBuffer, file.type);

      // Преобразуем цену из строки в Decimal
      const numericPrice =
        !isFree && price ? parseFloat(price.replace(',', '.')) : null;

      // Создаем запись о произведении в базе данных
      const artwork = await prisma.artwork.create({
        data: {
          title,
          description,
          filePath: fileUrl,
          authorId: user.id,
        },
      });

      // Создаем запись о предложении продажи в базе данных
      const sellOffer = await prisma.sellOffer.create({
        data: {
          price: numericPrice ? new Prisma.Decimal(numericPrice) : null,
          isFree,
          contractType,
          licenseType:
            contractType === 'LICENSE'
              ? isExclusiveLicense
                ? 'EXCLUSIVE'
                : 'NON_EXCLUSIVE'
              : null,
          isExclusive: contractType === 'LICENSE' ? isExclusiveLicense : null,
          isPerpetual: contractType === 'LICENSE' ? isPerpetualLicense : null,
          licenseDuration:
            contractType === 'LICENSE' && !isPerpetualLicense
              ? parseInt(licenseDuration, 10)
              : null,
          artworkId: artwork.id,
          sellerId: user.id,
          status: 'PENDING',
        },
      });

      // Возвращаем успешный ответ
      return NextResponse.json({
        message: 'Предложение успешно создано',
        offerId: sellOffer.id,
      });
    } catch (error) {
      console.error('Ошибка при сохранении предложения:', error);
      return NextResponse.json(
        { message: 'Ошибка при сохранении предложения' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Ошибка при создании предложения:', error);
    return NextResponse.json(
      { message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
