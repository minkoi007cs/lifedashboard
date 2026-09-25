# Backend Dockerfile (multi-stage build)
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package.json ./
RUN npm install

# Copy source
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/main.js"]
