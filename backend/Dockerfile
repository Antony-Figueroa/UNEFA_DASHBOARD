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

# Exponer el puerto del backend
EXPOSE 3000

# Comando para iniciar el backend con TypeScript nativo (tsx watch)
CMD ["npm", "run", "dev"]
