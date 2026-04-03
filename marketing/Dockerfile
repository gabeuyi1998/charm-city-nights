FROM node:20-alpine
RUN addgroup -S ccn && adduser -S ccn -G ccn
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN mkdir -p logs && chown -R ccn:ccn /app
USER ccn
EXPOSE 3001
CMD ["sh", "-c", "if [ \"$CCN_SERVICE\" = 'webhook' ]; then npx tsx src/server/webhook-server.ts; else npx tsx src/workers/queue-worker.ts & npx tsx src/workers/analytics-worker.ts; fi"]
