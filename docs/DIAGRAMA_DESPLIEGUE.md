# Diagrama de Despliegue — UNEFA Dashboard v2.2.0

> **Arquitectura de despliegue actual del sistema SIGP UNEFA Dashboard**

---

## 1. Diagrama General (C4 — Nivel Contenedor)

```mermaid
flowchart TB
    subgraph Usuarios["👤 Usuarios"]
        U1[Admin Web]
        U2[Tutor Web]
        U3[Estudiante Web]
        U4[Visitante Landing]
        U5[Usuario Desktop]
    end

    subgraph CDN["🌐 Vercel Edge Network"]
        FE[Frontend SPA\nReact 19 + Vite 6\nTypeScript 5.7]
        PWA[Service Worker\nPWA Offline Cache]
        ANALYTICS[Vercel Analytics]
    end

    subgraph BE["☁️ Render Web Service"]
        API[Express.js 4.22\nAPI Gateway\nPuerto 3000]
        
        subgraph Middleware["🛡️ Middleware Stack"]
            HELMET[Helmet CSP]
            CORS[CORS Dinámico]
            AUTH_MW[Auth JWT + Cookies]
            PERF[Performance Monitor]
            RATE[Rate Limiter]
        end

        subgraph Routes["📡 51 Routes / 49 Controllers"]
            R_AUTH[Auth Routes]
            R_API[API Routes\nPeriodos, Estudiantes\nTutores, Carreras\nEvaluaciones, Tracking\n...]
            R_PUB[Public Routes\nHealth, Landing Config]
            R_AI[AI Assistant Routes]
        end

        subgraph Services["⚙️ 43 Services"]
            S_AUTH[Auth Service]
            S_EMAIL[Email\nResend + Nodemailer]
            S_AI[AI Service\nGemini + Groq]
            S_SYNC[Sync Service\nDesktop Offline]
            S_RAG[RAG Service]
            S_SSE[SSE Notifications]
            S_SCHED[Period Scheduler\nReminder Scheduler]
            S_EXPORT[Excel/PDF Export]
            S_CEDULA[Cédula API]
            S_AUDIT[Audit Service]
        end

        subgraph DB_Layer["🗄️ Database Layer"]
            DB_MANAGER[DatabaseManager\nSingleton]
            SUPABASE_ADAPTER[SupabaseAdapter\nCloud Mode]
            PGLITE_ADAPTER[PGliteAdapter\nOffline Mode]
        end
    end

    subgraph DB["💾 Supabase PostgreSQL"]
        PG[(PostgreSQL\nManaged DB)]
        MIGRATIONS[22 SQL Migrations]
    end

    subgraph External_API["🔌 APIs Externas"]
        GEMINI[Google Gemini AI]
        GROQ[Groq AI\nFallback]
        OPENROUTER[OpenRouter\nOpcional]
        RESEND[Resend Email API]
        CEDULA[Cédula API\nVenezuela ID]
    end

    subgraph Desktop["🖥️ Electron Desktop App"]
        ELECTRON[Electron 42\nMain Process]
        OFFLINE_SERVER[Express Offline\nPuerto 3001]
        PGLITE[(PGlite WASM\nPostgreSQL Local)]
        SYNC[SyncService\nSupabase → PGlite]
        RENDERER[React Renderer\nWebView]
    end

    subgraph Dev["🐳 Docker Development"]
        DOCKER_FE[Frontend Container\nVite Dev :5173]
        DOCKER_BE[Backend Container\ntsx watch :3000]
        DOCKER_NET[Bridge Network\nunefa-network]
    end

    %% Conexiones Frontend
    U1 --> FE
    U2 --> FE
    U3 --> FE
    U4 --> FE
    U5 --> ELECTRON
    FE --> PWA
    FE --> ANALYTICS

    %% Frontend → Backend (Vercel → Render)
    FE -->|HTTP/HTTPS\n/api/* proxy| API
    FE -->|Auth via\nhttpOnly cookies| AUTH_MW

    %% Backend interno
    API --> HELMET --> CORS --> AUTH_MW --> PERF --> RATE
    RATE --> Routes
    Routes --> Services
    Services --> DB_Layer
    DB_Layer --> SUPABASE_ADAPTER --> DB_MANAGER
    DB_MANAGER -->|cloud mode| PG

    %% Backend → APIs externas
    S_AI --> GEMINI
    S_AI --> GROQ
    S_AI --> OPENROUTER
    S_EMAIL --> RESEND
    S_CEDULA --> CEDULA

    %% Desktop offline
    ELECTRON --> RENDERER
    ELECTRON --> OFFLINE_SERVER
    OFFLINE_SERVER --> PGLITE
    SYNC -->|initial sync| PG
    SYNC --> PGLITE
    DB_MANAGER -->|offline mode| PGLITE_ADAPTER --> PGLITE

    %% Docker dev
    DOCKER_FE --> DOCKER_NET
    DOCKER_BE --> DOCKER_NET
    DB_MANAGER -.->|Docker dev\nvia .env| PG
```

---

