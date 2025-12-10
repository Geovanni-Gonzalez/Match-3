# Etapa de construcción
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de definición de paquetes del workspace
COPY package*.json ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/
COPY client/package.json ./client/

# Instalar dependencias del workspace
RUN npm ci

# Copiar código fuente
COPY shared ./shared
COPY server ./server

# Construir el servidor
RUN npm run build -w server

# Etapa de producción
FROM node:20-alpine

WORKDIR /app

# Copiar dependencias y build desde el builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/server/package.json ./server/
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/src/config/defaults.json ./server/dist/config/defaults.json
COPY --from=builder /app/shared ./shared

EXPOSE 4000

WORKDIR /app/server
CMD ["node", "dist/index.js"]
