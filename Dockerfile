# Etapa 1: Construcción
FROM node:20-alpine AS builder
WORKDIR /app

# Configurar npm para resiliencia
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000

# Copiar solo lo necesario para instalar dependencias
COPY package*.json ./
RUN npm ci --network-timeout=100000

# Copiar el resto y construir
COPY . .
RUN npm run build

# Etapa 2: Producción
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app ./

# Usar el puerto de Render
EXPOSE 3000
CMD ["npm", "start"]
