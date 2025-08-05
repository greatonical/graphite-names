# Use Bun's official lightweight image
FROM oven/bun:1.1 as base

# Set working directory
WORKDIR /app

# Copy only package files for efficient layer caching
COPY bun.lockb ./
COPY package.json ./

# Install dependencies
RUN bun install

# Copy the rest of the app source
COPY . .

# Build the Next.js app
RUN bun run build

# Use a lighter production image
FROM oven/bun:1.1-slim as prod

# Set working directory
WORKDIR /app

# Copy only what's necessary from the builder image
COPY --from=base /app ./

# Set environment variables (optional)
ENV NODE_ENV=production \
    PORT=3000

# Expose the Next.js default port
EXPOSE 3000

# Start the app
CMD ["bun", "start"]
