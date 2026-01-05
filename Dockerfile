# Usar una imagen base de Node.js optimizada
FROM node:20-alpine

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar archivos de definición de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código fuente
COPY . .

# Exponer el puerto que usa Vite
EXPOSE 5173

# Comando para iniciar la aplicación en modo desarrollo con HMR
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
