# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci && npm install --no-save fast-check
COPY . .
RUN npx prisma generate
RUN npm run build || true

# Stage 2: Production
FROM node:20-alpine AS runner
RUN addgroup -S ccn && adduser -S ccn -G ccn
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
USER ccn
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
