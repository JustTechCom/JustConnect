# frontend/Dockerfile.render - Render için özel Dockerfile

FROM node:18-alpine AS build

WORKDIR /app

# Package files
COPY package*.json ./
RUN npm ci --only=production

# Source code
COPY public/ ./public/
COPY src/ ./src/
COPY tsconfig.json ./
COPY tailwind.config.js ./
COPY postcss.config.js ./

# Build args
ARG REACT_APP_API_URL
ARG REACT_APP_SOCKET_URL
ARG REACT_APP_ENVIRONMENT=production

# Environment variables
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_SOCKET_URL=$REACT_APP_SOCKET_URL
ENV REACT_APP_ENVIRONMENT=$REACT_APP_ENVIRONMENT
ENV GENERATE_SOURCEMAP=false
ENV CI=false

# Build with error tolerance
RUN npm run build

# Production stage - Nginx
FROM nginx:alpine

# Copy build
COPY --from=build /app/build /usr/share/nginx/html

# Custom nginx config for SPA
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
    error_page 404 /index.html; \
}' > /etc/nginx/conf.d/default.conf

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf.bak || true

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]