# Arquitectura del Sistema — UNEFA Dashboard v2.2.0

> **Documento técnico para el equipo de desarrollo**
> Sistema de Información para la Gestión de Pasantías (SIGP)

---

## Índice

1. [Visión General](#1-visión-general)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Arquitectura de Capas (Layered Architecture)](#3-arquitectura-de-capas-layered-architecture)
4. [Patrones de Diseño Aplicados](#4-patrones-de-diseño-aplicados)
   - 4.1 [Adapter + Strategy — DatabaseManager](#41-adapter--strategy--databasemanager)
   - 4.2 [Singleton — DatabaseManager](#42-singleton--databasemanager)
   - 4.3 [Factory — crudServiceFactory y AI Provider](#43-factory--crudservicefactory-y-ai-provider)
   - 4.4 [Proxy Inverso — Vercel → Render](#44-proxy-inverso--vercel--render)
   - 4.5 [Container/Presentational — Frontend](#45-containerpresentational--frontend)
   - 4.6 [Retry Pattern con Exponential Backoff](#46-retry-pattern-con-exponential-backoff)
   - 4.7 [Observer/Publisher — SSE Notificaciones](#47-observerpublisher--sse-notificaciones)
   - 4.8 [Blacklist Pattern — Token Revocation](#48-blacklist-pattern--token-revocation)
5. [Capa de Routes](#5-capa-de-routes)
6. [Capa de Controllers](#6-capa-de-controllers)
7. [Capa de Services](#7-capa-de-services)
8. [Capa de Base de Datos](#8-capa-de-base-de-datos)
9. [Capa de Hooks (Frontend)](#9-capa-de-hooks-frontend)
10. [Autenticación y Autorización](#10-autenticación-y-autorización)
11. [APIs Externas](#11-apis-externas)
12. [Topología de Despliegue](#12-topología-de-despliegue)
13. [Seguridad](#13-seguridad)
14. [Monitoreo](#14-monitoreo)

---

## 1. Visión General

**UNEFA Dashboard** es un sistema de gestión académica para universidades, enfocado en la administración del ciclo completo de pasantías profesionales: desde la pre-inscripción, pasando por el seguimiento y evaluación, hasta la culminación.

El sistema opera en **tres modos**:

| Modo | Descripción | Usuarios |
|------|-------------|----------|
| **Cloud** | Producción: Vercel + Render + Supabase | Administrativos, Tutores, Estudiantes, Público |
| **Desktop Offline** | Electron + PGlite WASM local | Usuarios sin conexión a internet |
| **Docker** | Desarrollo local | Desarrolladores |

**Arquitectura general**: Modular Monolith con Layered Architecture.

No es microservicios. Es una sola aplicación Express.js que sirve toda la API, organizada en capas con responsabilidades bien definidas. Los 41 features del frontend son módulos independientes que comparten una API común.

---

## 2. Stack Tecnológico

### Frontend

| Categoría | Tecnología | Archivo de referencia |
|-----------|-----------|----------------------|
| Framework UI | **React 19** | `package.json` L57 |
| Bundler | **Vite 6** | `vite.config.ts` |
| Lenguaje | **TypeScript 5.7** (strict mode) | `tsconfig.app.json` |
| Estilos | **Tailwind CSS v4** | `postcss.config.js` |
| Routing | **React Router 7** (lazy loading) | `src/routes/index.tsx` |
| Forms + Validación | **React Hook Form** + **Zod 4** | `package.json` L65-66, L76 |
| HTTP Client | **Axios** (interceptores) | `src/api/apiClient.ts` |
| PWA | **vite-plugin-pwa** | `vite.config.ts` L22-62 |
| Charts | **ApexCharts** + **react-jvectormap** | `package.json` L33-34, L41 |
| Mapas | **MapLibre GL** | `package.json` L54 |
| Animación | **Framer Motion 12** + **Motion** | `package.json` L51, L55 |
| Calendario | **FullCalendar** | `package.json` L25-31 |
| PDF | **@react-pdf/renderer** | `package.json` L35 |
| Notificaciones | **React Hot Toast** | `package.json` L66 |
| 3D/Particles | **tsParticles** + **OGL** | `package.json` L38-40, L56 |
| Carousel | **Swiper 11** | `package.json` L71 |
| Drag & Drop | **react-dnd** | `package.json` L59-60 |
| Desktop | **Electron 42** + **electron-builder** | `package.json` L99-100 |
| Testing | **Vitest** + **Playwright** | `package.json` L80-81, L114 |
| Storybook | **Storybook 8** | `package.json` L82-86 |

### Backend

| Categoría | Tecnología | Archivo de referencia |
|-----------|-----------|----------------------|
| Runtime | **Node.js >= 18.x** | `backend/package.json` |
| Framework | **Express.js 4.22** | `backend/src/app.ts` L80 |
| Lenguaje | **TypeScript 5.7** | `backend/tsconfig.json` |
| DB Cloud | **Supabase JS** (PostgreSQL REST) | `backend/src/lib/supabase.ts` L19 |
| DB Offline | **PGlite** (PostgreSQL WASM) | `backend/src/lib/pglite-adapter.ts` |
| ORM | **Prisma** | `backend/package.json` L17 |
| Auth | **JWT** + **Bcryptjs** + **cookie-parser** | `backend/src/middlewares/auth.middleware.ts` |
| Seguridad | **Helmet** (CSP) + **CORS dinámico** | `backend/src/app.ts` L118-189 |
| Email | **Resend** + **Nodemailer** | `backend/package.json` L32-33 |
| AI | **Google Gemini** (primary) + **Groq** (fallback) | `backend/src/services/ai-provider.factory.ts` |
| File Upload | **Multer** | `backend/package.json` L29 |
| Excel | **exceljs** + **xlsx** | `backend/package.json` L33-34 |
| Testing | **Vitest** + **Supertest** | `backend/package.json` L46-47 |

### Infraestructura

| Componente | Proveedor | Detalle |
|-----------|-----------|---------|
| Frontend Host | **Vercel** | SPA + CDN global + PWA |
| Backend Host | **Render** | Web Service Node.js |
| Database | **Supabase** | PostgreSQL 14+ managed |
| Desktop | **Electron 42** + **PGlite WASM** | Offline-first desktop app |
| Container | **Docker Compose** | Multi-stage Node 20 Alpine |
| CI/CD | **GitHub Actions** | Build + test pipeline |

---

## 3. Arquitectura de Capas (Layered Architecture)

El sistema sigue una arquitectura en capas estricta:

```
┌─────────────────────────────────────────────────────┐
│                   Routes (Enrutamiento)              │  ← Solo define HTTP method + path + middleware
├─────────────────────────────────────────────────────┤
│                Controllers (Orquestación)             │  ← Recibe request, llama services, responde JSON
├─────────────────────────────────────────────────────┤
│                 Services (Lógica de negocio)          │  ← Reglas de negocio, validaciones, APIs externas
├─────────────────────────────────────────────────────┤
│              Database Layer (Persistencia)            │  ← DatabaseManager + Adapters
│              ┌───────────┐  ┌───────────┐            │
│              │  Supabase │  │   PGlite  │            │
│              │  (Cloud)  │  │  (Offline)│            │
│              └───────────┘  └───────────┘            │
└─────────────────────────────────────────────────────┘
```

**Regla fundamental**: Cada capa solo se comunica con la capa inmediatamente inferior. Un controller nunca llama a otro controller. Un service nunca llama a un route.

### Evidencia en código

**Route → Controller** (`backend/src/routes/periods.routes.ts` → `backend/src/controllers/periods.controller.ts`):
```typescript
// routes/periods.routes.ts
router.get('/', periodsController.getPeriods);  // Route delega en Controller
```

**Controller → Service** (vía `dbManager.withRetry`):
```typescript
// controllers/periods.controller.ts L69
const data = await dbManager.withRetry(async (supabase) => {
  const { data: periods, error } = await supabase
    .from('t_internships_period')
    .select('*')
    .order('START_DATE', { ascending: false });
```

**Service → DB Layer**:
```typescript
// services/auth.service.ts L25
await dbManager.withRetry(async (supabase) => {
  await supabase.from('t_user_sessions').update({ STATUS: 0 }).eq('TOKEN_HASH', hash);
});
```

---

## 4. Patrones de Diseño Aplicados

### 4.1 Adapter + Strategy — DatabaseManager

**El patrón más importante del sistema.**

El `DatabaseManager` (singleton) expone una interfaz unificada que permite a los controllers operar contra **dos motores de base de datos distintos** sin cambiar una línea de código.

**Archivo**: `backend/src/lib/db-manager.ts`

```typescript
// L27-36: El manager tiene dos modos
export class DatabaseManager {
  private mode: DbMode = 'cloud';           // ← Strategy: modo intercambiable
  private offlineAdapter: DatabaseAdapter | null = null;  // ← Adapter: interfaz común

  // L63-67: Cambiar modo en runtime
  public setMode(mode: DbMode): void {
    this.mode = mode;
  }

  // L87-100: getConnection() devuelve el adapter correcto según el modo
  public getConnection(): DbConnection {
    if (this.mode === 'offline') {
      return this.offlineAdapter;    // ← PGliteAdapter
    }
    return this.client;              // ← SupabaseClient
  }
}
```

**Las dos implementaciones del Adapter**:

| Adapter | Archivo | Líneas clave |
|---------|---------|-------------|
| `SupabaseAdapter` | `backend/src/lib/supabase-adapter.ts` | L138-175: Wrapper sobre Supabase SDK |
| `PGliteAdapter` | `backend/src/lib/pglite-adapter.ts` | L1159-1200: Traduce llamadas Supabase-style a SQL parametrizado |

**PGliteAdapter** es particularmente interesante: traduce la API chainable de Supabase (`.from().select().eq().order()`) a SQL puro con parámetros:

```typescript
// pglite-adapter.ts L514-524: SQL Builder
buildSQL(): { sql: string; params: any[] } {
  switch (this.operation) {
    case 'select': return this.buildSelectSQL(params, paramIndex);
    case 'insert': return this.buildInsertSQL(params);
    case 'update': return this.buildUpdateSQL(params, paramIndex);
    case 'delete': return this.buildDeleteSQL(params, paramIndex);
  }
}
```

**¿Por qué esto es importante?** Porque los 49 controllers funcionan IDÉNTICO en producción en Render que en la app de escritorio sin internet. Ningún controller sabe si está hablando con Supabase o con PGlite.

#### Ejemplo de uso en controller real:

```typescript
// controllers/periods.controller.ts L69-74
const data = await dbManager.withRetry(async (supabase) => {
  const { data: periods, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .order('START_DATE', { ascending: false });
```

Ese `supabase` que recibe el callback es **siempre el adapter activo**. Si estamos en modo cloud, es Supabase SDK. Si estamos en modo offline, es PGliteAdapter. El controller no necesita saberlo.

#### Cambio de modo en runtime (server-offline.ts):

```typescript
// server-offline.ts L197-201
dbManager.setMode('offline');
const adapter = new PGliteAdapter(pglite);
dbManager.setOfflineAdapter(adapter);
```

### 4.2 Singleton — DatabaseManager

**Archivo**: `backend/src/lib/db-manager.ts`, L27-51

```typescript
private static instance: DatabaseManager;

public static getInstance(): DatabaseManager {
  if (!DatabaseManager.instance) {
    DatabaseManager.instance = new DatabaseManager();
  }
  return DatabaseManager.instance;
}
```

Se exporta una instancia única para toda la aplicación:

```typescript
// L281
export const dbManager = DatabaseManager.getInstance();
```

Cualquier archivo que haga `import { dbManager }` recibe **siempre la misma instancia**. Esto garantiza que:
- La conexión a Supabase se crea una sola vez
- El modo (cloud/offline) es global
- Los seeders y schedulers comparten el mismo estado

### 4.3 Factory — crudServiceFactory y AI Provider

#### 4.3.1 Frontend: crudServiceFactory

**Archivo**: `src/api/crudServiceFactory.ts`

Genera servicios CRUD completos a partir de una configuración mínima:

```typescript
// L80-82: Factory Method
export function createCrudService<TItem, TCreatePayload, TUpdatePayload, TApiDTO>(
  config: CrudServiceConfig<TItem, TCreatePayload, TUpdatePayload, TApiDTO>
): CrudService<TItem, TCreatePayload, TUpdatePayload> {

  return {
    getAll: async (params?) => { ... },     // L86
    getById: async (id) => { ... },          // L109
    create: async (data) => { ... },         // L114
    update: async (data) => { ... },         // L121
    delete: async (id) => { ... },           // L136
    toggleStatus: async (id, status) => { ... },  // L141
    bulkDelete: async (ids) => { ... },      // L146
    bulkRestore: async (ids) => { ... },     // L151
  };
}
```

**Uso típico** (ejemplo de cómo se usa en features):
```typescript
// features/institutions/services/institutionsService.tsx
export const institutionsService = createCrudService<Institution, CreateInstitutionPayload, UpdateInstitutionPayload, InstitutionDTO>({
  endpoint: '/institutions',
  mapFromApi: (dto) => ({ ...dto }),
});
```

Esto reduce la duplicación: un feature CRUD típico necesita ~10 líneas de configuración en vez de ~150 líneas de código repetitivo.

#### 4.3.2 Backend: AI Provider Factory

**Archivo**: `backend/src/services/ai-provider.factory.ts`

Implementa **Abstract Factory + Strategy** para manejar múltiples proveedores de IA:

```typescript
// L170-174: La fábrica mantiene una lista de providers
class AIProviderFactory {
  private providers: AIProvider[] = [
    new GroqProvider(),      // Primary
    new GoogleProvider(),    // Fallback
  ];
```

Cada provider implementa la misma interfaz `AIProvider`:

```typescript
// L17-22: Interfaz común (Strategy)
interface AIProvider {
  name: string;
  streamChat(params, onChunk): Promise<string>;
  sendChat(params): Promise<string>;
  isAvailable(): boolean;
}
```

**Fallback automático** (L223-240):
```typescript
async sendChatWithFallback(params): Promise<{ text: string; provider: string }> {
  try {
    const text = await this.activeProvider.sendChat(params);
    return { text, provider: this.activeProvider.name };
  } catch (error: any) {
    if (this.fallbackProvider && error?.isRetryable) {
      const text = await this.fallbackProvider.sendChat(params);
      return { text, provider: this.fallbackProvider.name };
    }
    throw error;
  }
}
```

**Prioridad**: Groq > Google. Si Groq tiene API key, se usa Groq. Si no, Google Gemini. Si el primario falla con error retryable, se cae al fallback automáticamente.

### 4.4 Proxy Inverso — Vercel → Render

**Archivo**: `vercel.json`

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://unefa-dashboard.onrender.com/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Cómo funciona**:

1. El browser pide `https://unefa-dashboard.vercel.app/api/students`
2. Vercel recibe la request, ve que matchea `/api/(.*)`
3. **Proxy reversa** a `https://unefa-dashboard.onrender.com/api/students`
4. Render procesa la request y devuelve la respuesta
5. Vercel reenvía la respuesta al browser

**¿Por qué es importante?** Elimina problemas de CORS en producción. El browser cree que todo viene del mismo origen (`vercel.app`). No necesita configurar CORS para producción porque nunca hay llamadas cross-origin desde el frontend.

**Confirmación en el backend** (`backend/src/app.ts` L73):
```typescript
const isVercel = !!process.env.VERCEL;
```
El backend detecta si está detrás de Vercel para desactivar los schedulers (que no funcionan en serverless).

### 4.5 Container/Presentational — Frontend

**Principio**: Las Pages orquestan, los components de features renderizan.

```
pages/Students/students.tsx          → Container (sabe qué features usar)
  └── features/students/
        ├── components/StudentTable.tsx    → Presentational (recibe props)
        ├── hooks/useStudents.tsx          → Lógica de negocio
        └── services/studentsService.tsx   → API calls
```

**Ejemplo**: `src/hooks/useCrud.ts` L61-64

El hook `useCrud` es el **orquestador genérico**. Recibe un service y opciones, y expone:
```typescript
return {
  data, filteredData, status, loadingAction, error,
  refresh, createItem, updateItem, deleteItem,
  toggleItemStatus, bulkDelete, bulkRestore,
  pagination, setPage, setLimit,
};
```

Un componente de página solo llama a `useCrud(service, options)` y renderiza el resultado. No sabe cómo se hace el fetch, ni cómo se manejan los errores, ni cómo se actualiza el estado. **Eso es Container/Presentational**.

### 4.6 Retry Pattern con Exponential Backoff

**Archivo**: `src/api/apiClient.ts`, L148-166

```typescript
const MAX_RETRIES = 3;
const shouldRetry =
  error.code === 'ECONNABORTED' ||   // Timeout
  error.code === 'ERR_NETWORK' ||    // Error de red
  !error.response ||                 // Sin respuesta
  error.response.status === 429 ||   // Too many requests
  error.response.status === 503 ||   // Service unavailable
  error.response.status >= 500;      // Errores de servidor

if (config && shouldRetry && (config._retryCount ?? 0) < MAX_RETRIES) {
  config._retryCount = (config._retryCount ?? 0) + 1;
  const delay = Math.pow(2, config._retryCount) * 1000;
  // 1er retry: 2s, 2do: 4s, 3er: 8s
  await new Promise(resolve => setTimeout(resolve, delay));
  return apiClient(config);
}
```

**Auto-refresh de sesión** ante 401 (L114-133):

```typescript
if (error.response?.status === 401 && !isPublicPage && !config._retry) {
  config._retry = true;
  const refreshed = await tryRefreshSession();  // POST /auth/refresh
  if (refreshed) {
    return apiClient(config);  // Reintenta la request original
  }
  // Si no se pudo renovar, notificar al sistema
  window.dispatchEvent(new CustomEvent('unefa:auth:session-expired'));
}
```

Esto evita que al usuario se le caiga la sesión por un token que expiró hace segundos. El sistema renueva silenciosamente y reintenta la request.

### 4.7 Observer/Publisher — SSE Notificaciones

**Archivo**: `backend/src/services/sse.service.ts`

**SSE (Server-Sent Events)** es un patrón Observer unidireccional: el servidor empuja eventos al cliente.

```typescript
// L6: Mapa de clientes por userId
export const clients: Map<number, Set<Response>> = new Map();

// L8-90: Suscripción a eventos
export const subscribeToNotifications = (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  // Heartbeat cada 30s para mantener conexión viva
  const heartbeatInterval = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, 30000);
};
```

**¿Por qué SSE y no WebSockets?** Porque las notificaciones solo van en una dirección (servidor → cliente). SSE es más simple que WebSocket: corre sobre HTTP común, no necesita bibliotecas extra, y tiene reconexión automática en el browser.

**Limitación en Vercel**: Las funciones serverless no mantienen conexiones largas. Por eso SSE se deshabilita en Vercel (L162-171 en `app.ts`):
```typescript
if (isVercel) {
  app.get('/api/notifications/stream', (_req, res) => {
    res.status(501).json({ message: 'SSE no disponible en serverless...' });
  });
} else {
  app.get('/api/notifications/stream', subscribeToNotifications);
}
```

### 4.8 Blacklist Pattern — Token Revocation

**Archivo**: `backend/src/services/auth.service.ts`, L7-44

Para cerrar sesión de forma instantánea (sin esperar a que el JWT expire), se mantiene una **blacklist en memoria**:

```typescript
// L7: Blacklist en memoria con limpieza periódica
const tokenBlacklist = new Map<string, { userId: number; userCi: string; expiresAt: number }>();

// L9-16: Cleanup cada hora
setInterval(() => {
  const now = Date.now();
  for (const [hash, data] of tokenBlacklist.entries()) {
    if (data.expiresAt < now) tokenBlacklist.delete(hash);
  }
}, 60 * 60 * 1000);

// L18-31: Revocar token
export const revokeToken = (token: string, userId: number, userCi: string) => {
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  tokenBlacklist.set(hash, { userId, userCi, expiresAt });

  // También persiste en DB para que sobreviva a reinicios
  dbManager.withRetry(async (supabase) => {
    await supabase.from('t_user_sessions').update({ STATUS: 0 }).eq('TOKEN_HASH', hash);
  }).catch(() => {});
};
```

**Dos niveles de revocación**:
1. **En memoria** (rápido, sin DB call) — `isTokenRevoked()` L33-44
2. **En DB** (persistente entre reinicios) — tabla `t_user_sessions`

---

## 5. Capa de Routes

**Ubicación**: `backend/src/routes/` — 51 archivos

**Archivo principal**: `backend/src/app.ts`

Las rutas se registran en orden de especificidad:

### 5.1 Middleware global (L91-191)

```typescript
app.use(performanceMiddleware);          // L91
app.use(helmet({...}));                  // L118
app.use(cors({...}));                    // L173
app.use(express.json());                 // L190
app.use(cookieParser());                 // L191
```

### 5.2 Rutas públicas (sin autenticación) — L200-243

```typescript
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/health', healthHandler);
app.use('/api/db-status', dbStatusHandler);
app.use('/api/institutions', institutionsRoutes);
```

### 5.3 Barrera de autenticación — L246

```typescript
app.use('/api', authenticateToken, restrictAsistente);
```

A partir de este punto, **todas** las rutas requieren JWT válido. El middleware `restrictAsistente` además bloquea escrituras (POST/PUT/PATCH/DELETE) para el rol ASISTENTE.

### 5.4 Rutas protegidas — L248-288

```typescript
app.use('/api/careers', careersRoutes);
app.use('/api/periodos', periodsRoutes);
app.use('/api/students', studentsRoutes);
// ... 44 rutas protegidas más
```

**Total: 51 rutas** distribuidas así:

| Tipo | Cantidad | Ejemplos |
|------|----------|----------|
| Auth | 3 | login, logout, refresh, first-login |
| Públicas | 7 | health, db-status, landing-config, search, public, test |
| Protegidas | 41 | periods, students, tutors, careers, tracking, etc. |

### 5.5 Ruta catch-all 404 — L326-332

```typescript
app.use((req, res) => {
  res.status(404).json({
    message: 'Ruta no encontrada',
    path: req.url,
  });
});
```

---

## 6. Capa de Controllers

**Ubicación**: `backend/src/controllers/` — 49 archivos

**Responsabilidad**: Recibir la request, orquestar la lógica, devolver una respuesta JSON.

### Patrón general

```typescript
// controllers/periods.controller.ts (ejemplo completo L67-114)
export const getPeriods = async (_req: Request, res: Response) => {
  try {
    const data = await dbManager.withRetry(async (supabase) => {
      // 1. Obtener datos
      const { data: periods, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .order('START_DATE', { ascending: false });
      if (error) throw error;

      // 2. Enriquecer con datos adicionales
      const enrichedPeriods = periods.map(p => ({
        ...p,
        isInUse: usedPeriodIds.has(p.PERIOD_ID),
        graceEndDate: calcularFechaGrace(p.START_DATE, p.ENROLLMENT_GRACE_DAYS),
      }));
      return enrichedPeriods;
    });
    res.json(data);  // ← Siempre devuelve JSON
  } catch (error) {
    handleDbError(res, error);  // ← Error handler unificado
  }
};
```

### Manejo de errores unificado (L20-52)

```typescript
const handleDbError = (res: Response, error: unknown) => {
  const dbError = error as AppError;
  let userMessage = 'Error en la base de datos';
  let statusCode = 500;

  if (dbError.code === '400') {           // Validation
    statusCode = 400; userMessage = dbError.message;
  } else if (dbError.code === '23505') {  // Duplicate
    userMessage = 'Error: Ya existe un registro con estos datos (duplicado)';
  } else if (dbError.code === '404') {    // Not found
    statusCode = 404; userMessage = 'Registro no encontrado';
  } else if (dbError.code === '403') {    // Forbidden
    statusCode = 403; userMessage = dbError.message;
  }
  res.status(statusCode).json({ message: userMessage });
};
```

**Los controllers NO**:
- Hablan SQL directo (usan Supabase SDK)
- Manejan lógica de autenticación (eso es middleware)
- Saben si la DB es Supabase o PGlite (usan `dbManager.getConnection()`)

**Los controllers SÍ**:
- Validan datos de entrada
- Enriquecen respuestas (cálculos, joins manuales)
- Disparan notificaciones y auditoría
- Mapean errores de DB a mensajes de usuario

---

## 7. Capa de Services

**Ubicación**: `backend/src/services/` — 43 archivos

Los services contienen la lógica de negocio pura. Se dividen en varias categorías:

### 7.1 Services de negocio

| Service | Archivo | Responsabilidad |
|---------|---------|-----------------|
| Auth Service | `auth.service.ts` | Login, logout, verificación 2FA, blacklist tokens |
| Period Scheduler | `period-scheduler.service.ts` | Cierre automático de periodos |
| Reminder Scheduler | `reminder-scheduler.service.ts` | Recordatorios automáticos |
| Sync Service | `sync.service.ts` | Sincronización Supabase → PGlite (Desktop) |
| Notification | `notification.service.ts` | Notificaciones push/email |
| Export Service | `export.service.ts` | Exportación a Excel/PDF |

### 7.2 Services de integración

| Service | Archivo | API Externa |
|---------|---------|-------------|
| AI Service | `ai.service.ts` | Orquestador de AI |
| Google AI | `google-ai.service.ts` | Google Gemini |
| Groq AI | `groq-ai.service.ts` | Groq Cloud |
| AI Provider Factory | `ai-provider.factory.ts` | Factory + Strategy |
| Cédula API | `cedula-api.service.ts` | Validación de cédula venezolana |
| RAG Service | `rag.service.ts` | Retrieval Augmented Generation |
| Embedding | `embedding.service.ts` | Generación de embeddings |

### 7.3 Services de infraestructura

| Service | Archivo | Función |
|---------|---------|---------|
| SSE | `sse.service.ts` | Server-Sent Events |
| Audit | `audit.service.ts` | Registro de operaciones |
| Cache | `rag-cache.service.ts` | Caché de respuestas RAG |
| Sync | `sync.service.ts` | Sincronización offline |

### Ejemplo: Auth Service — manejo de sesiones

**Archivo**: `backend/src/services/auth.service.ts`

```typescript
// L7: Blacklist de tokens revocados
const tokenBlacklist = new Map<...>();

// L18: Revocación de token (logout)
export const revokeToken = (token, userId, userCi) => {
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  tokenBlacklist.set(hash, { userId, userCi, expiresAt });
};

// L46: Log de acciones de autenticación
export const logAuthAction = async (userId, userCi, action, ip, userAgent, details) => {
  await dbManager.withRetry(async (supabase) => {
    await supabase.from('t_auth_log').insert({
      USER_ID: userId, USER_CI: userCi, ACTION: action, IP_ADDRESS: ip, ...
    });
  });
};
```

### Ejemplo: Sync Service — offline desktop

**Archivo**: `backend/src/services/sync.service.ts`

```typescript
// L35-38: Sincroniza datos desde Supabase a PGlite
export class SyncService {
  async syncAll(): Promise<SyncResult> {
    // Orden topológico basado en FOREIGN KEYs
    const tables = this.getTablesInTopologicalOrder();
    for (const table of tables) {
      const { data } = await this.supabase.from(table).select('*');
      await this.pglite.query(`INSERT INTO ...`, data);
    }
  }
}
```

---

## 8. Capa de Base de Datos

### 8.1 Arquitectura

```
┌──────────────────────────────────────────────────┐
│                   Controllers                      │
│   dbManager.withRetry(async (supabase) => { ... }) │
├──────────────────────────────────────────────────┤
│               DatabaseManager (Singleton)          │
│   cloud mode                      offline mode     │
├──────────────────────┬───────────────────────────┤
│   SupabaseAdapter     │      PGliteAdapter         │
│   (Supabase JS SDK)  │   (SQL Builder + PGlite)   │
├──────────────────────┴───────────────────────────┤
│              PostgreSQL (target)                   │
│   Supabase Cloud                    PGlite WASM   │
└──────────────────────────────────────────────────┘
```

### 8.2 DatabaseManager

**Archivo**: `backend/src/lib/db-manager.ts` (282 líneas)

```typescript
// L27-51: Singleton
export class DatabaseManager {
  private static instance: DatabaseManager;
  private client: SupabaseClient | null = null;
  private mode: DbMode = 'cloud';

  // L87-100: getConnection según modo
  public getConnection(): DbConnection {
    if (this.mode === 'offline') return this.offlineAdapter;
    if (!this.client) throw new Error('Database not connected');
    return this.client;
  }

  // L228-278: withRetry — operación con reintentos
  public async withRetry<T>(operation, operationName): Promise<T> {
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const client = await this.connect();
        return await operation(client);
      } catch (error) {
        // Solo reintenta errores 5xx
        if (appError.status && appError.status < 500) throw error;
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * attempt));
      }
    }
    throw lastError;
  }
}
```

### 8.3 SupabaseAdapter

**Archivo**: `backend/src/lib/supabase-adapter.ts` (175 líneas)

Wrapper que implementa `DatabaseAdapter` usando el SDK de Supabase:

```typescript
// L138-175
export class SupabaseAdapter implements DatabaseAdapter {
  from(table: string) {
    return {
      select: (columns, options?) => new SupabaseFilterWrapper(queryBuilder.select(...)),
      insert: (values) => new SupabaseFilterWrapper(queryBuilder.insert(values)),
      update: (values) => new SupabaseFilterWrapper(queryBuilder.update(values)),
      delete: () => new SupabaseFilterWrapper(queryBuilder.delete()),
    };
  }
}
```

### 8.4 PGliteAdapter

**Archivo**: `backend/src/lib/pglite-adapter.ts` (1200 líneas)

Traduce la API chainable de Supabase a SQL parametrizado. Incluye:

- **Parser de joins recursivo** (L290-424): soporta sintaxis `t_persons!inner(ci, email)` y alias `institution:INSTITUTION_ID(*)`
- **Mapa de PKs conocidas** (L55-88): 30+ tablas mapeadas con sus primary keys reales del schema
- **Mapa de FKs** (L104-159): Relaciones entre tablas para resolver joins automáticamente
- **Resolución de FK chains** (L227-250): cuando no hay FK directa, busca rutas a través de tablas intermedias
- **Normalización de joins** (L1032-1090): convierte columnas planas (`t_persons_ci`) a objetos anidados (`{ t_persons: { ci } }`)

### 8.5 Migraciones

**Ubicación**: `backend/src/migrations/` — 22 archivos SQL

| Migración | Propósito |
|-----------|-----------|
| `001_create_persons.sql` | Tabla unificada de personas |
| `002_migrate_persons_data.sql` | Migración de datos existentes |
| `003-004_add_person_fks.sql` | Foreign keys + triggers |
| `005_permissions_module.sql` | Sistema de permisos |
| `006_reports_module.sql` | Reportes |
| `009_email_templates.sql` | Plantillas de email |
| `010_knowledge_base.sql` | Base de conocimiento RAG |
| `011-012_grace_days.sql` | Días de grazia + config académica |
| `015_system_institution.sql` | Institución del sistema |

### 8.6 Frontend — requestCache

**Archivo**: `src/api/requestCache.ts`

Mecanismo de **deduplicación de requests** para evitar llamadas simultáneas al mismo endpoint:

```typescript
// crudServiceFactory.ts L88-89
const cacheKey = `${crudCachePrefix(endpoint)}list:${JSON.stringify(params || {})}`;
return dedupeRequest(cacheKey, async () => {
  const response = await apiClient.get(endpoint, { params });
  ...
});
```

---

## 9. Capa de Hooks (Frontend)

**Ubicación**: `src/hooks/` — 16 hooks

Los hooks encapsulan la lógica reutilizable del frontend:

| Hook | Archivo | Función |
|------|---------|---------|
| `useCrud` | `useCrud.ts` | CRUD genérico con estados loading/error/success |
| `useDebounce` | `useDebounce.ts` | Debounce para búsquedas |
| `useModal` | `useModal.tsx` | Estado de modales |
| `usePageTitle` | `usePageTitle.tsx` | Título dinámico de página |
| `useSessionRefresh` | `useSessionRefresh.ts` | Refresco automático de sesión |
| `useSessionTimeout` | `useSessionTimeout.ts` | Timeout por inactividad |
| `useTabs` | `useTabs.ts` | Estado de tabs |
| `useTabShortcuts` | `useTabShortcuts.ts` | Atajos de teclado para tabs |
| `useOutsideClick` | `useOutsideClick.ts` | Detectar click fuera de elemento |
| `useUnsavedChanges` | `useUnsavedChanges.ts` | Prevenir navegación con cambios sin guardar |
| `useCommandPaletteEvents` | `useCommandPaletteEvents.tsx` | Atajos de paleta de comandos |
| `useGoBack` | `useGoBack.tsx` | Navegación hacia atrás |
| `useLoadingState` | `useLoadingState.ts` | Estado de carga genérico |
| `useExistingRecordLookup` | `useExistingRecordLookup.ts` | Búsqueda de registros existentes |
| `useRecordAutocomplete` | `useRecordAutocomplete.ts` | Autocompletado de registros |

### Ejemplo: useCrud — el hook más importante

**Archivo**: `src/hooks/useCrud.ts` (507 líneas)

```typescript
// L61-64: Firma del hook
export function useCrud<TItem, TCreatePayload, TUpdatePayload>(
  service: CrudServiceAdapter<TItem, TCreatePayload, TUpdatePayload>,
  options: UseCrudOptions<TItem>
) {
  // L76-86: Estado unificado
  const [data, setData] = useState<TItem[]>([]);
  const [status, setStatus] = useState<CrudStatus>("idle");
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // L94-141: refresh con manejo de errores + toast
  const refresh = useCallback(async () => { ... });

  // L155-196: createItem con modo optimista opcional
  const createItem = async (payload, options?) => { ... };

  // L488-506: Retorna todo para que la página lo use
  return {
    data, filteredData, status, loadingAction, error,
    refresh, createItem, updateItem, deleteItem,
    toggleItemStatus, bulkDelete, bulkRestore,
    pagination, setPage, setLimit,
  };
}
```

**Modo optimista**: Cuando `optimistic: true`, las operaciones mutan el estado local inmediatamente y luego sincronizan con el servidor. Si el servidor falla, se revierte el cambio local.

---

## 10. Autenticación y Autorización

### 10.1 Flujo de autenticación

```
Browser                          Backend
   │                                │
   │  POST /api/auth/login          │
   │  { ci, password }              │
   │ ─────────────────────────→     │
   │                                ├─ Verificar credenciales (bcrypt)
   │                                ├─ Generar JWT
   │                                ├─ Guardar sesión en t_user_sessions
   │                                ├─ Setear cookie httpOnly
   │  ←─────────────────────────    │
   │  Set-Cookie: auth_token=JWT    │
   │  (httpOnly, secure, sameSite)  │
```

**Archivos involucrados**:
- Route: `backend/src/routes/auth.routes.ts`
- Controller: `backend/src/controllers/auth.controller.ts`
- Service: `backend/src/services/auth.service.ts`
- Middleware: `backend/src/middlewares/auth.middleware.ts`

### 10.2 Middleware de autenticación

**Archivo**: `backend/src/middlewares/auth.middleware.ts` (251 líneas)

```typescript
// L56-110: Middleware principal
export const authenticateToken = async (req, res, next) => {
  const token = req.cookies?.auth_token;  // ← Lee de cookie httpOnly

  // 1. Verificar blacklist en memoria (rápido)
  const { revoked } = authService.isTokenRevoked(token);
  if (revoked) return res.status(403).json({ message: 'Sesión cerrada' });

  // 2. Verificar JWT
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ message: 'Sesión expirada' });

  // 3. Verificar sesión en DB (persistente, timeout 24h)
  const dbCheck = await authService.verifySessionInDB(supabase, token);
  if (!dbCheck.valid) return res.status(403).json({ message: 'Sesión cerrada' });

  req.user = payload;
  next();
};
```

### 10.3 Sistema de roles y permisos

**4 roles** definidos en `auth.middleware.ts` L17-22:

```typescript
export const ROLES = {
  ADMIN: 1,       // Acceso total
  ASISTENTE: 2,   // Solo lectura
  TUTOR: 3,       // Panel de tutor
  ESTUDIANTE: 4,  // Panel de estudiante
};
```

**Dos niveles de autorización**:

1. **Por rol** — `authorizeRole([3])` solo permite TUTOR
```typescript
// auth.middleware.ts L165-172
export const authorizeRole = (allowedRoles: number[]) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }
    next();
  };
};
```

2. **Por permiso** — `requirePermission('students:view')` verifica permisos específicos
```typescript
// auth.middleware.ts L193-219
export const requirePermission = (permission: string) => {
  return async (req, res, next) => {
    // ADMIN tiene todos los permisos automáticamente
    if (req.user.role === ROLES.ADMIN) return next();

    const hasPermission = await permissionService.hasPermission(req.user.role, permission);
    if (!hasPermission) return res.status(403).json({ message: `No tiene permiso '${permission}'` });
    next();
  };
};
```

**Uso en routes** (frontend, `src/routes/index.tsx`):
```typescript
<Route
  path="/students"
  element={
    <ProtectedRoute requiredPermissions={['students:view']}>
      <Students />
    </ProtectedRoute>
  }
/>
```

### 10.4 Restricción Asistente (solo lectura)

```typescript
// auth.middleware.ts L177-187
export const restrictAsistente = (req, res, next) => {
  if (req.user?.role === ROLES.ASISTENTE) {
    const writeMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (writeMethods.includes(req.method)) {
      return res.status(403).json({ message: 'Permiso denegado: solo lectura' });
    }
  }
  next();
};
```

### 10.5 Refresh de sesión (frontend)

**Archivo**: `src/api/apiClient.ts`, L34-62

```typescript
const tryRefreshSession = async (): Promise<boolean> => {
  if (refreshPromise) return refreshPromise;  // ← Lock para evitar múltiples refresh simultáneos

  refreshPromise = (async () => {
    const response = await axios.post(`${baseURL}/auth/refresh`, {}, { withCredentials: true });
    if (response.data?.success) return true;
    return false;
  })();

  return refreshPromise;
};
```

**Problema que resuelve**: Cuando el usuario vuelve de background después de horas, múltiples requests pueden recibir 401 al mismo tiempo. El lock `refreshPromise` asegura que solo una haga el refresh y las demás esperen la misma promesa.

---

## 11. APIs Externas

### 11.1 Google Gemini (primario)

**Archivo**: `backend/src/services/google-ai.service.ts`

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY);
```

- Modelo: `gemini-2.0-flash-lite` (configurable en `.env`)
- Usos: Chat del asistente AI, generación de reportes, detección de intención
- API Key: `GOOGLE_AI_KEY` en `backend/.env`

### 11.2 Groq (fallback)

**Archivo**: `backend/src/services/groq-ai.service.ts`

```typescript
import Groq from 'groq-sdk';
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
```

- Inferencia ultra-rápida (hasta ~1000 tokens/segundo)
- Actúa como fallback si Gemini falla

### 11.3 Resend (email transaccional)

**Archivo**: `backend/src/utils/email.utils.ts`

```typescript
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);
```

- Envío de notificaciones de login
- Recuperación de contraseña
- Alertas de seguridad
- Notificaciones de periodo académico

### 11.4 Cédula API (validación de identidad venezolana)

**Archivo**: `backend/src/services/cedula-api.service.ts`

```typescript
// Validación de cédula de identidad venezolana contra API externa
const response = await axios.get(`https://api.app.com/cedula/${ci}`, {
  headers: { 'APP-ID': process.env.CEDULA_APP_ID }
});
```

- Verifica que la cédula exista y corresponda a la persona
- Usado en registro de estudiantes y tutores
- Credenciales: `CEDULA_APP_ID` + `CEDULA_TOKEN`

### 11.5 OpenRouter (opcional)

**Archivo**: `package.json` L16

```typescript
VITE_OPENROUTER_KEY=
```

- Fallback adicional para el AI Assistant
- No configurado por defecto

---

## 12. Topología de Despliegue

### 12.1 Producción (Cloud)

```
Browser ──HTTPS──► Vercel Edge ──proxy──► Render Web Service ──JWT──► Supabase
                        │                      │
                     SPA estática           Express API
                     + PWA                  51 routes
                     + CDN cache            49 controllers
                     + Analytics             43 services
```

**Vercel** (`vercel.json`):
- Sirve el SPA compilado (React + Vite build)
- Cachea assets en CDN global
- Proxy reversa `/api/*` a Render
- Sirve PWA con service worker

**Render** (`backend/src/server.ts`):
- Express API en puerto 3000
- Conexión a Supabase con service role key
- Schedulers de periodo y recordatorios
- SSE para notificaciones en tiempo real

**Supabase**:
- PostgreSQL 14+ managed
- 22 migrations aplicadas
- Conexión autenticada via JWT + service role key

### 12.2 Desktop Offline (Electron)

```
Electron App
  ├── Main Process
  │     ├── Express Offline (:3001)
  │     │     └── DatabaseManager → PGliteAdapter → PGlite WASM
  │     └── SyncService (descarga datos de Supabase al iniciar)
  └── Renderer (React SPA en WebView)
        └── apiClient → http://localhost:3001/api
```

**Archivo**: `backend/src/server-offline.ts`

```typescript
// L197-201: Cambio a modo offline
dbManager.setMode('offline');
const adapter = new PGliteAdapter(pglite);
dbManager.setOfflineAdapter(adapter);
```

### 12.3 Docker (Desarrollo)

```
docker-compose.yml
  ├── Frontend Container (:5173)
  │     └── Vite dev server con HMR
  └── Backend Container (:3000)
        └── tsx watch (hot reload)
  └── unefa-network (bridge)
```

**Seguridad**: Archivos `.env` montados como solo lectura (`:ro`):
```yaml
volumes:
  - ./.env:/app/.env:ro
```

### 12.4 Variables de entorno

**Frontend** (`.env`):
```
VITE_API_URL=http://localhost:3000/api       # Backend URL
VITE_SUPABASE_URL=                           # Solo para el frontend Supabase client
VITE_SUPABASE_ANON_KEY=                      # Anon key (pública)
VITE_GOOGLE_AI_KEY=                          # Gemini para el frontend
GROQ_API_KEY=                                # Groq para el frontend
```

**Backend** (`backend/.env`):
```
SUPABASE_URL=                                # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY=                   # Service role key (secreta)
JWT_SECRET=                                  # Firma de tokens
PORT=3000                                    # Puerto del servidor
NODE_ENV=development                         # Modo
FRONTEND_URL=http://localhost:5173           # Origen permitido CORS
RESEND_API_KEY=                              # Email transaccional
GOOGLE_AI_KEY=                               # Gemini backend
GROQ_API_KEY=                                # Groq backend
CEDULA_APP_ID=                               # Cédula API
CEDULA_TOKEN=                                # Cédula API token
DATABASE_URL="file:./dev.db"                 # Prisma (no usado activamente)
```

---

## 13. Seguridad

### 13.1 CSP (Content Security Policy)

**Archivo**: `backend/src/app.ts`, L118-158

```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "data:", "https://*.onrender.com", "ws://localhost:*",
                   "https://basemaps.cartocdn.com", "https://server.arcgisonline.com", ...],
      scriptSrc: ["'self'", "'unsafe-inline'", "blob:"],
      workerSrc: ["'self'", "blob:"],
      imgSrc: ["'self'", "data:", "blob:", "https://*", ...],
    },
  },
}));
```

**¿Por qué es tan permisivo?** Porque el sistema usa múltiples fuentes externas:
- Mapas: CartoDB, ArcGIS, OpenStreetMap (tiles)
- Fuentes: Google Fonts
- Backend: onrender.com
- Desarrollo: localhost

### 13.2 CORS dinámico

**Archivo**: `backend/src/app.ts`, L83-88, L173-189

```typescript
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,...')
  .split(',').map(s => s.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, false);
    const isAllowed = allowedOrigins.some(allowed =>
      allowed.replace(/\/$/, '') === origin.replace(/\/$/, '')
    );
    if (isAllowed || origin.endsWith('.onrender.com') || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,  // ← Permite cookies cross-origin
}));
```

**Lista blanca dinámica**: Los orígenes se configuran por variable de entorno. Además, cualquier subdominio de `onrender.com` o `vercel.app` está permitido automáticamente.

### 13.3 Cookies httpOnly

El token JWT se almacena en una cookie httpOnly:

```typescript
// auth.controller.ts (resumen)
res.cookie('auth_token', token, {
  httpOnly: true,      // ← No accesible desde JavaScript
  secure: true,        // ← Solo HTTPS
  sameSite: 'lax',     // ← Protección CSRF
  maxAge: 24 * 60 * 60 * 1000  // 24 horas
});
```

### 13.4 Docker .env readonly

**Archivo**: `docker-compose.yml`

```yaml
volumes:
  - ./.env:/app/.env:ro   # ← Read-only mount
```

Los scripts de setup (`setup-docker.sh` y `setup-docker.bat`) verifican el hash MD5 de los `.env` antes y después de la ejecución para detectar modificaciones.

### 13.5 SQL parametrizado (PGlite)

**Archivo**: `backend/src/lib/pglite-adapter.ts`

Todas las queries usan parámetros posicionales (`$1, $2, ...`), previniendo SQL injection:

```typescript
// L812-884: buildWhereClause
case 'eq':
  params.push(filter.value);
  return `${col} = $${params.length}`;
```

---

## 14. Monitoreo

### 14.1 Performance Middleware

**Archivo**: `backend/src/lib/performance-middleware.ts`

```typescript
// L4-21
export const performanceMiddleware = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (status >= 400) console.error(`[HTTP] ${method} ${url} ${status} - ${duration}ms`);
    else if (duration > 2000) console.warn(`[HTTP] ⚠️ Lento: ${method} ${url} ${status} - ${duration}ms`);
  });
  next();
};
```

### 14.2 Health Endpoints

```typescript
// GET /api/health → Estado del servidor + DB
app.get('/api/health', async (_req, res) => {
  const health = await dbManager.checkHealth();
  res.status(health.status === 'healthy' ? 200 : 503).json({
    status: health.status,
    database: health.details,
    environment: process.env.NODE_ENV,
  });
});

// GET /api/db-status → Estado de conexión a Supabase
app.get('/api/db-status', async (_req, res) => {
  const health = await dbManager.checkHealth();
  res.status(200).json({ status: health.status === 'healthy' ? 'connected' : 'disconnected' });
});
```

### 14.3 Audit Service

**Archivo**: `backend/src/services/audit.service.ts`

Registra operaciones CRUD en la tabla `t_change_log` con información de quién, qué, cuándo y valores anteriores/posteriores.

---

## Resumen de Arquitectura en 10 Puntos

1. **Modular Monolith** — Un backend Express.js con capas bien definidas, no microservicios
2. **Layered Architecture** — Routes → Controllers → Services → DB Layer (nadie saltea capas)
3. **Adapter Pattern** — DatabaseManager con SupabaseAdapter (cloud) y PGliteAdapter (offline)
4. **Singleton** — DatabaseManager, instancia única global
5. **Factory Method** — crudServiceFactory genérico para CRUDs, AI Provider Factory
6. **Proxy Pattern** — Vercel proxy reversa /api/* a Render (elimina CORS en producción)
7. **Container/Presentational** — Pages orquestan, Components renderizan
8. **Retry + Auto-refresh** — Exponential backoff en Axios, renovación silenciosa de sesión
9. **Observer via SSE** — Notificaciones en tiempo real, unidireccional servidor → cliente
10. **Dual DB Mode** — Cloud (Supabase) + Offline (PGlite WASM) con la misma interfaz

---

> **Documento generado a partir del código fuente del proyecto UNEFA Dashboard v2.2.0**
> Repositorio: https://github.com/Antony-Figueroa/UNEFA_DASHBOARD
