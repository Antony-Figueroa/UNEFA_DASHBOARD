# Usar una imagen base de Node.js optimizada
FROM node:20-alpine

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar archivos de definición de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install --production=false

# Copiar el resto del código fuente
COPY . .

# Build: compilar TypeScript a JS en /dist
RUN npm run build

# Exponer el puerto que usa la app (lee PORT en runtime)
EXPOSE 5000

# Iniciar en modo producción ejecutando el build compilado
CMD ["node", "dist/server.js"]
