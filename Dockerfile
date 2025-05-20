# ---- Stage 1: Builder ----
FROM node:20-alpine AS builder


WORKDIR /app

# Installe pnpm globalement
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install

COPY . .
RUN pnpm build


ENV NODE_ENV=production
ENV PORT=3005



HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --spider http://localhost:${PORT}/health || exit 1

EXPOSE 3005

CMD ["pnpm", "run", "server:prod"]