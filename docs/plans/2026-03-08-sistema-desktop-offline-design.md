# Plan de Implementación: Sistema de Gestión Académica Offline-First

**Versión del Documento**: 1.0  
**Fecha de Creación**: 2026-03-08  
**Proyecto**: UNEFA Dashboard - Conversión a Aplicación de Escritorio Offline  
**Estado**: En Revisión  

---

## 1. Resumen Ejecutivo

Este documento presenta la planificación detallada para convertir el sistema de gestión académica web existente (React + Node.js + Supabase) en una aplicación de escritorio ejecutable de manera offline, manteniendo una base de datos PostgreSQL local idéntica a la nube con sincronización asíncrona.

**Objetivo Principal**: Encapsular el sistema web actual en una aplicación de escritorio que funcione 100% en local, con capacidad de sincronizar datos con Supabase cuando exista conexión a internet.

**Restricciones Clave**:
- Mantener PostgreSQL local (no SQLite)
- No usar Docker para el usuario final
- Minimizar modificaciones al código existente
- Sistema 100% funcional offline

---

## 2. Tecnologías y Versiones

### 2.1 Stack Actual del Proyecto

| Componente | Tecnología | Versión Actual | Notas |
|------------|------------|----------------|-------|
| Frontend Framework | React | 19.0.0 | - |
| Lenguaje Frontend | TypeScript | ~5.7.2 | strict mode |
| Build Tool | Vite | 6.1.0 | - |
| Estilos | Tailwind CSS | 4.1.18 | - |
| Routing | React Router | 7.1.5 | - |
| HTTP Client | Axios | 1.13.2 | - |
| Backend Framework | Express.js | 4.22.1 | - |
| Base de Datos Cloud | Supabase (PostgreSQL) | PostgreSQL 15+ | Gestionado |
| Auth | JWT + Bcryptjs | - | - |
| Runtime Backend | Node.js | >= 18.x | - |

### 2.2 Stack Propuesto para Desktop

| Componente | Tecnología | Versión Propuesta | Justificación |
|------------|------------|-------------------|---------------|
| Contenedor Desktop | Tauri | 2.x | Ligero, seguro, binario pequeño |
| Backend Incrustado | Node.js | 20.x LTS | Runtime embebido en Tauri |
| PostgreSQL Local | PostgreSQL | 16.x portable | Binarios distribuidos con la app |
| driver PG | pg | ^8.11.0 | Conexión a PostgreSQL local |
| Scheduler | node-cron | ^3.0.0 | Tareas de sincronización periódicas |
| UI Backend | Tauri API | 2.x | Comandos IPC |

### 2.3 Compatibilidad

- **Windows**: Windows 10/11 (x64) - WebView2 requerido
- **macOS**: macOS 11+ (x64, ARM64) - WebKit incluido
- **Linux**: Ubuntu 20.04+, Fedora 35+ - WebKitGTK requerido

---

## 3. Análisis de Modificaciones

### 3.1 Lo que NO debe cambiar

| Área | Justificación |
|------|---------------|
| Lógica de negocio en controllers | Las reglas de validación y procesos unchanged |
| Componentes React UI | Interfaz idéntica al sistema web |
| Esquema de base de datos | Mismas tablas, columnas, restricciones |
| Rutas API Express | Endpoints permanecen iguales |
| Validadores Zod | Esquemas de validación unchanged |
| Hooks y servicios existentes | Lógica de negocio intacta |

### 3.2 Lo que SÍ debe cambiar (Capa de Infraestructura)

| Componente | Cambio Requerido | Impacto |
|------------|------------------|---------|
| `src/lib/supabase.ts` | Nuevo cliente para PostgreSQL local | Bajo |
| `backend/src/lib/db.ts` | Adapter de conexión local | Bajo |
| Sync Engine | Componente **nuevo** | Alto |
| `apiClient.ts` | Endpoint dinámico (local/cloud) | Bajo |
| Configuración | Variables de modo offline | Bajo |

### 3.3 Principio de Diseño

> **Objetivo**: El sistema debe ser **idémtico** en ambos lugares (cloud y local)

Esto se logra mediante el patrón **Adapter**:
- El código de controllers/servicios NO conoce la fuente de datos
- Se inyecta el adapter correcto (Supabase o LocalPostgres) según el modo
- La API REST es la misma, solo cambia el backend al que apunta el frontend

---

## 4. Estructura de Carpetas Propuesta

