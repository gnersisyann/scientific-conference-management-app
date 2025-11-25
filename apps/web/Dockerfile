FROM node:22-alpine

WORKDIR /app

# Установка pnpm
RUN corepack enable

# Копирование package.json файлов
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/

# Установка зависимостей
RUN pnpm install --frozen-lockfile

# Копирование исходного кода
COPY apps/web ./apps/web

WORKDIR /app/apps/web

EXPOSE 3001

CMD ["pnpm", "dev", "--host", "0.0.0.0"]