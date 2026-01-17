# 🐳 Guía de Docker - UNEFA Dashboard

Esta guía proporciona instrucciones detalladas para configurar, construir y ejecutar el proyecto utilizando Docker.

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/macOS) o Docker Engine (Linux).
- [Docker Compose](https://docs.docker.com/compose/install/) (incluido en Docker Desktop).

## 🚀 Configuración Rápida (Recomendado)

Para una configuración automática que gestiona errores y archivos `.env`:

```bash
npm run docker:start
```

*Este comando detectará automáticamente tu sistema operativo (Windows/Linux/macOS), configurará los archivos `.env` necesarios y lanzará los contenedores.*

## 🛠️ Configuración Manual (Opcional)

1. **Clonar el repositorio:**
   ```bash
   git clone <url-del-repositorio>
   cd UNEFA_DASHBOARD
   ```

2. **Variables de Entorno:**
   Si prefieres configurarlas manualmente:
   - Copia `.env.example` a `.env` en la raíz.
   - Copia `backend/.env.example` a `backend/.env`.

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
- **Seguridad:** Archivo `.env` montado como solo lectura (`:ro`).

### Backend (unefa-backend)
- **Puerto:** 3000
- **Base:** Node 20 Alpine (Multi-stage build)
- **Seguridad:** Archivo `.env` montado como solo lectura (`:ro`).
- **Comando Dev:** Utiliza `tsx` para ejecución directa de TypeScript sin necesidad de `dist`.

## 🛡️ Seguridad de Configuración

Para garantizar la integridad del sistema, se han implementado las siguientes medidas:

1. **Restricción de Escritura:** Los archivos `.env` se montan en modo de solo lectura. Ningún proceso dentro del contenedor puede modificarlos.
2. **Validación de Integridad:** Los scripts de inicio (`setup-docker.sh/bat`) verifican el hash MD5 de los archivos de configuración antes y después de lanzar Docker.
3. **Pruebas de Integridad (Healthchecks):** Docker Compose realiza pruebas automáticas periódicas para asegurar que la restricción de solo lectura se mantiene activa.

## 🧪 Verificación del Sistema

Para verificar que todo funciona correctamente:

1. **Frontend:** Accede a `http://localhost:5173`.
2. **Backend API:** Accede a `http://localhost:3000/api/health`.
3. **Prueba de Seguridad (Manual):**
   ```bash
   # Verificar backend
   docker exec unefa-backend npm run test:env
   
   # Verificar frontend
   docker exec unefa-frontend sh /app/test-env-readonly.sh
   ```
4. **Estado de Contenedores:** `docker-compose ps` (debe mostrar `healthy` en el estado).

---
*Desarrollado para el Sistema de Gestión UNEFA.*
