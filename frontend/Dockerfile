# Frontend Dockerfile - Production Ready
FROM node:18-alpine AS dependencies

WORKDIR /app

# Copy package files
COPY package*.json ./

# Generate package-lock.json if missing and install dependencies
RUN if [ ! -f package-lock.json ]; then \
      echo "package-lock.json not found, generating..."; \
      npm install --package-lock-only; \
    fi && \
    npm ci --silent || npm install --silent

# Build stage
FROM dependencies AS build

WORKDIR /app

# Copy source code
COPY public/ ./public/
COPY src/ ./src/

# Create tsconfig.json if missing
RUN if [ ! -f tsconfig.json ]; then \
  cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": false,
    "noImplicitAny": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "noUnusedLocals": false,
    "noUnusedParameters": false
  },
  "include": ["src"],
  "exclude": ["node_modules"]
}
EOF
fi

# Copy config files if they exist
COPY tailwind.config.j* ./
COPY postcss.config.j* ./

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

# Build the application
RUN echo "Building React application..." && \
    npm run build

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

# Create optimized nginx configuration
RUN cat > /etc/nginx/conf.d/default.conf << 'EOF'
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/x-javascript
        application/xml+rss
        application/javascript
        application/json
        application/xml
        application/rss+xml
        application/atom+xml
        image/svg+xml;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
        try_files $uri =404;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # React Router fallback
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }

    # Error pages
    error_page 404 /index.html;
    error_page 500 502 503 504 /50x.html;
    
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
EOF

# Test nginx configuration
RUN nginx -t

# Create non-root user for nginx
RUN adduser -D -S -h /var/cache/nginx -s /sbin/nologin -G nginx nginx

# Set proper permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d

# Switch to non-root user
USER nginx

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]