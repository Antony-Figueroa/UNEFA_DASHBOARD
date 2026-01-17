#!/bin/bash

echo "🐳 UNEFA Dashboard - Auto Setup Docker"
echo "====================================="

# 1. Verificar Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker no está instalado."
    exit 1
fi

# 2. Verificar si Docker está corriendo
if ! docker info &> /dev/null; then
    echo "❌ Error: Docker no está iniciado."
    exit 1
fi

# 3. Configurar archivos .env
echo "📝 Verificando archivos de configuración..."

if [ -f ".env" ]; then
    echo "✅ .env (Raíz) ya existe. No se modificará."
else
    echo "ℹ️ Creando .env desde .env.example (Raíz)"
    cp .env.example .env
fi

if [ -f "backend/.env" ]; then
    echo "✅ backend/.env ya existe. No se modificará."
else
    echo "ℹ️ Creando .env desde .env.example (Backend)"
    cp backend/.env.example backend/.env
    echo "⚠️ ATENCION: Se ha creado backend/.env. DEBES EDITARLO con tus credenciales de Supabase."
    read -p "Presiona Enter cuando hayas configurado el archivo..."
fi

# Calcular hashes iniciales para verificar integridad después
echo "🔒 Registrando estado actual de archivos .env..."
ENV_ROOT_HASH=$(md5sum .env | awk '{print $1}')
ENV_BACKEND_HASH=$(md5sum backend/.env | awk '{print $1}')

# 4. Limpieza preventiva
echo "🧹 Limpiando contenedores previos..."
docker-compose down

# 5. Iniciar Docker
echo "🚀 Iniciando contenedores..."
docker-compose up --build

if [ $? -ne 0 ]; then
    echo "❌ Hubo un error al iniciar los contenedores."
    echo "💡 Intenta ejecutar: docker-compose down -v e intenta de nuevo."
fi

# 7. Verificación de integridad post-ejecución
echo "🔍 Verificando integridad de archivos .env..."
NEW_ROOT_HASH=$(md5sum .env | awk '{print $1}')
NEW_BACKEND_HASH=$(md5sum backend/.env | awk '{print $1}')

if [ "$ENV_ROOT_HASH" != "$NEW_ROOT_HASH" ] || [ "$ENV_BACKEND_HASH" != "$NEW_BACKEND_HASH" ]; then
    echo "🚨 ALERTA: Se detectaron cambios en los archivos .env durante la ejecución!"
else
    echo "✅ Integridad de archivos .env confirmada (sin cambios)."
fi
