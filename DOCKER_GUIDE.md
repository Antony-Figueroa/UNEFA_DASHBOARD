# 🐳 Guía Completa de Docker - Proyecto-Unefa

Esta guía detalla los pasos para configurar, ejecutar y administrar el entorno dockerizado de desarrollo para los servicios de Frontend (React) y Backend (Node.js).

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado **Docker Desktop** y que esté en ejecución.

### 1. Verificar la instalación
Abre una terminal y ejecuta los siguientes comandos para confirmar que tu entorno está listo:

```bash
# Verificar versión de Docker
docker --version

# Verificar versión de Docker Compose
docker-compose --version
```

---

## 🚀 Ejecución del Proyecto

El archivo [docker-compose.yml](file:///c:/xampp/htdocs/workspace/TailAdmin/docker-compose.yml) ya está configurado con los servicios, redes y volúmenes necesarios.

### Pasos para iniciar:

1. **Navega al directorio raíz** del proyecto (donde se encuentra el archivo `docker-compose.yml`).
2. **Levanta los servicios**:
   ```bash
   # Iniciar en segundo plano (recomendado)
   docker-compose up -d
   ```
   *Nota: Si es la primera vez o has cambiado dependencias, usa `docker-compose up -d --build`.*

3. **Verificación de contenedores**:
   Confirma que los servicios están corriendo:
   ```bash
   docker-compose ps
   # O también:
   docker ps
   ```

---

## 🛠️ Comandos Útiles de Administración

### Gestión de Servicios
- **Ver Logs**: `docker-compose logs -f` (añade el nombre del servicio para filtrar, ej. `frontend`).
- **Reiniciar**: `docker-compose restart`
- **Detener (sin eliminar)**: `docker-compose stop`
- **Detener y Limpiar**: `docker-compose down` (elimina contenedores y redes creadas).

### Instalación de Librerías
Para instalar paquetes sin salir del contenedor y mantener la persistencia:
```bash
# Frontend
docker-compose exec frontend npm install <paquete>

# Backend
docker-compose exec backend npm install <paquete>
```

## 🔄 Sincronización y Actualización

Si ya tienes el proyecto y necesitas actualizarlo con los últimos cambios del equipo usando **GitHub Desktop**:

### 1. Actualización del repositorio local
- Abre **GitHub Desktop** y selecciona el repositorio `Proyecto-Unefa`.
- Haz clic en **"Fetch origin"** para verificar cambios remotos.
- Si hay actualizaciones, haz clic en **"Pull origin"** para sincronizar.

### 2. Reconstrucción y Reinicio
Una vez descargados los cambios, debes refrescar tus contenedores:
```bash
# Detener contenedores actuales
docker-compose down

# Reconstruir imágenes e iniciar
docker-compose up -d --build
```

### 3. Verificación
- Lista los contenedores: `docker-compose ps`
- Revisa los logs para asegurar que no hay errores de compilación: `docker-compose logs -f`

---

## 📝 Notas de Configuración

- **Frontend**: Accesible en [http://localhost:5173](http://localhost:5173).
- **Backend**: Accesible en [http://localhost:3000](http://localhost:3000).
- **Hot Reload**: Los volúmenes están configurados para mapear tu código local (`/src` y `/backend/src`) al contenedor. Los cambios se reflejarán instantáneamente.
- **Node Modules**: Se utilizan volúmenes anónimos para evitar conflictos entre las dependencias del Host y las del Contenedor Alpine.

> **Importante**: Asegúrate siempre de que Docker Desktop esté ejecutándose antes de intentar usar estos comandos.
