# Etapa 1: Construcción
FROM node:20-alpine AS builder
WORKDIR /app

# Configurar npm para resiliencia
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000

# Instalar dependencias del frontend
COPY package*.json ./
RUN npm ci --network-timeout=100000

# Instalar dependencias del backend
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --network-timeout=100000

# Copiar todo el código
COPY . .

# Construir frontend
RUN npm run build

# Construir backend
RUN cd backend && npm run build

# Etapa 2: Producción
FROM node:20-alpine
WORKDIR /app

# Copiar archivos necesarios para producción
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/package*.json ./backend/
COPY --from=builder /app/backend/node_modules ./backend/node_modules

# Configurar variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000

# Usar el puerto de Render
EXPOSE 3000

# Iniciar el backend (que ahora sirve el frontend)
CMD ["node", "backend/dist/server.js"]
