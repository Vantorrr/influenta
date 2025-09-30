FROM node:20-alpine AS builder

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci --legacy-peer-deps --omit=optional

COPY backend/ ./
RUN npm run build

FROM node:20-alpine

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci --only=production --legacy-peer-deps --omit=optional

COPY --from=builder /app/backend/dist ./dist

EXPOSE 3001

CMD ["node", "dist/main"]

