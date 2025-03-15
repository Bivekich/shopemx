FROM node:20-alpine AS base

# Установка зависимостей для Prisma и других пакетов
RUN apk add --no-cache libc6-compat openssl

# Установка рабочей директории
WORKDIR /app

# Копирование файлов package.json и package-lock.json
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# Сборка приложения
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Установка переменных окружения для сборки
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

# Генерация Prisma клиента и сборка приложения
RUN npx prisma generate
RUN npm run build

# Запуск приложения
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Создание пользователя nextjs
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Копирование необходимых файлов
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Установка прав доступа
RUN chown -R nextjs:nodejs /app

# Переключение на пользователя nextjs
USER nextjs

# Открытие порта
EXPOSE 3000

# Запуск приложения
CMD ["node", "server.js"]
