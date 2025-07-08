# Frontend Dockerfile - Module Resolution Fix
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy essential directories
COPY public/ ./public/
COPY src/ ./src/

# Copy optional config files (if they exist)
COPY tailwind.config.j[s] ./
COPY postcss.config.j[s] ./

# Fix import issue in index.tsx
RUN echo "=== FIXING MODULE IMPORTS ===" && \
    echo "Original index.tsx:" && \
    cat src/index.tsx && \
    echo "--- Fixing import ---" && \
    sed -i "s|import App from './App'|import App from './App.tsx'|g" src/index.tsx && \
    echo "Fixed index.tsx:" && \
    cat src/index.tsx

# Create tsconfig.json for proper module resolution
RUN echo '{ \
  "compilerOptions": { \
    "target": "es5", \
    "lib": ["dom", "dom.iterable", "es6"], \
    "allowJs": true, \
    "skipLibCheck": true, \
    "esModuleInterop": true, \
    "allowSyntheticDefaultImports": true, \
    "strict": false, \
    "forceConsistentCasingInFileNames": false, \
    "noFallthroughCasesInSwitch": true, \
    "module": "esnext", \
    "moduleResolution": "node", \
    "resolveJsonModule": true, \
    "isolatedModules": true, \
    "noEmit": true, \
    "jsx": "react-jsx" \
  }, \
  "include": ["src"] \
}' > tsconfig.json

# Build arguments
ARG REACT_APP_API_URL=http://localhost:5000/api
ARG REACT_APP_SOCKET_URL=http://localhost:5000
ARG REACT_APP_ENVIRONMENT=production

# Set environment variables
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_SOCKET_URL=$REACT_APP_SOCKET_URL
ENV REACT_APP_ENVIRONMENT=$REACT_APP_ENVIRONMENT
ENV GENERATE_SOURCEMAP=false
ENV CI=false
ENV SKIP_PREFLIGHT_CHECK=true

# Final debug
RUN echo "=== FINAL CHECK ===" && \
    ls -la src/ && \
    echo "--- tsconfig.json ---" && \
    cat tsconfig.json && \
    echo "--- index.tsx imports ---" && \
    head -10 src/index.tsx

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Copy built app
COPY --from=build /app/build /usr/share/nginx/html

# Create nginx config
RUN echo 'server { \
    listen 80; \
    server_name _; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
    location /health { \
        return 200 "healthy\\n"; \
        add_header Content-Type text/plain; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# Production stage with Nginx
FROM nginx:alpine AS production

# Copy built app
COPY --from=build /app/build /usr/share/nginx/html

# Create simple nginx config for React Router
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
    location /health { \
        return 200 "healthy"; \
        add_header Content-Type text/plain; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]