```
unefa-desktop/
│
├── src-tauri/                         # Configuración Tauri
│   ├── src/
│   │   ├── main.rs                    # Punto de entrada Rust
│   │   ├── lib.rs                     # Librería principal
│   │   ├── commands.rs                # Comandos IPC
│   │   ├── database.rs                # Gestión PostgreSQL
│   │   └── sync.rs                    # Lógica sincronización Rust
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── icons/
│   └── build.rs
│
├── resources/                         # Recursos estáticos
│   ├── postgresql/
│   │   ├── bin/                       # Binarios PostgreSQL
│   │   │   ├── pg_ctl
│   │   │   ├── postgres
│   │   │   └── psql
│   │   ├── lib/
│   │   └── data/                      # Directorio de datos inicial
│   ├── scripts/
│   │   ├── init-db.ps1                # Inicialización Windows
│   │   ├── init-db.sh                 # Inicialización Linux/Mac
│   │   └── setup-first-run.ps1        # Setup inicial
│   └── assets/
│
├── backend/                           # Express.js (incrustado)
│   ├── src/
│   │   ├── server.ts
│   │   ├── app.ts
│   │   ├── lib/
│   │   │   ├── supabase.ts            # Cliente Supabase (cloud)
│   │   │   ├── db.ts                  # Cliente PostgreSQL (local)
│   │   │   └── db-adapter.ts          # Adapter unify
│   │   ├── services/
│   │   │   ├── sync.service.ts        # Motor sincronización
│   │   │   ├── sync-queue.service.ts
│   │   │   └── conflict-resolver.ts
│   │   ├── routes/                    # (existente)
│   │   └── controllers/                # (existente)
│   ├── package.json
│   └── dist/
│
├── frontend/                          # React (incrustado)
│   ├── src/
│   │   ├── lib/
│   │   │   ├── supabase.ts            # Cliente Supabase
│   │   │   ├── local-db.ts            # Cliente API local
│   │   │   └── api-client.ts          # Cliente unificado
│   │   ├── context/
│   │   │   ├── SyncContext.tsx       # Estado sincronización
│   │   │   ├── OfflineContext.tsx    # Modo offline
│   │   │   └── AppModeContext.tsx     # Modo cloud/local
│   │   ├── hooks/
│   │   │   ├── useSync.ts
│   │   │   ├── useOfflineData.ts
│   │   │   └── useAppMode.ts
│   │   └── ...                        # (estructura existente)
│   ├── package.json
│   └── dist/
│
├── shared/                            # Tipos compartidos
│   ├── types/
│   │   ├── sync.types.ts
│   │   ├── database.types.ts
│   │   └── app-mode.types.ts
│   └── constants/
│       ├── sync.constants.ts
│       └── app.constants.ts
│
├── scripts/                           # Scripts de build
│   ├── build-all.ps1                  # Build completo
│   ├── build-frontend.ps1
│   ├── build-backend.ps1
│   ├── build-tauri.ps1
│   └── package-app.ps1
│
├── package.json                       # Root package.json
├── tsconfig.desktop.json
└── README-DESKTOP.md
```

---

## 5. Modelo de Datos para Sincronización

### 5.1 Tablas de Sistema (Nuevas)

```sql
-- Tabla de metadatos de sincronización
CREATE TABLE sync_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID NOT NULL UNIQUE,
    instance_name VARCHAR(255) NOT NULL,
    last_sync_at TIMESTAMPTZ,
    last_sync_status VARCHAR(50), -- 'completed', 'failed', 'in_progress'
    sync_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de cola de sincronización
CREATE TABLE sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    operation VARCHAR(10) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    payload JSONB NOT NULL,
    attempt_count INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    priority INT DEFAULT 0,
    
    CONSTRAINT unique_pending UNIQUE (table_name, record_id, operation, status)
);

-- Tabla de conflictos
CREATE TABLE sync_conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    local_version JSONB NOT NULL,
    remote_version JSONB NOT NULL,
    resolution_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'resolved_local', 'resolved_remote', 'manual'
    resolved_at TIMESTAMPTZ,
    resolved_by VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de rendimiento
CREATE INDEX idx_sync_queue_status ON sync_queue(status, created_at);
CREATE INDEX idx_sync_queue_table ON sync_queue(table_name, record_id);
CREATE INDEX idx_sync_conflicts_status ON sync_conflicts(resolution_status);
```

### 5.2 Columnas de Seguimiento por Tabla

```sql
-- Aplicar a cada tabla existente
ALTER TABLE {table_name} 
ADD COLUMN IF NOT EXISTS sync_version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS sync_origin VARCHAR(50) DEFAULT 'local', -- 'local' o 'cloud'
ADD COLUMN IF NOT EXISTS sync_deleted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS instance_id UUID REFERENCES sync_metadata(instance_id),
ADD COLUMN IF NOT EXISTS last_modified_by VARCHAR(100),
ADD COLUMN IF NOT EXISTS local_updated_at TIMESTAMPTZ DEFAULT NOW();

-- Índice para búsquedas de sincronización
CREATE INDEX IF NOT EXISTS idx_{table_name}_sync ON {table_name}(sync_origin, local_updated_at) 
WHERE sync_deleted = false;
```

