# Frontend Dockerfile - Syntax Fix
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Generate package-lock.json if missing and install dependencies
RUN if [ ! -f package-lock.json ]; then \
      echo "Generating package-lock.json..."; \
      npm install --package-lock-only; \
    fi && \
    (npm ci --silent || npm install --silent)

# Copy source code
COPY public/ ./public/
COPY src/ ./src/

# Copy config files if they exist (using wildcard to avoid errors)
COPY tailwind.config.j* ./
COPY postcss.config.j* ./

# Create simple tsconfig.json if missing - FIXED SYNTAX
RUN if [ ! -f tsconfig.json ]; then \
      echo "Creating tsconfig.json..."; \
      printf '{\n  "compilerOptions": {\n    "target": "es5",\n    "lib": ["dom", "dom.iterable", "es6"],\n    "allowJs": true,\n    "skipLibCheck": true,\n    "esModuleInterop": true,\n    "allowSyntheticDefaultImports": true,\n    "strict": false,\n    "module": "esnext",\n    "moduleResolution": "node",\n    "resolveJsonModule": true,\n    "isolatedModules": true,\n    "noEmit": true,\n    "jsx": "react-jsx"\n  },\n  "include": ["src"],\n  "exclude": ["node_modules"]\n}' > tsconfig.json; \
    fi

# Build arguments with defaults
ARG REACT_APP_API_URL=http://localhost:5000/api
ARG REACT_APP_SOCKET_URL=http://localhost:5000
ARG REACT_APP_ENVIRONMENT=production

# Set build environment variables
ENV REACT_APP_API_URL=$REACT_APP_API_URL \
    REACT_APP_SOCKET_URL=$REACT_APP_SOCKET_URL \
    REACT_APP_ENVIRONMENT=$REACT_APP_ENVIRONMENT \
    GENERATE_SOURCEMAP=false \
    CI=false \
    SKIP_PREFLIGHT_CHECK=true \
    TSC_COMPILE_ON_ERROR=true \
    ESLINT_NO_DEV_ERRORS=true

# Build the application with error handling
RUN echo "Building React application..." && \
    (npm run build || CI=false TSC_COMPILE_ON_ERROR=true npm run build)

# Verify build output
RUN echo "Build verification:" && \
    ls -la build/ && \
    [ -f "build/index.html" ] && echo "✅ Build successful" || (echo "❌ Build failed" && exit 1)

# Production stage - Nginx
FROM nginx:alpine AS production

# Install wget for health checks
RUN apk add --no-cache wget

# Remove default nginx content
RUN rm -rf /usr/share/nginx/html/*

# Copy built React app
COPY --from=build /app/build /usr/share/nginx/html

# Create simple nginx configuration
RUN printf 'server {\n    listen 80;\n    server_name _;\n    root /usr/share/nginx/html;\n    index index.html;\n\n    # Health check\n    location /health {\n        access_log off;\n        return 200 "healthy\\n";\n        add_header Content-Type text/plain;\n    }\n\n    # React Router fallback\n    location / {\n        try_files $uri $uri/ /index.html;\n    }\n\n    # Cache static assets\n    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {\n        expires 1y;\n        add_header Cache-Control "public, immutable";\n        access_log off;\n    }\n}' > /etc/nginx/conf.d/default.conf

# Test nginx configuration
RUN nginx -t

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]