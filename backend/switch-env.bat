@echo off
REM Switch entre entorno local y cloud
REM Uso: switch-env local | switch-env cloud

if /i "%1"=="local" (
    if exist ".env.local" (
        copy /y ".env.local" ".env" >nul
        echo [OK] .env apunta a LOCAL
    ) else (
        echo [ERROR] No existe .env.local
        exit /b 1
    )
) else if /i "%1"=="cloud" (
    if exist ".env.cloud" (
        copy /y ".env.cloud" ".env" >nul
        echo [OK] .env apunta a CLOUD
    ) else (
        echo [ERROR] No existe .env.cloud
        exit /b 1
    )
) else (
    echo Uso: switch-env local ^| switch-env cloud
    echo.
    echo   local  - Apunta a Supabase local (Docker)
    echo   cloud  - Apunta a Supabase cloud (produccion)
)
