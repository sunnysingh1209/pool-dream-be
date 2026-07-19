# ---- Build stage ----
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM node:22-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
# --omit=dev keeps bcrypt/pg/typeorm etc. but drops build-only tooling
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist

EXPOSE 8080
# Runs pending migrations (idempotent) before every boot, then starts the app.
CMD ["sh", "-c", "npm run migration:run:prod && node dist/main.js"]