---

## 6. Diagramas de Flujo

### 6.1 Flujo General de la Aplicación

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          APLICACIÓN DE ESCRITORIO                          │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        FRONTEND (React)                             │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐     │    │
│  │  │   Pages      │  │  Components  │  │  Contexts           │     │    │
│  │  │   (exist)    │  │   (exist)    │  │  - AppModeContext   │     │    │
│  │  └──────┬───────┘  └──────┬───────┘  │  - SyncContext      │     │    │
│  │         │                  │          │  - OfflineContext   │     │    │
│  │         └──────────────────┼──────────┴──────────────────────┘     │    │
│  │                            │                                        │    │
│  │                   ┌────────▼────────┐                              │    │
│  │                   │   API Client     │                              │    │
│  │                   │  (axios local)   │                              │    │
│  │                   └────────┬────────┘                              │    │
│  └────────────────────────────┼────────────────────────────────────────┘    │
│                               │                                            │
│  ┌────────────────────────────┼────────────────────────────────────────┐    │
│  │                    BACKEND (Express)                                │    │
│  │                   ┌────────▼────────┐                              │    │
│  │                   │   Middlewares   │                              │    │
│  │                   │   (exist)       │                              │    │
│  │                   └────────┬────────┘                              │    │
│  │                            │                                        │    │
│  │         ┌──────────────────┼──────────────────┐                   │    │
│  │         │                  │                  │                   │    │
│  │   ┌─────▼─────┐    ┌──────▼──────┐    ┌──────▼──────┐            │    │
│  │   │  Routes   │    │ Controllers  │    │  Services   │            │    │
│  │   │  (exist)  │    │   (exist)    │    │  (exist)    │            │    │
│  │   └─────┬─────┘    └──────┬──────┘    └──────┬──────┘            │    │
│  │         │                  │                  │                   │    │
│  │         └──────────────────┼──────────────────┘                   │    │
│  │                            │                                        │    │
│  │                   ┌────────▼────────┐                              │    │
│  │                   │   DB Adapter    │                              │    │
│  │                   │  (unificado)    │                              │    │
│  │                   └────────┬────────┘                              │    │
│  └────────────────────────────┼────────────────────────────────────────┘    │
│                               │                                            │
│         ┌──────────────────────┼──────────────────────┐                    │
│         │                      │                      │                    │
│   ┌─────▼─────┐         ┌──────▼──────┐        ┌──────▼──────┐           │
│   │ PostgreSQL│         │  Sync Queue │        │ Sync Engine │           │
│   │  Local   │◄────────│  (memoria)  │◄───────│  (background)│          │
│   └──────────┘         └─────────────┘        └──────┬──────┘           │
│                                                        │                   │
└────────────────────────────────────────────────────────┼───────────────────┘
                                                         │
                                                         │ (cuando hay internet)
                                                         ▼
                                              ┌──────────────────┐
                                              │    SUPABASE      │
                                              │  (PostgreSQL     │
                                              │   Cloud)         │
                                              └──────────────────┘
