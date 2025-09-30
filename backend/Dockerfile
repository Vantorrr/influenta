FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps --omit=optional

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production --legacy-peer-deps --omit=optional

COPY --from=builder /app/dist ./dist

EXPOSE 3001

CMD ["node", "dist/main"]

