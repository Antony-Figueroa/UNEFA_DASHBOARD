# Stage 1: Runtime
FROM node:20-alpine
WORKDIR /app

# Configurar npm para ser más resiliente
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000

# Copiar archivos de definición de dependencias
COPY package*.json ./

# Instalar dependencias (incluyendo dev para tsx)
RUN npm install --network-timeout=100000

# Copiar el resto del código fuente
COPY . .

# Exponer el puerto
EXPOSE 3000

# Comando para iniciar en modo desarrollo para que use el .env actual
CMD ["npm", "run", "dev"]
