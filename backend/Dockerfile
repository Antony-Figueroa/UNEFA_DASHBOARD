# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine
WORKDIR /app

# NOTA DE SEGURIDAD: Los archivos .env se montan como solo lectura (read-only)
# para prevenir modificaciones accidentales o maliciosas desde el contenedor.
# La configuración se encuentra en docker-compose.yml utilizando el flag :ro

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Exponer el puerto
EXPOSE 3000

# Comando para iniciar en modo producción
CMD ["npm", "start"]
