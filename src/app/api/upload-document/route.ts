import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

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

    // Создаем директорию для хранения документов пользователя, если она не существует
    const userDocumentsDir = join(process.cwd(), 'public', 'uploads', user.id);

    try {
      await writeFile(
        join(userDocumentsDir, fileName),
        Buffer.from(await file.arrayBuffer())
      );
    } catch (error) {
      console.error('Ошибка при сохранении файла:', error);

      // Если директория не существует, создаем её
      await mkdir(userDocumentsDir, { recursive: true });

      // Пробуем сохранить файл снова
      await writeFile(
        join(userDocumentsDir, fileName),
        Buffer.from(await file.arrayBuffer())
      );
    }

    // Сохраняем информацию о документе в базе данных
    // Здесь будет код для сохранения информации о документе в базе данных
    // Например, с использованием Prisma

    // Возвращаем успешный ответ
    return NextResponse.json({
      message: 'Документ успешно загружен',
      fileName: fileName,
      filePath: `/uploads/${user.id}/${fileName}`,
    });
  } catch (error) {
    console.error('Ошибка при загрузке документа:', error);
    return NextResponse.json(
      { message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