## 2. Diagrama de Red y Puertos

```mermaid
flowchart LR
    subgraph Internet["🌍 Internet"]
        VERCEL_DOMAIN["unefa-dashboard.vercel.app\n:443"]
        RENDER_DOMAIN["unefa-dashboard.onrender.com\n:443"]
    end

    subgraph Vercel["▲ Vercel Edge"]
        VERCEL_FE["/ → index.html\nSPA Static"]
        VERCEL_API["/api/* → proxy\nonrender.com"]
        VERCEL_ASSETS["Assets\nCache CDN"]
    end

    subgraph Render["☁️ Render Web Service"]
        RENDER_API["Express API\n:3000"]
        RENDER_HEALTH["/api/health\n/db-status"]
    end

    subgraph Supabase["⚡ Supabase Cloud"]
        SUPABASE_API["API Gateway\n:443"]
        SUPABASE_PG["PostgreSQL 15\n:5432"]
    end

    USER_HTTP["Usuario\nBrowser"] -->|"GET https://unefa-dashboard.vercel.app"| VERCEL_DOMAIN
    VERCEL_DOMAIN --> VERCEL_FE
    VERCEL_DOMAIN --> VERCEL_API
    VERCEL_API -->|"proxy_pass"| RENDER_DOMAIN
    RENDER_DOMAIN --> RENDER_API
    RENDER_API -->|"JWT auth cookies"| SUPABASE_API
    SUPABASE_API --> SUPABASE_PG

    style USER_HTTP fill:#f9f,stroke:#333
    style VERCEL_DOMAIN fill:#6cf,stroke:#333
    style RENDER_DOMAIN fill:#fc3,stroke:#333
    style SUPABASE_PG fill:#3c6,stroke:#333
```

---

## 3. Stack Tecnológico por Capa

### 3.1 Frontend (Vercel)

| Componente | Tecnología | Versión |
|-----------|-----------|---------|
| Framework UI | React | 19.0.0 |
| Bundler | Vite | 6.1.0 |
| Lenguaje | TypeScript | 5.7.2 |
| Estilos | Tailwind CSS | 4.1.18 |
| Routing | React Router | 7.1.5 |
| Forms | React Hook Form + Zod | 7.69.0 / 4.3.6 |
| HTTP | Axios | 1.13.2 |
| PWAs | vite-plugin-pwa | 1.3.0 |
| Analytics | @vercel/analytics | 1.6.1 |
| Testing | Vitest + Playwright | 4.0.16 / 1.58.2 |
| Storybook | Storybook | 8.0.0 |

### 3.2 Backend (Render)

| Componente | Tecnología | Versión |
|-----------|-----------|---------|
| Runtime | Node.js | >= 18.x |
| Framework | Express.js | 4.21.2 |
| Lenguaje | TypeScript | 5.7.2 |
| DB Cliente | Supabase JS + Prisma | 2.90.1 / 7.5.0 |
| Auth | JWT + Bcrypt + Cookies | — |
| Seguridad | Helmet + CORS | 8.0.0+ |
| Email | Resend + Nodemailer | 6.12.4+ |
| AI | Google Gemini (primary), Groq (fallback) | — |
| File Upload | Multer | 2.0.2 |

### 3.3 Desktop (Electron)

| Componente | Tecnología | Versión |
|-----------|-----------|---------|
| Shell | Electron | 42.3.0 |
| DB Local | PGlite (PostgreSQL WASM) | 0.4.6 |
| Builder | electron-builder | 26.8.1 |
| Instalador | NSIS (Windows) | — |

### 3.4 Infraestructura

| Componente | Proveedor | Detalle |
|-----------|-----------|---------|
| Frontend Host | Vercel | SPA + CDN + PWA |
| Backend Host | Render | Web Service Node |
| Database | Supabase | PostgreSQL managed |
| CI/CD | GitHub Actions | Build + test + deploy |
| Container | Docker Compose | Desarrollo multi-stage |
| Email | Resend | Transaccional |

---

## 4. Flujo de Request (Producción)

```
Browser
  │
  ├─ HTTPS ──► Vercel Edge Network
  │              │
  │              ├─ GET /             → index.html (SPA)
  │              ├─ GET /dashboard    → index.html (SPA, client routing)
  │              ├─ /assets/*        → Cache CDN (js, css, png, svg)
  │              │
  │              └─ /api/*           → Proxy Rewrite
  │                                    ↓
  │                              Render Web Service
  │                                    │
  │                                    ├─ /api/health            → 200
  │                                    ├─ /api/auth/*            → Auth Controller
  │                                    ├─ /api/periodos/*        → Periods Controller
  │                                    ├─ /api/students/*        → Students Controller
  │                                    ├─ ... (51 routes)
  │                                    │
  │                                    ├─ Middleware stack
  │                                    │   ├─ Helmet (CSP)
  │                                    │   ├─ CORS (dynamic origin)
  │                                    │   ├─ Auth JWT (cookie-based)
  │                                    │   └─ Rate limiting
  │                                    │
  │                                    └─ DatabaseManager
  │                                         └─ SupabaseClient
  │                                              └─ PostgreSQL (via REST)
  │
  └─ WebSocket ◄── SSE /api/notifications/stream (solo modo tradicional)
```

