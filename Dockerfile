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

# Ensure PORT env var
ENV PORT=3001

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "run", "start:prod"]
