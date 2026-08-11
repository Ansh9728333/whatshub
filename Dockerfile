# WhatsHub Production Railway Dockerfile (Node.js 22 + Native WebSocket Support)
FROM node:22-alpine

WORKDIR /app

# Copy all source code into container
COPY . .

# Install workspace dependencies
RUN npm install --legacy-peer-deps

# Build shared library first, then Express API backend
RUN npm run build --workspace=@whatshub/shared
RUN npm run build --workspace=@whatshub/api

EXPOSE 5000

ENV NODE_ENV=production

# Start Node.js Express Backend
CMD ["node", "apps/api/dist/index.js"]
