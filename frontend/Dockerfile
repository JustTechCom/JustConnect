# Stage 1 - Build React App
FROM node:18-alpine AS build

WORKDIR /app

# Install dependencies first
COPY package*.json ./
RUN npm install

# Copy all project files
COPY . .

# Optional: build-time environment variables
ARG REACT_APP_API_URL=https://justconnect-o8k8.onrender.com/api
ARG REACT_APP_SOCKET_URL=https://justconnect-o8k8.onrender.com
ARG REACT_APP_ENVIRONMENT=production

# Pass build-time vars into the environment
ENV REACT_APP_API_URL=$REACT_APP_API_URL \
    REACT_APP_SOCKET_URL=$REACT_APP_SOCKET_URL \
    REACT_APP_ENVIRONMENT=$REACT_APP_ENVIRONMENT \
    GENERATE_SOURCEMAP=false \
    CI=false \
    SKIP_PREFLIGHT_CHECK=true \
    TSC_COMPILE_ON_ERROR=true \
    ESLINT_NO_DEV_ERRORS=true \
    DISABLE_ESLINT_PLUGIN=true

# Build the React app (fails if something's wrong, as it should)
RUN npm run build

# Stage 2 - Serve with Nginx
FROM nginx:alpine AS production

# Copy built app from previous stage
COPY --from=build /app/build /usr/share/nginx/html

# Custom Nginx configuration
RUN rm -f /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose the HTTP port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
