# Use Node.js 18 LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy backend package.json and package-lock.json
COPY backend/package*.json ./backend/

# Install dependencies
RUN cd backend && npm ci --only=production=false

# Copy backend source code
COPY backend ./backend

# Build the application
RUN cd backend && npm run build

# Expose port
EXPOSE 3001

# Set working directory to backend
WORKDIR /app/backend

# Start the application
CMD ["npm", "run", "start:prod"]
