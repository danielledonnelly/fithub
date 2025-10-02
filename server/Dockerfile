FROM node:18

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads/avatars

# Expose port
EXPOSE 5001

# Start the server
CMD ["npm", "start"]