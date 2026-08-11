# WhatsHub Production Railway Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy all source code into container
COPY . .

# Install workspace dependencies
RUN npm install --legacy-peer-deps

# Build Express API backend
RUN npm run build --workspace=@whatshub/api

EXPOSE 5000

ENV NODE_ENV=production

# Start Node.js Express Backend
CMD ["node", "apps/api/dist/index.js"]
