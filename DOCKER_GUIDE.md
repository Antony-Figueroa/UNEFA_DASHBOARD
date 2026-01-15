# 🐳 Guía de Docker - UNEFA Dashboard

Esta guía proporciona instrucciones detalladas para configurar, construir y ejecutar el proyecto utilizando Docker.

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/macOS) o Docker Engine (Linux).
- [Docker Compose](https://docs.docker.com/compose/install/) (incluido en Docker Desktop).

## 🚀 Configuración Rápida

1. **Clonar el repositorio:**
   ```bash
   git clone <url-del-repositorio>
   cd UNEFA_DASHBOARD
   ```

2. **Variables de Entorno:**
   Asegúrate de tener los archivos `.env` configurados:
   - Raíz: `.env` (Frontend)
   - Backend: `backend/.env` (Backend)

   *Nota: Si no los tienes, puedes copiar los archivos `.env.example` si están disponibles.*

3. **Construir y ejecutar:**
   ```bash
   docker-compose up --build
   ```

## 🛠️ Comandos Útiles

- **Iniciar en segundo plano:** `docker-compose up -d`
- **Detener contenedores:** `docker-compose stop`
- **Detener y eliminar contenedores/redes:** `docker-compose down`
- **Limpiar volúmenes (Solución de problemas):** `docker-compose down -v`
- **Ver logs:** `docker-compose logs -f`

## 🐳 Estructura de Docker

### Frontend (unefa-frontend)
- **Puerto:** 5173
- **Base:** Node 20 Alpine
- **HMR:** Configurado para funcionar a través del contenedor.

### Backend (unefa-backend)
- **Puerto:** 3000
- **Base:** Node 20 Alpine (Multi-stage build)
- **Dependencias:** Instalación limpia de producción en la imagen final.

## ❓ Solución de Problemas Comunes

### 1. Error: "Cannot find package 'cookie-parser'"
Este error suele ocurrir por inconsistencias en el `package-lock.json` o volúmenes corruptos.
**Solución:**
```bash
docker-compose down -v
docker-compose up --build
```

### 2. Cambios en el código no se reflejan (HMR)
En algunos sistemas (especialmente Windows con WSL2), los eventos de archivos no se propagan correctamente.
**Solución:** Asegúrate de que el proyecto esté en el sistema de archivos de WSL2 y no en `/mnt/c/`.

### 3. Error de compilación TypeScript en el Backend
Si el backend no inicia por errores de tipos:
**Solución:** El Dockerfile está configurado para fallar si `tsc` falla. Revisa los errores en la consola y corrígelos antes de re-construir.

## 🧪 Verificación del Sistema

Para verificar que todo funciona correctamente:
1. Accede a `http://localhost:5173` (Frontend).
2. Accede a `http://localhost:3000/api/health` (Backend Status).
3. Verifica la consola para asegurar que no hay errores de conexión a Supabase.

---
*Desarrollado para el Sistema de Gestión UNEFA.*
