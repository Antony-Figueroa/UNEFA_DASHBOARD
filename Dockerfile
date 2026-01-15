# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar código fuente
COPY . .

# Generar build de producción
RUN npm run build

# Stage 2: Production with Nginx (Opcional, pero para desarrollo seguiremos con Vite)
# Sin embargo, para que funcione el HMR en desarrollo, usaremos una imagen simple
FROM node:20-alpine
WORKDIR /app

# Copiar dependencias e instalarlas (para modo desarrollo)
COPY package*.json ./
RUN npm install

# Copiar el resto del código
COPY . .

# Exponer puerto de Vite
EXPOSE 5173

# Comando para desarrollo con host configurado para Docker
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
