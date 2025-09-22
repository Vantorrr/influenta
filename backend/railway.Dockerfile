# Railway-specific Dockerfile
FROM node:18-alpine

# Install dependencies for bcrypt
RUN apk add --no-cache python3 make g++ postgresql-client

WORKDIR /app/backend

# Copy package files
COPY backend/package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci --production=false

# Copy source code
COPY backend/ ./

# Build the application
RUN npm run build

# List dist directory for debugging
RUN ls -la dist/

# Remove devDependencies to reduce image size
RUN npm prune --production

# Expose port
EXPOSE ${PORT:-3001}

# Start the application
CMD ["npm", "run", "start:prod"]
