# Stage 1: Build
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY .
ARG ENV_FILE
COPY ${ENV_FILE} .env
RUN npm run build

# Stage 2: Runtime
FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist 
CMD ["node", "dist/src/index.ts"]