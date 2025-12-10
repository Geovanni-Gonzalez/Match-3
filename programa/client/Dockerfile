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
COPY client ./client

# Construir el cliente
# Establecer variable de entorno para evitar problemas con CI=true por defecto en algunos entornos
ENV CI=false
RUN npm run build -w client

# Etapa de producción con Nginx
FROM nginx:alpine

COPY --from=builder /app/client/build /usr/share/nginx/html

# Configuración personalizada de Nginx para React Router
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
