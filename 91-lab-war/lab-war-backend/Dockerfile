FROM oven/bun:1-alpine AS base

FROM base AS builder

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install

COPY . .

EXPOSE 3000

CMD ["bun", "run", "./src/cluster.ts"]