```

### 6.2 Flujo del Motor de Sincronización

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MOTOR DE SINCRONIZACIÓN                             │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     1. VERIFICAR CONECTIVIDAD                        │   │
│  │                                                                      │   │
│  │         ┌──────────────────┐                                       │   │
│  │         │  Ping a Supabase │                                       │   │
│  │         └────────┬─────────┘                                       │   │
│  │                  │                                                   │   │
│  │        ┌────────▼─────────┐                                         │   │
│  │        │  ¿Hay conexión?  │                                         │   │
│  │        └────────┬─────────┘                                         │   │
│  │          SI    │    NO                                                │   │
│  │     ┌──────────┼──────────┐                                          │   │
│  │     │          │          │                                          │   │
│  │     ▼          │          ▼                                          │   │
│  │  [CONTINUAR]   │  [PROGRAMAR REINTENTO - 5min]                       │   │
│  │                 │          │                                          │   │
│  └─────────────────┼──────────┼──────────────────────────────────────────┘   │
│                    │          │                                             │
│                    ▼          │                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     2. SINCRONIZACIÓN ASCENDENTE                      │   │
│  │                      (Local → Cloud)                                 │   │
│  │                                                                      │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │  SELECT * FROM sync_queue                                    │   │   │
│  │  │  WHERE status = 'pending'                                     │   │   │
│  │  │  ORDER BY created_at ASC                                     │   │   │
│  │  └──────────────────────────┬───────────────────────────────────┘   │   │
│  │                             │                                         │   │
│  │                    ┌────────▼─────────┐                               │   │
│  │                    │ ¿Hay registros?  │                               │   │
│  │                    └────────┬─────────┘                               │   │
│  │                      SI    │    NO                                     │   │
│  │                 ┌───────────┼───────────┐                              │   │
│  │                 │           │           │                              │   │
│  │                 ▼           │           ▼                              │   │
│  │  ┌────────────────────┐    │    ┌───────────────┐                     │   │
│  │  │ Por cada registro: │    │    │ [FIN]         │                     │   │
│  │  │ - INSERT: POST      │    │    │ No hay cambios │                     │   │
│  │  │ - UPDATE: PUT      │    │    │ por subir      │                     │   │
│  │  │ - DELETE: DELETE   │    │    └───────────────┘                     │   │
│  │  │                    │    │                                          │   │
│  │  │  ┌─────────────────▼─────┐ │                                     │   │
│  │  │  │  ¿Éxito en Supabase?  │ │                                     │   │
│  │  │  └─────────────────┬───────┘ │                                     │   │
│  │  │            SI      │    NO   │                                     │   │
│  │  │        ┌──────────┼──────────┐                                   │   │
│  │  │        │          │          │                                   │   │
│  │  │        ▼          │          ▼                                   │   │
│  │  │   [ACTUALIZAR]    │   [INCREMENTAR]                             │   │
│  │  │   status='completed'│  attempt_count                              │   │
│  │  │   processed_at     │  error_message                               │   │
│  │  │        │          │          │                                   │   │
│  │  └────────┼──────────┼──────────┘                                   │   │
│  │           │          │                                               │   │
│  └───────────┼──────────┼───────────────────────────────────────────────┘   │
│              │          │                                                   │
│              ▼          │                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     3. RESOLUCIÓN DE CONFLICTOS                     │   │
│  │                                                                      │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │  Verificar si el registro existe en Supabase                │   │   │
│  │  │  Y fue modificado después de last_sync_at                    │   │   │
│  │  └──────────────────────────┬───────────────────────────────────┘   │   │
│  │                             │                                         │   │
│  │                    ┌────────▼─────────┐                               │   │
│  │                    │ ¿Hay conflicto?  │                               │   │
│  │                    └────────┬─────────┘                               │   │
│  │                      SI    │    NO                                     │   │
│  │                 ┌──────────┼──────────┐                              │   │
│  │                 │          │          │                              │   │
│  │                 ▼          │          ▼                              │   │
│  │  ┌────────────────────┐    │    ┌───────────────┐                     │   │
│  │  │ Insertar en        │    │    │ [CONTINUAR]   │                     │   │
│  │  │ sync_conflicts     │    │    │               │                     │   │
│  │  │ para revisión     │    │    └───────────────┘                     │   │
│  │  │ manual             │    │                                          │   │
│  │  └────────────────────┘    │                                          │   │
│  └────────────────────────────┼──────────────────────────────────────────┘   │
│                               │                                             │
│                               ▼                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                  4. SINCRONIZACIÓN DESCENDENTE                       │   │
│  │                      (Cloud → Local)                                 │   │
│  │                                                                      │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │  SELECT * FROM remote_tables                                 │   │   │
│  │  │  WHERE updated_at > last_sync_at                             │   │   │
│  │  │  AND origin = 'cloud'                                         │   │   │
│  │  └──────────────────────────┬───────────────────────────────────┘   │   │
│  │                             │                                         │   │
│  │                    ┌────────▼─────────┐                               │   │
│  │                    │ ¿Hay registros?  │                               │   │
│  │                    └────────┬─────────┘                               │   │
│  │                      SI    │    NO                                     │   │
│  │                 ┌───────────┼───────────┐                              │   │
│  │                 │           │           │                              │   │
│  │                 ▼           │           ▼                              │   │
│  │  ┌────────────────────┐    │    ┌───────────────┐                     │   │
│  │  │ INSERT/UPDATE local│    │    │ [ACTUALIZAR]  │                     │   │
│  │  │ con conflict check │    │    │ metadata      │                     │   │
│  │  │                    │    │    │ last_sync     │                     │   │
│  │  └────────┬───────────┘    │    └───────┬───────┘                     │   │
│  │           │                │            │                             │   │
│  └───────────┼────────────────┼────────────┼──────────────────────────────┘   │
│              │                │            │                                 │
│              ▼                │            ▼                                 │
│  ┌────────────────────────┐   │   ┌──────────────────┐                       │
│  │    5. ACTUALIZAR       │   │   │   SINCRONIZACIÓN │                       │
│  │    METADATOS           │   │   │   COMPLETADA     │                       │
│  │    - last_sync_at      │   │   └──────────────────┘                       │
│  │    - last_sync_status │   │                                                │
│  └────────────────────────┘   │                                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

### 6.3 Flujo de Inicialización de la Aplicación

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    INICIALIZACIÓN DE LA APLICACIÓN                         │
│                                                                             │
│  ┌─────────────────┐                                                       │
│  │  Ejecutar .exe   │                                                       │
│  └────────┬────────┘                                                       │
│           │                                                                │
│           ▼                                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    1. DETECTAR ENTORNO                              │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │  ¿Existe directorio de datos PostgreSQL local?               │   │   │
│  │  └──────────────────────────┬────────────────────────────────────┘   │   │
│  │                             │                                          │   │
│  │                    ┌────────▼─────────┐                               │   │
│  │                    │ ¿Existe?         │                               │   │
│  │                    └────────┬─────────┘                               │   │
│  │                      SI     │    NO                                    │   │
│  │                 ┌───────────┼───────────┐                              │   │
│  │                 │           │           │                              │   │
│  │                 ▼           │           ▼                              │   │
│  │  ┌────────────────────┐     │    ┌─────────────────────┐               │   │
│  │  │ [SIGUIENTE]       │     │    │ 1.1 INICIALIZAR PG  │               │   │
│  │  │                   │     │    │    - Crear dirs    │               │   │
│  │  └────────────────────┘     │    │    - Init cluster  │               │   │
│  │                             │    │    - Copiar schema│               │   │
│  │                             │    │    - Insert data  │               │   │
│  │                             │    └────────┬─────────┘               │   │
│  │                             │             │                          │   │
│  └─────────────────────────────┼─────────────┼──────────────────────────┘   │
│                                │             │                              │
│                                ▼             │                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    2. INICIAR SERVICIOS                             │   │
│  │                                                                      │   │
│  │  ┌────────────────────┐  ┌────────────────────┐                    │   │
│  │  │ Iniciar PostgreSQL │  │ Iniciar Backend    │                    │   │
│  │  │ (proceso hijo)     │  │ Express (Node.js) │                    │   │
│  │  │ localhost:5432     │  │ localhost:3000      │                    │   │
│  │  └────────┬───────────┘  └─────────┬──────────┘                    │   │
│  │           │                        │                                │   │
│  │     ┌──────▼──────┐           ┌─────▼──────┐                       │   │
│  │     │ ¿Inició OK? │           │ ¿Inició OK?│                       │   │
│  │     └──────┬──────┘           └─────┬──────┘                       │   │
│  │       SI   │   NO                  │  SI                           │   │
│  │    ┌───────┴───────┐          ┌────┴────┐                          │   │
│  │    │               │          │         │                          │   │
│  │    ▼               ▼          ▼         ▼                          │   │
│  │  [REINTENTAR]   [ERROR]  [CONTINUAR] [ERROR]                       │   │
│  │    (3 intentos)   └────────► [ABORTAR]  └────────► [ABORTAR]       │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                │                                           │
│                                ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    3. VERIFICAR DATOS                               │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │  ¿ sync_metadata tiene registros?                           │   │   │
│  │  └──────────────────────────┬────────────────────────────────────┘   │   │
│  │                             │                                          │   │
│  │                    ┌────────▼─────────┐                               │   │
│  │                    │ ¿Tiene datos?    │                               │   │
│  │                    └────────┬─────────┘                               │   │
│  │                      SI     │    NO                                    │   │
│  │                 ┌───────────┼───────────┐                              │   │
│  │                 │           │           │                              │   │
│  │                 ▼           │           ▼                              │   │
│  │  ┌────────────────────┐   │    ┌─────────────────────┐               │   │
│  │  │ [SIGUIENTE]         │   │    │ Generar instance_id │               │   │
│  │  │ Modo offline/listo │   │    │ Insertar metadata   │               │   │
│  │  └────────────────────┘   │    │ [LISTO]             │               │   │
│  │                            │    └─────────────────────┘               │   │
│  └────────────────────────────┴──────────────────────────────────────────┘   │
│                                │                                            │
│                                ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    4. ABRIR INTERFAZ                                │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │  - Abrir ventana del navegador embebido (Tauri WebView)      │   │   │
│  │  │  - Apuntar a http://localhost:3000 (Backend)                 │   │   │
│  │  │  - Frontend carga y conecta a API local                     │   │   │
│  │  │  - Sync Engine inicia en background (si hay internet)        │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │                    [APLICACIÓN LISTA]                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.4 Flujo de Escritura de Datos (Offline-First)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ESCRITURA DE DATOS (OFFLINE-FIRST)                      │
│                                                                             │
│  ┌─────────────────┐                                                       │
│  │ Usuario ejecuta │                                                       │
│  │ acción (CREATE/│                                                       │
│  │ UPDATE/DELETE)  │                                                       │
│  └────────┬────────┘                                                       │
│           │                                                                 │
│           ▼                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      FRONTEND                                        │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │  1. Enviar petición HTTP a API local (localhost:3000)       │   │   │
│  │  │     - POST /api/students                                    │   │   │
│  │  │     - Body: { name: "Juan", ... }                           │   │   │
│  │  └──────────────────────────┬───────────────────────────────────┘   │   │
│  │                             │                                         │   │
│  │                             ▼                                         │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │  2. Actualizar UI optimísticamente                          │   │   │
│  │  │     - Mostrar nuevo registro inmediatamente                  │   │   │
│  │  │     - Pending indicator si es offline                        │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  └──────────────────────────────┬──────────────────────────────────────┘   │
│                                 │                                          │
│  ┌──────────────────────────────┼──────────────────────────────────────┐   │
│  │                      BACKEND                                         │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │  3. Controller procesa la petición                          │   │   │
│  │  │     - Valida datos (Zod)                                    │   │   │
│  │  │     - Ejecuta lógica de negocio                             │   │   │
│  │  │     - Llama al Service                                      │   │   │
│  │  └──────────────────────────┬───────────────────────────────────┘   │   │
│  │                             │                                         │   │
│  │                             ▼                                         │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │  4. Service ejecuta SQL en PostgreSQL local                 │   │   │
│  │  │                                                              │   │   │
│  │  │  BEGIN TRANSACTION;                                         │   │   │
│  │  │                                                              │   │   │
│  │  │  INSERT INTO students (...)                                  │   │   │
│  │  │    VALUES (...)                                              │   │   │
│  │  │    RETURNING *;                                              │   │   │
│  │  │                                                              │   │   │
│  │  │  -- Columnas de sync                                        │   │   │
│  │  │  UPDATE students SET                                        │   │   │
│  │  │    sync_version = 1,                                        │   │   │
│  │  │    sync_origin = 'local',                                   │   │   │
│  │  │    instance_id = ?,                                         │   │   │
│  │  │    local_updated_at = NOW()                                 │   │   │
│  │  │  WHERE id = ?;                                              │   │   │
│  │  │                                                              │   │   │
│  │  │  -- Insertar en cola de sync                               │   │   │
│  │  │  INSERT INTO sync_queue (...)                               │   │   │
│  │  │    VALUES ('INSERT', ?, ?);                                 │   │   │
│  │  │                                                              │   │   │
│  │  │  COMMIT;                                                    │   │   │
│  │  │                                                              │   │   │
│  │  └──────────────────────────┬───────────────────────────────────┘   │   │
│  │                             │                                         │   │
│  │  ┌─────────────┐    ┌───────▼───────┐    ┌──────────────────┐        │   │
│  │  │  ¿Éxito?    │    │               │    │                  │        │   │
│  │  └──────┬──────┘    │               │    │                  │        │   │
│  │      SI │ NO        │               │    │                  │        │   │
│  │   ┌─────┴─────┐     │               │    │                  │        │   │
│  │   │           │     │               │    │                  │        │   │
│  │   ▼           ▼     │               │    │                  │        │   │
│  │  [RESP]    [ERROR] │               │    │                  │        │   │
│  │   200       500   │               │    │                  │        │   │
│  └────────────────────┼───────────────┼─────────────────────────┼──────── │
│                       │              ┘   │                         │           │
│                       ▼               │                         │           │
│  ┌────────────────────┐              │                         │           │
│  │  SYNC ENGINE       │              │                         │           │
│  │  (background)      │              │                         │           │
│  │                    │              │                         │           │
│  │  5. Proceso async  │              │                         │           │
│  │  detecta nuevo     │              │                         │           │
│  │  registro en cola  │              │                         │           │
│  │                    │              │                         │           │
│  │  [CUANDO HAYA      │              │                         │           │
│  │   INTERNET]       │              │                         │           │
│  │                    │              │                         │           │
│  │  - Lee cola        │              │                         │           │
│  │  - Envía a         │              │                         │           │
│  │    Supabase        │              │                         │           │
│  │  - Actualiza       │              │                         │           │
│  │    status='done'   │              │                         │           │
│  └────────────────────┘              │                         │           │
│                                     │                         │           │
└─────────────────────────────────────┴─────────────────────────┴───────────┘
```

