#!/bin/bash

# Извлечение данных подключения из DATABASE_URL
if [ -f .env.production ]; then
  source <(grep DATABASE_URL .env.production)
else
  echo "Файл .env.production не найден!"
  exit 1
fi

# Извлечение компонентов из DATABASE_URL
# Формат: postgresql://username:password@host:port/database
if [[ $DATABASE_URL =~ postgresql://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+) ]]; then
  DB_USER="${BASH_REMATCH[1]}"
  DB_PASS="${BASH_REMATCH[2]}"
  DB_HOST="${BASH_REMATCH[3]}"
  DB_PORT="${BASH_REMATCH[4]}"
  DB_NAME="${BASH_REMATCH[5]}"
else
  echo "Не удалось разобрать DATABASE_URL. Проверьте формат."
  exit 1
fi

echo "Проверка подключения к базе данных $DB_NAME на хосте $DB_HOST..."

# Проверка подключения с помощью psql
if command -v psql &> /dev/null; then
  PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" &> /dev/null
  if [ $? -eq 0 ]; then
    echo "Подключение к базе данных успешно!"
    exit 0
  else
    echo "Не удалось подключиться к базе данных. Проверьте параметры подключения."
    exit 1
  fi
else
  echo "Утилита psql не найдена. Установите PostgreSQL клиент для проверки подключения."
  exit 1
fi
