**Asunto:** Credenciales de acceso y guía de despliegue — SIGP UNEFA Dashboard

**Para:** [Nombre del destinatario]

---

Hola,

Te comparto las credenciales de acceso y el paso a paso para que puedas acceder a los servicios del sistema y trabajar con los despliegues.

---

## URLs de los Servicios en Producción

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Frontend (Vercel)** | https://unefa-dashboard-ten.vercel.app | Interfaz de usuario del sistema |
| **Backend (Render)** | https://unefa-dashboard.onrender.com | API del sistema |
| **API Health Check** | https://unefa-dashboard.onrender.com/api/health | Verificar estado del backend |
| **Supabase (DB)** | https://supabase.com/dashboard/project/rgvnwslyvixviypgegra | Base de datos PostgreSQL |
| **GitHub** | https://github.com/Antony-Figueroa/UNEFA_DASHBOARD | Repositorio del código fuente |

---

## Credenciales de las Plataformas

### Vercel (Frontend)
- **URL de acceso:** https://vercel.com/antony-figueroas-projects/unefa-dashboard
- **Rol:** Owner / Team Member
- Se encarga del deploy automático del frontend cada vez que se hace push a `main`.

### Render (Backend)
- **URL de acceso:** https://dashboard.render.com
- **Rol:** Owner / Team Member
- Se encarga del deploy automático del backend. Incluye variables de entorno para API keys, conexión a Supabase, y configuración de correo.

### Supabase (Base de Datos)
- **URL de acceso:** https://supabase.com/dashboard/project/rgvnwslyvixviypgegra
- **Rol:** Owner
- Contiene toda la base de datos PostgreSQL en la nube.

---

## Cómo Empezar con Desarrollo Local

### Prerrequisitos
- Node.js 20+
- Git
- Docker Desktop (opcional, para el stack completo)

### Paso a Paso

**1. Clonar el repositorio**
```bash
git clone https://github.com/Antony-Figueroa/UNEFA_DASHBOARD.git
cd UNEFA_DASHBOARD
```

**2. Opción A — Stack completo con Docker (recomendado)**
```bash
docker-compose -f docker-compose.offline.yml up --build
```
Esto levanta:
- Backend en `http://localhost:3000`
- Frontend en `http://localhost:5173`
- Base de datos local (PGlite) embebida, sin necesidad de la nube.

**3. Opción B — Nativo (sin Docker)**
```bash
# Terminal 1: Backend
cd backend
cp .env.offline.example .env.local
npm install
npm run dev:offline

# Terminal 2: Frontend
npm install
npm run dev
```

**Importante:** El desarrollo local usa PGlite (PostgreSQL WASM embebido). No depende de Supabase Cloud. Esto evita riesgos de modificar datos de producción accidentalmente.

---

## Cómo Hacer un Despliegue

### Para un cambio normal
```bash
git checkout -b feat/mi-nueva-funcionalidad
# ... desarrollar, testear, commitear ...
git push origin feat/mi-nueva-funcionalidad
# Crear Pull Request en GitHub → Review → Merge a main
```

Cuando se mergea a `main`:
- **Vercel** hace deploy automático del frontend
- **Render** hace deploy automático del backend
- Ambos apuntan a la base de datos **Supabase Cloud** (producción)

### Para un hotfix (urgencia)
```bash
git checkout -b hotfix/descripcion main
# ... corregir, commitear ...
git push origin hotfix/descripcion
# PR directo a main → Merge
```

---

## Regla Fundamental (No Romper)

| Entorno | Base de Datos | Cómo se usa |
|---------|--------------|-------------|
| **Local (desarrollo)** | PGlite (archivo local) | `npm run dev:offline` |
| **Preview (PR)** | Supabase Cloud | Auto-deploy de Vercel + Render |
| **Producción** | Supabase Cloud | Auto-deploy al mergear a `main` |

> **NUNCA** apuntar el entorno local a Supabase Cloud.  
> **NUNCA** compartir credenciales de producción por canales no seguros.

---

## Documentación Complementaria

En el repositorio tenés la guía completa con más detalle:
- **`DEPLOYMENT_GUIDE.md`** — Credenciales, variables de entorno por entorno, troubleshooting
- **`docker-compose.offline.yml`** — Stack Docker para desarrollo local
- **`backend/.env.offline.example`** — Variables de entorno para desarrollo offline
- **`backend/Dockerfile.offline`** — Dockerfile para modo offline

---

Cualquier duda o inconveniente con los accesos, avisame.

Saludos,
Antony Figueroa