---

## 7. Planificación Paso a Paso

### Fase 1: Preparación y Estructura (Semana 1)

| Paso | Tarea | Entregable |
|------|-------|------------|
| 1.1 | Configurar proyecto Tauri 2.x | Proyecto base con `npm create tauri-app` |
| 1.2 | Agregar binarios PostgreSQL portable | Binarios en `resources/postgresql/` |
| 1.3 | Crear scripts de inicialización PostgreSQL | `init-db.ps1`, `init-db.sh` |
| 1.4 | Configurar build pipeline para desktop | Scripts de build en `scripts/` |
| 1.5 | Configurar estructura de carpetas desktop | Estructura según sección 4 |

**Entregables de Fase**: Proyecto Tauri funcional que inicie PostgreSQL

---

### Fase 2: Capa de Datos Local (Semana 2)

| Paso | Tarea | Entregable |
|------|-------|------------|
| 2.1 | Crear cliente PostgreSQL local | `backend/src/lib/db.ts` |
| 2.2 | Implementar DB Adapter unificado | `backend/src/lib/db-adapter.ts` |
| 2.3 | Agregar columnas de sync a esquema | Migración SQL con `sync_*` columns |
| 2.4 | Crear tablas de sync | `sync_metadata`, `sync_queue`, `sync_conflicts` |
| 2.5 | Modificar servicios existentes para usar adapter | Actualizar services para inyección |

