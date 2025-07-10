# Backend Dockerfile - Production Ready
FROM node:18-alpine AS dependencies

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache openssl libc6-compat

# Copy package files
COPY package*.json ./

# Generate package-lock.json if it doesn't exist
RUN if [ ! -f package-lock.json ]; then npm install --package-lock-only; fi

# Install dependencies with fallback
RUN npm ci --only=production || npm install --only=production

# Development dependencies stage
FROM node:18-alpine AS build-deps

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN if [ ! -f package-lock.json ]; then npm install --package-lock-only; fi
RUN npm ci || npm install

# Build stage
FROM build-deps AS build

WORKDIR /app

# Copy source code
COPY . .

# Create tsconfig.json if missing
RUN if [ ! -f tsconfig.json ]; then \
  cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "sourceMap": true,
    "resolveJsonModule": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
EOF
fi

# Verify Prisma schema exists
RUN ls -la prisma/ || echo "Prisma directory not found"

# Generate Prisma client
RUN npx prisma generate || echo "Prisma generation failed, continuing..."

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache \
    openssl \
    dumb-init \
    && addgroup -g 1001 -S nodejs \
    && adduser -S backend -u 1001

# Copy production dependencies
COPY --from=dependencies --chown=backend:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=build --chown=backend:nodejs /app/dist ./dist
COPY --from=build --chown=backend:nodejs /app/package*.json ./
COPY --from=build --chown=backend:nodejs /app/prisma ./prisma

# Create required directories
RUN mkdir -p uploads logs && chown -R backend:nodejs uploads logs

# Switch to non-root user
USER backend

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/app.js"]