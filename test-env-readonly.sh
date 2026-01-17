#!/bin/sh

# Script de prueba para verificar que el archivo .env es de solo lectura.
# Este script intenta escribir en el archivo .env y espera un error.

ENV_PATH="/app/.env"

if [ ! -f "$ENV_PATH" ]; then
    echo "❌ Error: El archivo .env no existe en $ENV_PATH"
    exit 1
fi

# Intentar añadir una línea al archivo
if echo "# Intento de escritura" >> "$ENV_PATH" 2>/dev/null; then
    echo "🚨 FALLO DE SEGURIDAD: Se pudo escribir en $ENV_PATH!"
    exit 1
else
    echo "✅ ÉXITO: El archivo .env es de solo lectura."
    exit 0
fi
