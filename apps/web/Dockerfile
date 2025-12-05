FROM node:22-alpine

WORKDIR /app

RUN corepack enable


COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/


RUN pnpm install --frozen-lockfile


COPY apps/web ./apps/web


WORKDIR /app/apps/web

ARG NITRO_PORT=3001
ARG NUXT_PUBLIC_API_BASE_URL
ARG NUXT_PUBLIC_API_AUTH
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=${NITRO_PORT}
ENV NUXT_PUBLIC_API_BASE_URL=${NUXT_PUBLIC_API_BASE_URL}
ENV NUXT_PUBLIC_API_AUTH=${NUXT_PUBLIC_API_AUTH}


RUN pnpm build

EXPOSE 3001


CMD ["pnpm", "start"]
