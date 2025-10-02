# Multi-stage build for React frontend
FROM node:18-alpine as frontend-build

# Set working directory
WORKDIR /app/frontend

# Copy frontend package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy frontend source code
COPY src/ ./src/
COPY public/ ./public/
COPY tailwind.config.js ./
COPY postcss.config.js ./

# Build the React app
RUN npm run build

# Backend build stage
FROM node:18-alpine as backend-build

WORKDIR /app/backend

# Copy backend package files
COPY server/package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy backend source code
COPY server/ ./

# Production stage with nginx + backend
FROM node:18-alpine

# Install nginx
RUN apk add --no-cache nginx

# Set working directory for backend
WORKDIR /app/backend

# Copy backend from build stage
COPY --from=backend-build /app/backend ./

# Copy frontend build to nginx directory
COPY --from=frontend-build /app/frontend/build /usr/share/nginx/html

# Create nginx config
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location /api/ { \
        proxy_pass http://localhost:5001; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
        proxy_cache_bypass $http_upgrade; \
    } \
}' > /etc/nginx/http.d/default.conf

# Create uploads directory
RUN mkdir -p uploads/avatars

# Create startup script properly
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'nginx &' >> /start.sh && \
    echo 'cd /app/backend && npm start' >> /start.sh && \
    chmod +x /start.sh

# Expose port 80
EXPOSE 80

# Start both services
CMD ["/start.sh"]