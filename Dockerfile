# WhatsHub Production Railway Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy monorepo configuration
COPY package*.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Build shared package and API server
RUN npm run build --workspace=@whatshub/shared
RUN npm run build --workspace=@whatshub/api

EXPOSE 5000

ENV NODE_ENV=production

# Start Node.js Express Server
CMD ["node", "apps/api/dist/index.js"]
