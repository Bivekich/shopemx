import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { existsSync } from 'fs';
import { readdir } from 'fs/promises';
import path from 'path';

// GET - получение документа пользователя
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
    }

    // Проверяем, что пользователь является администратором
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Недостаточно прав для выполнения операции' },
        { status: 403 }
      );
    }

    const userId = (await params).id;

    // Проверяем, существует ли пользователь
    const targetUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { message: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Путь к директории с документами пользователя
    const userDocumentsDir = path.join(
      process.cwd(),
      'public',
      'uploads',
      userId
    );

    // Проверяем, существует ли директория
    if (!existsSync(userDocumentsDir)) {
      return NextResponse.json(
        { message: 'Документы не найдены' },
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

    // Возвращаем URL документа
    return NextResponse.json({
      documentUrl: `/uploads/${userId}/${passportFile}`,
    });
  } catch (error) {
    console.error('Ошибка при получении документа пользователя:', error);
    return NextResponse.json(
      { message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