**Entregables de Fase**: Backend puede conectarse a PostgreSQL local

---

### Fase 3: Motor de Sincronización (Semana 3)

| Paso | Tarea | Entregable |
|------|-------|------------|
| 3.1 | Implementar Sync Service core | `sync.service.ts` con lógica principal |
| 3.2 | Implementar cola de sincronización | `sync-queue.service.ts` |
| 3.3 | Implementar resolución de conflictos | `conflict-resolver.ts` |
| 3.4 | Configurar scheduler (node-cron) | Tareas periódicas de sync |
| 3.5 | Integrar Supabase client en backend | Cliente para subir datos |

**Entregables de Fase**: Sync Engine funcional (sin probar aún)

---

### Fase 4: Frontend Offline (Semana 4)

| Paso | Tarea | Entregable |
|------|-------|------------|
| 4.1 | Crear AppModeContext | `frontend/src/context/AppModeContext.tsx` |
| 4.2 | Crear OfflineContext | `frontend/src/context/OfflineContext.tsx` |
| 4.3 | Crear SyncContext | `frontend/src/context/SyncContext.tsx` |
| 4.4 | Modificar apiClient para modo local | Endpoint dinámico |
| 4.5 | Crear indicadores de estado (UI) | Badge sync, offline mode |

**Entregables de Fase**: Frontend detecta y muestra modo offline

