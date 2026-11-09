FROM node:22-bookworm-slim

# Prisma 的查詢引擎需要 openssl
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@11.28.10

WORKDIR /app

# 先只複製各套件的 package.json 和 lockfile:程式碼改了,安裝依賴這一層仍然可以用快取
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile

COPY . .

# 產生 Prisma client(src/generated 不在 git 裡),並打包前端
RUN pnpm --filter api db:generate
RUN pnpm --filter web build-only

ENV NODE_ENV=production
EXPOSE 3000

# 程式不用 root 權限:萬一被攻破,攻擊者能做的事少很多。node 這個使用者是官方映像檔內建的
USER node

# 啟動時先套用 migration(重複執行是安全的),再啟動 API
CMD ["sh", "-c", "pnpm --filter api exec prisma migrate deploy && pnpm --filter api exec tsx src/index.ts"]
