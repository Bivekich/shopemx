const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Функция для хеширования пароля
async function hashPassword(password) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

async function main() {
  try {
    // Проверяем, существует ли уже пользователь с таким телефоном
    const existingUser = await prisma.user.findUnique({
      where: {
        phone: '+79991234567',
      },
    });

    if (existingUser) {
      console.log('Тестовый пользователь уже существует');
      return;
    }

    // Хешируем пароль
    const hashedPassword = await hashPassword('Test123!');

    // Создаем тестового пользователя
    const user = await prisma.user.create({
      data: {
        phone: '+79991234567',
        email: 'test@example.com',
        firstName: 'Иван',
        lastName: 'Тестов',
        password: hashedPassword,
      },
    });

    console.log('Тестовый пользователь успешно создан:', user.id);
  } catch (error) {
    console.error('Ошибка при создании тестового пользователя:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
