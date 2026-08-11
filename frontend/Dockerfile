# 1. Bağımlılık (Dependencies) Aşaması
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# 2. Derleme (Build) Aşaması
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build anı değişkenleri
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# 3. Çalıştırma (Runtime) Aşaması
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
# 🌟 KRİTİK: Render'ın konteyner içine erişebilmesi için 0.0.0.0 şarttır
ENV HOSTNAME="0.0.0.0"

# Statik dosyaları ve standalone derleme çıktısını kopyalıyoruz
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]