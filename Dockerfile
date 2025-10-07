FROM node:18-alpine

WORKDIR /app/backend

# Copy package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY backend ./

# Build application
RUN npm run build

# Expose typical Railway port (platform will set PORT env var)
EXPOSE 8080

# Start the application
CMD ["npm", "run", "start:prod"]









