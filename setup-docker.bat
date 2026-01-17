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

set "ENV_ROOT=.env"
set "ENV_BACKEND=backend\.env"

if exist "%ENV_ROOT%" (
    echo ✅ %ENV_ROOT% ya existe. No se modificara.
) else (
    echo ℹ️ Creando %ENV_ROOT% desde .env.example
    copy ".env.example" "%ENV_ROOT%"
)

if exist "%ENV_BACKEND%" (
    echo ✅ %ENV_BACKEND% ya existe. No se modificara.
) else (
    echo ℹ️ Creando %ENV_BACKEND% desde .env.example
    copy "backend\.env.example" "%ENV_BACKEND%"
    echo ⚠️ ATENCION: Se ha creado %ENV_BACKEND%. DEBES EDITARLO con tus credenciales de Supabase.
    pause
)

:: Calcular hashes iniciales
echo 🔒 Registrando estado actual de archivos .env...
for /f "skip=1 delims=" %%i in ('certutil -hashfile .env MD5') do (
    if not defined ENV_ROOT_HASH set ENV_ROOT_HASH=%%i
)
for /f "skip=1 delims=" %%i in ('certutil -hashfile backend\.env MD5') do (
    if not defined ENV_BACKEND_HASH set ENV_BACKEND_HASH=%%i
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

:: 7. Verificación de integridad post-ejecución
echo 🔍 Verificando integridad de archivos .env...
for /f "skip=1 delims=" %%i in ('certutil -hashfile .env MD5') do (
    if not defined NEW_ROOT_HASH set NEW_ROOT_HASH=%%i
)
for /f "skip=1 delims=" %%i in ('certutil -hashfile backend\.env MD5') do (
    if not defined NEW_BACKEND_HASH set NEW_BACKEND_HASH=%%i
)

if "%ENV_ROOT_HASH%" neq "%NEW_ROOT_HASH%" (
    echo 🚨 ALERTA: Se detectaron cambios en el archivo .env (Raiz)!
) else if "%ENV_BACKEND_HASH%" neq "%NEW_BACKEND_HASH%" (
    echo 🚨 ALERTA: Se detectaron cambios en el archivo .env (Backend)!
) else (
    echo ✅ Integridad de archivos .env confirmada (sin cambios).
)

ENDLOCAL
