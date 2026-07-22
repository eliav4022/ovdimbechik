# Multi-stage build for React + Vite + Express App
FROM node:22-slim AS builder

WORKDIR /app

# Prevent Puppeteer from downloading Chromium during build
ENV PUPPETEER_SKIP_DOWNLOAD=true

# Copy package lock and manifests
COPY package*.json ./

# Install all dependencies (including devDependencies required for vite & esbuild)
RUN npm ci

# Copy full source code
COPY . .

# Run build (vite build + esbuild server.ts -> dist/server.cjs)
RUN npm run build

# Stage 2: Production runner
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV PUPPETEER_SKIP_DOWNLOAD=true

# Copy package manifests and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/server.cjs"]
