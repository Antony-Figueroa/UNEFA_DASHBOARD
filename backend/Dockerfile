# Stage 1: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar archivos de definición de dependencias
COPY package*.json ./

# Instalar todas las dependencias para compilar
RUN npm ci

# Copiar el resto del código fuente
COPY . .

# Compilar TypeScript (generar carpeta dist)
RUN npx tsc

# Stage 2: Runner (Producción)
FROM node:20-alpine AS runner
WORKDIR /app

# Establecer NODE_ENV
ENV NODE_ENV=production

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --omit=dev && npm cache clean --force

# Copiar artefactos compilados desde el builder
COPY --from=builder /app/dist ./dist

# Crear carpeta pública si no existe
RUN mkdir -p public

# Exponer el puerto
EXPOSE 3000

# Comando para iniciar
CMD ["node", "dist/server.js"]
