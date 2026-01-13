# Usar una imagen base de Node.js optimizada
FROM node:20-alpine

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar archivos de definición de dependencias
COPY package*.json ./

# Instalar dependencias (incluye devDependencies necesarios para build)
RUN npm ci

# Copiar el resto del código fuente
COPY . .

# Build: compilar TypeScript a JS en /dist y listar artefactos para diagnóstico
RUN npm run build && echo "---- dist contents ----" && ls -la dist || (echo "dist not found" && exit 1)

# Exponer el puerto que usa la app (lee PORT en runtime)
EXPOSE 5000

# Iniciar en modo producción ejecutando el build compilado
CMD ["node", "dist/server.js"]
