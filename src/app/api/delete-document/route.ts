import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { readdir, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { prisma } from '@/lib/prisma';
import { deleteFile, getKeyFromUrl, isS3Url } from '@/lib/s3';

export async function DELETE() {
  try {
    // Проверяем авторизацию пользователя
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
    }

    // Получаем информацию о документе из базы данных
    const userWithDocument = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
      select: {
        passportDocumentUrl: true,
      },
    });

    // Если есть URL документа в S3, удаляем его оттуда
    if (
      userWithDocument?.passportDocumentUrl &&
      isS3Url(userWithDocument.passportDocumentUrl)
    ) {
      const s3Key = getKeyFromUrl(userWithDocument.passportDocumentUrl);

      if (s3Key) {
        await deleteFile(s3Key);
      }

      // Обновляем запись в базе данных
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          passportDocumentUrl: null,
        },
      });

      return NextResponse.json({
        message: 'Документ успешно удален',
      });
    }

    // Если нет URL в S3 или это не S3 URL, проверяем локальное хранилище
    const userDocumentsDir = join(process.cwd(), 'public', 'uploads', user.id);

    // Проверяем, существует ли директория
    if (!existsSync(userDocumentsDir)) {
      return NextResponse.json(
        { message: 'Документ не найден' },
        { status: 404 }
      );
    }

    // Получаем список файлов в директории
    const files = await readdir(userDocumentsDir);

    // Ищем файл паспорта
    const passportFile = files.find((file) => file.includes('passport'));

    if (!passportFile) {
      return NextResponse.json(
        { message: 'Документ не найден' },
        { status: 404 }
      );
    }

    // Удаляем файл
    await unlink(join(userDocumentsDir, passportFile));

    // Обновляем запись в базе данных, если был URL документа
    if (userWithDocument?.passportDocumentUrl) {
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          passportDocumentUrl: null,
        },
      });
    }

    // Возвращаем успешный ответ
    return NextResponse.json({
      message: 'Документ успешно удален',
    });
  } catch (error) {
    console.error('Ошибка при удалении документа:', error);
    return NextResponse.json(
      { message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
