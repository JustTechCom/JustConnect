# Frontend Dockerfile
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build arguments
ARG REACT_APP_API_URL
ARG REACT_APP_SOCKET_URL
ARG REACT_APP_ENVIRONMENT=production

# Set environment variables
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_SOCKET_URL=$REACT_APP_SOCKET_URL
ENV REACT_APP_ENVIRONMENT=$REACT_APP_ENVIRONMENT
ENV GENERATE_SOURCEMAP=false

# Build the application
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine AS production

# Install dumb-init
RUN apk add --no-cache dumb-init

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built app
COPY --from=build /app/build /usr/share/nginx/html

# Add nginx user
RUN addgroup -g 1001 -S nginx_group
RUN adduser -S nginx_user -u 1001 -G nginx_group

# Set permissions
RUN chown -R nginx_user:nginx_group /usr/share/nginx/html
RUN chown -R nginx_user:nginx_group /var/cache/nginx
RUN chown -R nginx_user:nginx_group /var/log/nginx
RUN chown -R nginx_user:nginx_group /etc/nginx/conf.d
RUN touch /var/run/nginx.pid
RUN chown -R nginx_user:nginx_group /var/run/nginx.pid

USER nginx_user

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["nginx", "-g", "daemon off;"]