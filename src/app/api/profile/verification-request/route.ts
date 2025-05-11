import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { existsSync } from 'fs';
import { readdir } from 'fs/promises';
import path from 'path';

// POST - создание новой заявки на подтверждение
export async function POST() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
    }

    // Проверяем, что пользователь еще не верифицирован
    if (user.isVerified) {
      return NextResponse.json(
        { message: 'Ваш аккаунт уже подтвержден' },
        { status: 400 }
      );
    }

    // Проверяем, есть ли уже активная заявка
    const existingRequest = await prisma.verificationRequest.findFirst({
      where: {
        userId: user.id,
        status: 'PENDING',
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        {
          message: 'У вас уже есть активная заявка на подтверждение',
          requestId: existingRequest.id,
          createdAt: existingRequest.createdAt,
        },
        { status: 400 }
      );
    }

    // Получаем данные пользователя с URL документа
    const userData = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
      select: {
        passportDocumentUrl: true,
      },
    });

    let hasDocument = false;

    // Проверяем, есть ли документ в S3 (новый способ)
    if (userData?.passportDocumentUrl) {
      hasDocument = true;
    } else {
      // Если нет URL в базе, проверяем локальное хранилище (старый способ)
      const userDocumentsDir = path.join(
        process.cwd(),
        'public',
        'uploads',
        user.id
      );

      // Проверяем, существует ли директория с документами пользователя
      if (existsSync(userDocumentsDir)) {
        try {
          const files = await readdir(userDocumentsDir);
          const passportFile = files.find((file) => file.includes('passport'));
          if (passportFile) {
            hasDocument = true;
          }
        } catch (error) {
          console.error('Ошибка при проверке документов:', error);
        }
      }
    }

    // Если документа нет ни в S3, ни в локальном хранилище, возвращаем ошибку
    if (!hasDocument) {
      return NextResponse.json(
        {
          message:
            'Необходимо загрузить фото документа перед отправкой заявки на верификацию',
        },
        { status: 400 }
      );
    }

    // Создаем новую заявку
    const verificationRequest = await prisma.verificationRequest.create({
      data: {
        userId: user.id,
      },
    });

    return NextResponse.json(
      {
        message: 'Заявка на подтверждение успешно отправлена',
        requestId: verificationRequest.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Ошибка при создании заявки на подтверждение:', error);
    return NextResponse.json(
      { message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// GET - получение информации о заявках пользователя
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
    }

    // Получаем все заявки пользователя, отсортированные по дате создания (сначала новые)
    const requests = await prisma.verificationRequest.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ requests }, { status: 200 });
  } catch (error) {
    console.error('Ошибка при получении заявок на подтверждение:', error);
    return NextResponse.json(
      { message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
