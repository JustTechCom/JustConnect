# Frontend Dockerfile - Debug Version
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

# CRITICAL DEBUG: Check structure BEFORE build
RUN echo "=== DEBUGGING BEFORE BUILD ===" && \
    echo "--- Root directory ---" && \
    ls -la && \
    echo "--- Source directory ---" && \
    ls -la src/ && \
    echo "--- Public directory ---" && \
    ls -la public/ && \
    echo "--- Find ALL files named App ---" && \
    find . -name "*[Aa]pp*" -type f && \
    echo "--- Check index.tsx imports ---" && \
    cat src/index.tsx && \
    echo "--- Check if App.tsx exists ---" && \
    test -f src/App.tsx && echo "App.tsx EXISTS" || echo "App.tsx MISSING" && \
    echo "--- File permissions ---" && \
    ls -la src/App.tsx 2>/dev/null || echo "Cannot access App.tsx"

# If App.tsx is missing, create a simple one
RUN if [ ! -f src/App.tsx ]; then \
    echo "Creating missing App.tsx..." && \
    echo "import React from 'react';" > src/App.tsx && \
    echo "function App() {" >> src/App.tsx && \
    echo "  return (" >> src/App.tsx && \
    echo "    <div className=\"App\">" >> src/App.tsx && \
    echo "      <h1>JustConnect</h1>" >> src/App.tsx && \
    echo "      <p>Mesajlaşma Uygulaması</p>" >> src/App.tsx && \
    echo "    </div>" >> src/App.tsx && \
    echo "  );" >> src/App.tsx && \
    echo "}" >> src/App.tsx && \
    echo "export default App;" >> src/App.tsx; \
    fi

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

# Final check before build
RUN echo "=== FINAL CHECK BEFORE BUILD ===" && \
    ls -la src/ && \
    cat src/App.tsx

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