---

### Fase 5: Integración y Pruebas (Semana 5)

| Paso | Tarea | Entregable |
|------|-------|------------|
| 5.1 | Integrar backend Express en Tauri | Incrustar Node.js en la app |
| 5.2 | Configurar comandos IPC Tauri | `commands.rs` para iniciar/detener servicios |
| 5.3 | Probar flujo completo: offline → sync | Prueba de ciclo completo |
| 5.4 | Probar resolución de conflictos | Escenarios de conflicto |
| 5.5 | Pruebas de stress y edge cases | Casos extremos |

**Entregables de Fase**: Aplicación funcional completa

---

### Fase 6: Build y Distribución (Semana 6)

| Paso | Tarea | Entregable |
|------|-------|------------|
| 6.1 | Configurar producción build | Optimizar bundles |
| 6.2 | Crear instalador | `.exe` para Windows |
| 6.3 | Documentar instalación | README-DESKTOP.md |
| 6.4 | Pruebas de aceptación | UAT con usuario real |
| 6.5 | Entrega final | Ejecutable funcional |

**Entregables de Fase**: Entregable final al usuario

---

## 8. Estimación de Tiempo y Complejidad

### 8.1 Resumen por Fase

| Fase | Descripción | Complejidad | Tiempo Estimado | Acumulado |
|------|-------------|-------------|-----------------|------------|
| 1 | Preparación y Estructura | Media | 8 horas | 8h |
| 2 | Capa de Datos Local | Alta | 16 horas | 24h |
| 3 | Motor de Sincronización | Muy Alta | 24 horas | 48h |
| 4 | Frontend Offline | Media | 12 horas | 60h |
| 5 | Integración y Pruebas | Alta | 16 horas | 76h |
| 6 | Build y Distribución | Media | 8 horas | 84h |
| **TOTAL** | | **Alta** | **~84 horas** | ~84h |

