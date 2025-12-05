FROM node:22-alpine

WORKDIR /app

RUN corepack enable


COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/api/prisma ./apps/api/prisma
COPY apps/api/prisma.config.ts ./apps/api/
COPY apps/api/tsconfig.json ./apps/api/


RUN pnpm install --frozen-lockfile


COPY apps/api/src ./apps/api/src


WORKDIR /app/apps/api

ARG DATABASE_URL
ARG NODE_ENV=production
ENV DATABASE_URL=${DATABASE_URL}
ENV NODE_ENV=${NODE_ENV}

RUN pnpm prisma generate


RUN pnpm build

EXPOSE 3000


CMD ["pnpm", "start"]
