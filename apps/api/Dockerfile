FROM node:22-alpine

WORKDIR /app

# Установка pnpm
RUN corepack enable

# Копирование package.json файлов
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/

# Установка зависимостей
RUN pnpm install --frozen-lockfile

# Копирование исходного кода
COPY apps/api ./apps/api

# Генерация Prisma клиента
WORKDIR /app/apps/api
RUN pnpm prisma generate

EXPOSE 3000

CMD ["pnpm", "dev"]