### 8.2 Detalle por Componente

| Componente | Complejidad | Tiempo | Riesgos |
|------------|-------------|--------|---------|
| **Setup Tauri** | Baja | 2h | Configuración inicial |
| **PostgreSQL portable** | Media | 4h | Binarios, permisos Windows |
| **DB Adapter** | Alta | 6h | Transacciones, manejo errores |
| **Tablas sync** | Media | 3h | SQL correcto |
| **Sync Engine core** | Muy Alta | 10h | Lógica de冲突, concurrencia |
| **Cola sincronización** | Alta | 5h | Reintentos, deadlock |
| **Resolución conflictos** | Muy Alta | 6h | Estrategias múltiples |
| **Scheduler** | Baja | 2h | node-cron básico |
| **Contextos Frontend** | Media | 5h | Estados, UI react |
| **API Client** | Baja | 2h | Endpoints |
| **Indicadores UI** | Baja | 3h | Diseño, iconos |
| **IPC Commands** | Media | 4h | Rust ↔ Node |
| **Integración final** | Alta | 8h | debugging |
| **Testing** | Alta | 8h | Casos edge |
| **Build** | Media | 4h | Optimización |

### 8.3 Factores que Afectan el Tiempo

**Riesgos que pueden aumentar el tiempo**:
- Problemas con binarios PostgreSQL en Windows (permisos, antiviurs)
- Conflictos de IDs entre múltiples instancias
- Errores de red durante sincronización
- Edge cases no contemplados

**Mitigaciones**:
- Buffer de 20% sobre tiempo estimado
- Prototipo rápido de PostgreSQL portable antes de Fase 2
- Testing intensivo de sync en Fase 5

---

## 9. Riesgos Técnicos y Mitigaciones

### 9.1 Riesgos de Alto Impacto

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| **Conflictos de IDs UUID** | Media | Alto | Prefijo de instancia en UUIDs locales |
| **Pérdida de datos por corte energía** | Baja | Muy Alto | Transacciones ACID, log de operaciones |
| **Corrupción PostgreSQL** | Baja | Alto | Backups automáticos, validación post-inicio |
| **Sincronización infinita** | Media | Medio | Límite de intentos, deadlock detection |

### 9.2 Riesgos de Mediano Impacto

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| **Rendimiento sync con datos grandes** | Alta | Medio | Paginación, sync diferencial |
| **Credenciales expuestas** | Baja | Alto | Windows Credential Manager |
| **Conflictos concurrentes** | Media | Medio | Estrategia last-write-wins + manual |

### 9.3 Plan de Contingencia

| Escenario | Respuesta |
|-----------|-----------|
| Sync falla 3 veces | Notificar usuario, marcar para revisión manual |
| PostgreSQL no inicia | Mostrar error claro, opción de reinstalar |
| Base de datos corrupta | Restaurar desde último backup de Supabase |
| Pérdida de conexión durante sync | Retry automático, rollback si es posible |

---

## 10. Criterios de Éxito

### 10.1 Funcionales

- [ ] La aplicación inicia sin Docker instalado
- [ ] PostgreSQL local funciona sin instalación adicional del usuario
- [ ] Todas las operaciones CRUD funcionan offline
- [ ] La sincronización con Supabase funciona cuando hay internet
- [ ] Los conflictos se detectan y resuelven correctamente
- [ ] El sistema es 100% idéntico al sistema web

### 10.2 No Funcionales

- [ ] Tiempo de inicio < 30 segundos
- [ ] Uso de memoria < 500 MB
- [ ] Tamaño del ejecutable < 100 MB
- [ ] UI responde en < 100ms para operaciones locales

### 10.3 Pruebas de Aceptación

1. **Offline Total**: Aplicación funciona sin internet por 48 horas
2. **Sync Exitoso**: 100 registros suben y bajan correctamente
3. **Conflictos**: 3 escenarios de conflicto resueltos automáticamente
4. **Rendimiento**: Sync de 1000 registros en < 5 minutos
5. **Instalación**: Usuario no técnico instala y usa en < 15 minutos

---

## 11. Próximos Pasos Inmediatos

1. **Confirmar** este plan con el usuario
2. **Iniciar Fase 1**: Configurar proyecto Tauri 2.x
3. **Obtener** binarios PostgreSQL portable para Windows
4. **Decidir** estrategia de distribución (installer vs portable)

---

**Documento preparado para revisión. Actualizaciones se documentarán en versiones sucesivas.**
