FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files and install deps
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm install typescript@latest @types/node@latest --no-save

# Copy source and build
COPY tsconfig.json ./
COPY src/ ./src/
RUN npx tsc -p .

# ---- Runtime image ----
FROM node:22-alpine AS runtime

ENV NODE_ENV=production

WORKDIR /app

# Only install production deps
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy compiled output
COPY --from=builder /app/dist ./dist

EXPOSE 8080

CMD ["node", "dist/index.js"]
