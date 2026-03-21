# ─── Backend Dockerfile (Multi-stage) ───

# Stage 1: Install dependencies & build
FROM node:20-alpine AS builder

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
FROM node:20-alpine AS runner

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