---

## 5. Modos de Operación

### 5.1 Modo Cloud (Producción / Desarrollo online)

```
Frontend (Vercel) ───► Backend (Render) ───► Supabase PostgreSQL
```

- Sesiones con cookies httpOnly + JWT
- Refresh automático de sesión (auto-refresh interceptor)
- Notificaciones en tiempo real vía SSE
- Schedulers de periodo y recordatorios

### 5.2 Modo Offline (Desktop Electron)

```
React (WebView) ◄──► Express Offline (:3001) ◄──► PGlite WASM
                                              ▲
                                              │ SyncService
                                              │ (al iniciar)
                                              ▼
                                        Supabase PostgreSQL
```

- PGliteAdapter traduce queries estilo Supabase a SQL parametrizado
- SyncService sincroniza datos desde Supabase al iniciar
- Controllers no cambian: usan `dbManager.getConnection()`
- Password por defecto: admin123 (desarrollo)
- Sin SSE, sin schedulers

### 5.3 Modo Docker (Desarrollo local)

```
docker-compose up --build
  ├─ Frontend Container (:5173) ←→ Backend Container (:3000)
  └─ Ambos en unefa-network (bridge)
```

- `.env` montado como solo lectura (`:ro`)
- Healthchecks periódicos de integridad
- Hot Module Replacement (HMR)

---

## 6. Migraciones y Base de Datos

| # | Migration | Descripción |
|---|-----------|-------------|
| 001 | `create_persons` | Tabla unificada de personas |
| 002 | `migrate_persons_data` | Migración de datos existentes |
| 003 | `add_person_fks` | Foreign keys de persona |
| 004 | `add_remaining_person_fks` | FKs restantes |
| 004b | `add_person_fk_triggers` | Triggers de integridad |
| 005 | `permissions_module` | Módulo de permisos |
| 006 | `reports_module` | Reportes |
| 007 | `prospect_lists` | Listas de prospectos |
| 008 | `comite_member_index` | Índices de comité |
| 009 | `email_templates` | Plantillas de email |
| 010 | `knowledge_base` | Base de conocimiento RAG |
| 011 | `add_grace_days` | Días de gracia |
| 012 | `create_academic_config` | Configuración académica |
| 013 | `add_period_validation_config` | Validación de periodos |
| 014 | `seed_transfer` / `text_normalization` | Datos semilla + normalización |
| 015 | `system_institution` | Institución del sistema |
| V002–V005 | Varios | Performance indexes, RPCs, titles |

---

## 7. Variables de Entorno Críticas

### Frontend (.env raíz)

```
VITE_API_URL=http://localhost:3000/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GOOGLE_AI_KEY=your-google-ai-key
VITE_OPENROUTER_KEY=
GROQ_API_KEY=your-groq-api-key
```

### Backend (backend/.env)

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
RESEND_API_KEY=your-resend-key
GOOGLE_AI_KEY=your-google-key
GROQ_API_KEY=your-groq-key
CEDULA_APP_ID=your-cedula-app-id
CEDULA_TOKEN=your-cedula-token
DATABASE_URL="file:./dev.db"
```

---

## 8. Seguridad

- **CSP estricto**: Helmet con directivas específicas para CartoDB, OSM, ArcGIS, Google Fonts
- **CORS dinámico**: Lista blanca desde `ALLOWED_ORIGINS` env var
- **Cookies httpOnly**: Sesión JWT no accesible desde JavaScript
- **Auto-refresh de sesión**: Renovación silenciosa ante 401
- **Rate limiting**: Middleware de límite por IP
- **Docker .env readonly**: Archivos montados como `:ro` + verificación MD5
- **Sanitización de queries**: PGliteAdapter usa SQL parametrizado
- **Error handler global**: Captura y normaliza errores

---

## 9. Monitoreo

- **Health endpoint**: `/api/health` con estado de DB + latencia
- **DB Status endpoint**: `/api/db-status` para verificación de conexión
- **Performance middleware**: Mide latencia de requests
- **Request logging**: Log de método + URL + origin
- **Error logging**: Console con niveles (error/warn)
- **Vercel Analytics**: Analítica de uso en frontend
- **Audit service**: Registro de operaciones críticas

---

## 10. URLs de Producción

| Recurso | URL |
|---------|-----|
| Frontend (Vercel) | `https://unefa-dashboard.vercel.app` |
| Backend (Render) | `https://unefa-dashboard.onrender.com` |
| API Health | `https://unefa-dashboard.onrender.com/api/health` |
| Supabase Dashboard | Panel de Supabase (privado) |
| Repositorio | `https://github.com/Antony-Figueroa/UNEFA_DASHBOARD` |

---

> **Nota**: Las URLs de producción pueden variar según la configuración actual del proyecto.
> Verificar en `vercel.json` y `Render Dashboard` para las URLs activas.
