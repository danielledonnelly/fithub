FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy frontend package files
COPY package*.json ./

# Copy backend package files
COPY server/package*.json ./server/

# Install frontend dependencies
RUN npm ci

# Install backend dependencies
WORKDIR /app/server
RUN npm ci

# Go back to root
WORKDIR /app

# Copy frontend source
COPY src ./src
COPY public ./public
COPY tailwind.config.js postcss.config.js ./

# Copy backend source  
COPY server/ ./server/

# Build the React app
RUN npm run build

# Create uploads directory
RUN mkdir -p server/uploads/avatars

# Expose port
EXPOSE 5001

# Start the server from server directory
WORKDIR /app/server
CMD ["npm", "start"]