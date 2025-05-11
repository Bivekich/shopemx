import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { uploadFile } from '@/lib/s3';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    // Проверяем авторизацию пользователя
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
    }

    // Получаем данные формы
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ message: 'Файл не найден' }, { status: 400 });
    }

    // Проверяем тип файла
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { message: 'Пожалуйста, загрузите изображение' },
        { status: 400 }
      );
    }

    // Проверяем размер файла (максимум 5 МБ)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { message: 'Размер файла не должен превышать 5 МБ' },
        { status: 400 }
      );
    }

    // Создаем уникальное имя файла
    const fileExtension = file.name.split('.').pop();
    const fileName = `${user.id}_passport_${uuidv4()}.${fileExtension}`;

    // Определяем путь в S3 хранилище
    const s3Key = `uploads/${user.id}/${fileName}`;

    // Загружаем файл в S3 хранилище
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileUrl = await uploadFile(s3Key, fileBuffer, file.type);

    // Сохраняем URL документа в базе данных
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        passportDocumentUrl: fileUrl,
      },
    });

    // Возвращаем успешный ответ
    return NextResponse.json({
      message: 'Документ успешно загружен',
      fileName: fileName,
      filePath: fileUrl,
    });
  } catch (error) {
    console.error('Ошибка при загрузке документа:', error);
    return NextResponse.json(
      { message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
