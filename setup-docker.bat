@echo off
SETLOCAL EnableDelayedExpansion

echo 🐳 UNEFA Dashboard - Auto Setup Docker
echo =====================================

:: 1. Verificar Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: Docker no está instalado. Por favor instala Docker Desktop.
    pause
    exit /b 1
)

:: 2. Verificar si Docker está corriendo
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: Docker no está iniciado. Por favor abre Docker Desktop.
    pause
    exit /b 1
)

:: 3. Configurar archivos .env
echo 📝 Verificando archivos de configuracion...

if not exist ".env" (
    echo ℹ️ Creando .env desde .env.example (Raiz)
    copy ".env.example" ".env"
)

if not exist "backend\.env" (
    echo ℹ️ Creando .env desde .env.example (Backend)
    copy "backend\.env.example" "backend\.env"
    echo ⚠️ ATENCION: Se ha creado backend\.env. DEBES EDITARLO con tus credenciales de Supabase.
    pause
)

:: 4. Verificar Puertos (5173 y 5000)
echo 🔍 Verificando puertos disponibles...

netstat -ano | findstr :5173 >nul
if %errorlevel% equ 0 (
    echo ⚠️ Advertencia: El puerto 5173 ya esta en uso.
)

netstat -ano | findstr :5000 >nul
if %errorlevel% equ 0 (
    echo ⚠️ Advertencia: El puerto 5000 ya esta en uso.
)

:: 5. Limpieza preventiva (opcional pero util para errores de modulos)
echo 🧹 Limpiando contenedores previos...
docker-compose down >nul 2>&1

:: 6. Iniciar Docker
echo 🚀 Iniciando contenedores...
docker-compose up --build

if %errorlevel% neq 0 (
    echo ❌ Hubo un error al iniciar los contenedores.
    echo 💡 Intenta ejecutar: docker-compose down -v e intenta de nuevo.
    pause
)

ENDLOCAL
