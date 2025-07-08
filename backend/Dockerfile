# Backend Dockerfile - Updated Version
FROM node:18-alpine AS build

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    openssl \
    python3 \
    make \
    g++ \
    && ln -sf python3 /usr/bin/python

# Copy package files first for better caching
COPY package*.json ./

# Copy Prisma schema before installing dependencies
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Install dev dependencies for build
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Verify Prisma schema exists and is valid
RUN ls -la prisma/
RUN cat prisma/schema.prisma

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install dumb-init and OpenSSL for proper signal handling and Prisma
RUN apk add --no-cache dumb-init openssl

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copy built application
COPY --from=build --chown=nodejs:nodejs /app/dist ./dist
COPY --from=build --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nodejs:nodejs /app/package*.json ./
COPY --from=build --chown=nodejs:nodejs /app/prisma ./prisma

USER nodejs

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); http.get('http://localhost:5000/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/app.js"]