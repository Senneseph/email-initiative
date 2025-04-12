# Use Chainguard Node.js image as base
FROM cgr.dev/chainguard/node:20

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Create logs directory
RUN mkdir -p logs

# Run the application
CMD ["node", "dist/index.js"]
