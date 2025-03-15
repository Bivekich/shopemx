import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { readdir, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function DELETE() {
  try {
    // Проверяем авторизацию пользователя
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
    }

    // Путь к директории с документами пользователя
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
