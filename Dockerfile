# syntax=docker/dockerfile:1
FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM oven/bun:1-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3001

COPY --from=deps /app/node_modules ./node_modules
COPY package.json bun.lock bunfig.toml tsconfig.json bun-env.d.ts ./
COPY src ./src

USER bun
EXPOSE 3001
# Called directly instead of `bun run start`, whose script pins PORT to 3001.
CMD ["bun", "src/index.ts"]
