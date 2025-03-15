#!/bin/bash

# Проверка наличия docker и docker-compose
if ! [ -x "$(command -v docker)" ]; then
  echo 'Error: docker is not installed.' >&2
  exit 1
fi

if ! [ -x "$(command -v docker-compose)" ]; then
  echo 'Error: docker-compose is not installed.' >&2
  exit 1
fi

# Копирование .env.production в .env
echo "Копирование .env.production в .env..."
cp .env.production .env

# Проверка сборки проекта
echo "Проверка сборки проекта..."
./check-build.sh
if [ $? -ne 0 ]; then
  echo "Ошибка при проверке сборки. Деплой прерван."
  exit 1
fi

# Проверка подключения к базе данных
echo "Проверка подключения к внешней базе данных..."
./check-db-connection.sh
if [ $? -ne 0 ]; then
  echo "Ошибка подключения к базе данных. Деплой прерван."
  exit 1
fi

# Сборка и запуск контейнеров
echo "Сборка и запуск контейнеров..."
docker-compose build
docker-compose up -d

# Инициализация SSL-сертификатов
echo "Инициализация SSL-сертификатов..."
./init-letsencrypt.sh

# Применение миграций Prisma к внешней базе данных
echo "Применение миграций Prisma к внешней базе данных..."
docker-compose exec app npx prisma migrate deploy

echo "Деплой завершен! Приложение доступно по адресу https://shopemx.ru"
