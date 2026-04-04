# ─── Backend Dockerfile (Multi-stage) ───

# Stage 1: Install dependencies & build
FROM node:20-slim AS builder

# Install build dependencies for Debian
RUN apt-get update && apt-get install -y openssl python3 build-essential

WORKDIR /app

# Copy package files + Prisma config
COPY package.json package-lock.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY tsconfig.json ./
COPY src ./src/

# Build TypeScript
RUN npm run build

# Stage 2: Production image
FROM node:20-slim AS runner

# Install necessary libraries for Debian (openssl is crucial for Prisma)
RUN apt-get update && apt-get install -y openssl libc6 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production

# Copy package files and install production deps only
COPY package.json package-lock.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./
RUN npm ci --omit=dev

# Generate Prisma client in production image
RUN npx prisma generate

# Copy compiled code from builder
COPY --from=builder /app/dist ./dist/

# Create uploads directory
RUN mkdir -p uploads/documents

# Expose port
EXPOSE 4000

# Start the server
CMD ["node", "dist/index.js"]
