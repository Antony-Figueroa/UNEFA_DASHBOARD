# Project Context & Agent Guide

> **Guía completa para desarrolladores, agentes de IA y colaboradores del proyecto UNEFA Dashboard**

---

## 1. Project Overview

**UNEFA Dashboard** es un sistema de gestión académica completo diseñado para universidades.

- **Tipo**: Full-stack Web Application (Admin Dashboard) + Desktop App (Electron)
- **Versión**: 2.2.0
- **Core Value**: Arquitectura robusta y escalable para gestión académica integral
- **SIGP**: Sistema de Información para la Gestión de Pasantías
- **Language**: Global Spanish (es)
- **Licencia**: MIT

---

## 2. Tech Stack

### Frontend (`/`)

| Categoría | Tecnología |
|-----------|-----------|
| **Framework** | React 19 + Vite 6 |
| **Lenguaje** | TypeScript 5.7.2 (strict mode) |
| **Styling** | Tailwind CSS v4 + Variables CSS Semánticas |
| **Routing** | React Router 7 (lazy loading, 40+ routes) |
| **Forms/Validation** | React Hook Form + Zod 4 |
| **HTTP Client** | Axios (interceptores con auto-refresh, retry exponencial) |
| **Charts** | ApexCharts + react-apexcharts, react-jvectormap |
| **Calendar** | FullCalendar (daygrid, timegrid, list, interaction) |
| **Animation** | Framer Motion 12 + Motion |
| **Maps** | MapLibre GL (mapas base CartoDB, OSM, ArcGIS) |
| **UI Icons** | Lucide React, React Icons |
| **UI Components** | Flatpickr, Swiper 11, react-dropzone, react-dnd, react-markdown + remark-gfm |
| **Notifications** | React Hot Toast |
| **3D/Particles** | tsParticles + OGL |
| **PDF** | @react-pdf/renderer |
| **PWA** | vite-plugin-pwa (service worker, offline manifest) |
| **Analytics** | @vercel/analytics |
| **Desktop** | Electron 42 + electron-builder (NSIS installer) |
| **Testing** | Vitest + @testing-library/react, Playwright E2E |
| **Storybook** | Storybook 8 (addon-essentials, interactions, test) |

### Backend (`/backend`)

| Categoría | Tecnología |
|-----------|-----------|
| **Runtime** | Node.js >= 18.x |
| **Framework** | Express.js 4.22 |
| **Language** | TypeScript 5.7 |
| **Auth** | JWT + Bcryptjs + cookie-parser (sesiones vía cookies httpOnly) |
| **DB Client** | Supabase JS (PostgreSQL) + Prisma ORM |
| **DB Adapter** | DatabaseManager singleton: cloud (Supabase) + offline (PGlite WASM) |
| **Security** | Helmet (CSP estricto), CORS dinámico |
| **Email** | Resend + Nodemailer |
| **AI** | Google Gemini (primary), Groq (fallback), OpenRouter |
| **External APIs** | Cédula API (validación de identidad venezolana) |
| **File Upload** | Multer |
| **Excel** | exceljs + xlsx (import/export) |
| **Testing** | Vitest + Supertest |

### Infrastructure

| Categoría | Tecnología |
|-----------|-----------|
| **Database** | Supabase (PostgreSQL managed) |
| **Frontend Host** | Vercel (SPA + API proxy a Render) |
| **Backend Host** | Render (Node.js web service) |
| **Container** | Docker + Docker Compose (multi-stage, Node 20 Alpine) |
| **Desktop** | Electron 42 + PGlite (PostgreSQL WASM local) |
| **CI/CD** | GitHub Actions |
| **PWA** | Service Worker con runtime caching, auto-update |



---

## 3. Architecture

```text
Flujo de datos:
1. UI Components → Eventos del usuario
2. Pages → Orquestación de features
3. Hooks (features/*/hooks) → Estado y lógica de negocio
4. Services (features/*/services) → Comunicación con API
5. Backend Routes (backend/src/routes) → Recepción de requests
6. Controllers (backend/src/controllers) → Ejecución de lógica
7. DB Layer → DatabaseManager (cloud: Supabase | offline: PGlite WASM)

Modo Desktop (Electron):
- PGliteAdapter reemplaza a SupabaseClient localmente
- SyncService sincroniza datos Supabase → PGlite al iniciar
- Los controllers no cambian: usan dbManager.getConnection()
```

### Directory Structure Key

src/
├── features/          # Self-contained modules (41 features)
│   ├── academic-config/
│   ├── activity-logs/
│   ├── address/
│   ├── ai-assistant/
│   ├── auth/
│   ├── backup/
│   ├── careers/
│   ├── config/
│   ├── culmination/
│   ├── dashboard/
│   ├── documents/
│   ├── enrollment/
│   ├── evaluations/
│   ├── evaluations-culmination/
│   ├── institutions/
│   ├── internship-home/
│   ├── internship-types/
│   ├── landing-config/
│   ├── lists/
│   ├── manuals/
│   ├── notifications/
│   ├── periods/
│   ├── permissions/
│   ├── persons/
│   ├── pre-enrollment/
│   ├── prospectos/
│   ├── reminders/
│   ├── reports/
│   ├── roles/
│   ├── security-questions/
│   ├── student/
│   ├── student-detail/
│   ├── student-requests/
│   ├── students/
│   ├── tracking/
│   ├── tutor/
│   ├── tutors/
│   ├── types/
│   ├── users/
│   └── visits/
│
├── api/               # Centralized Axios instance + factories
├── components/        # Shared components (UI, Form, Common, Theme, auth, charts, etc.)
├── layout/            # Main layout shell (Sidebar, Header)
├── pages/             # 33 route pages (lazy loaded)
├── routes/            # Route definitions (lazy loaded, 40+ routes)
├── context/           # 6 Global contexts (Auth, Theme, Sidebar, Tab, Toast, DbStatus)
├── hooks/             # 16 shared hooks
└── theme/             # Brand colors system (8 palettes)

backend/src/
├── controllers/       # 49 controllers (business logic)
├── routes/            # 51 route files (endpoints)
├── middlewares/       # Auth, validation, error handling, rate-limit
├── services/          # 43 services (email, AI, sync, SSE, schedulers, RAG, etc.)
├── migrations/        # 22 SQL migrations
├── lib/               # Database adapters, cache, performance middleware
├── config/            # System configuration
├── interfaces/        # TypeScript interfaces
├── models/            # Data models
└── utils/             # Utility functions
```

---

## 4. Features Map

### Sistema de Módulos (41 Features)

| Feature | Descripción | Endpoints | Componentes Clave |
| --------- | ------------- | ----------- | ------------------- |
| **auth** | Autenticación y sesiones | `/api/auth/*` | AuthContext, ProtectedRoute |
| **periods** | Periodos académicos | `/api/periodos` | PeriodModal, PeriodTable, DualCalendar |
| **careers** | Carreras universitarias | `/api/careers` | CareerModal, CareerTable |
| **students** | Gestión de estudiantes | `/api/students` | StudentModal, StudentTable |
| **tutors** | Tutores académicos | `/api/tutors` | TutorModal, TutorTable |
| **institutions** | Instituciones externas | `/api/institutions` | InstitutionModal, InstitutionTable |
| **enrollment** | Inscripciones | `/api/enrollments` | EnrollmentForm, EnrollmentTable |
| **pre-enrollment** | Pre-inscripciones | `/api/pre-enrollments` | PreEnrollmentForm |
| **tracking** | Seguimiento de pasantías | `/api/tracking` | TrackingTable, VisitForm |
| **evaluations** | Evaluaciones de prácticas | `/api/evaluations` | EvaluationModal, EvaluationsList, EvaluationCriteria |
| **activity-logs** | Bitácora de actividades | `/api/activity-logs` | ActivityLogModal, ActivityLogTable |
| **documents** | Documentos de estudiantes | `/api/documents` | DocumentsList, DocumentUpload |
| **student-requests** | Solicitudes de estudiantes | `/api/student/requests` | RequestForm, RequestsTable |
| **notifications** | Notificaciones en tiempo real | `/api/notifications` | NotificationBell, NotificationList |
| **theme** | Personalización de tema | `/api/user/theme` | ThemeColorPicker, UserThemeCard |
| **users** | Gestión de usuarios | `/api/users` | UserModal, UserTable |
| **dashboard** | Estadísticas y métricas | `/api/dashboard` | StatCards, Charts |
| **tutor** | Panel de tutor | `/api/tutor/*` | TutorDashboard, TutorStudents |
| **student** | Panel de estudiante | `/api/student/*` | StudentDashboard, StudentProfile |
| **internship-home** | Landing page pública | - | HeroSection, Features |
| **internship-types** | Tipos de pasantías | `/api/internship-types` | TypeModal, TypeTable |
| **lists** | Configuración de listas | `/api/lists` | ListConfig |
| **backups** | Respaldos de BD | `/api/backups` | BackupList, BackupCreate |
| **types** | Tipos compartidos | - | TypeScript definitions |
| **academic-config** | Config. académica (días gracia) | `/api/academic-config` | GraceConfigForm |
| **address** | Datos geográficos (estados/municipios) | `/api/address` | AddressSelector |
| **ai-assistant** | Asistente IA (Gemini/Groq) | `/api/ai` | ChatInterface, AIButton |
| **config** | Configuración del sistema | `/api/config` | SystemSettings |
| **culmination** | Culminación de pasantías | `/api/culmination` | CulminationForm |
| **evaluations-culmination** | Vista unificada eval+culminación | - | EvaluationsAndCulmination |
| **landing-config** | Config. landing page pública | `/api/landing-config` | LandingConfigurator |
| **manuals** | Manuales y documentos institucionales | `/api/manuals` | ManualsList |
| **permissions** | Permisos del sistema | `/api/permissions` | PermissionsMatrix |
| **persons** | Personas (registro unificado) | `/api/persons` | PersonForm |
| **prospectos** | Prospectos/postulantes | `/api/prospects` | ProspectTable |
| **reminders** | Recordatorios automáticos | `/api/reminder-config` | ReminderConfigPage |
| **reports** | Reportes exportables (Excel/PDF) | `/api/reports` | ReportsPage |
| **roles** | Roles de usuario | `/api/roles` | RolesPermissions |
| **security-questions** | Preguntas de seguridad | `/api/security-questions` | SecurityQuestionsForm |
| **student-detail** | Detalle de estudiante | - | StudentDetailView |
| **visits** | Visitas de seguimiento | `/api/visits` | VisitForm |
| **config** | Configuración del sistema | `/api/dashboard-config` | DashboardConfigurator |


### Estructura de un Feature (Patrón Estándar)

Cada feature en `src/features/[feature-name]/` sigue esta estructura:

```text
[feature-name]/
├── components/
│   ├── [Feature]Modal.tsx        # Modal de creación/edición
│   ├── [Feature]Table.tsx        # Tabla de listado
│   ├── [Feature]ViewModal.tsx    # Modal de visualización
│   └── __tests__/                # Tests unitarios
│
├── hooks/
│   └── use[Feature].tsx          # Hook principal CRUD
│
├── services/
│   ├── [feature]Service.tsx      # Comunicación con API
│   └── __tests__/
│
├── types/
│   └── index.tsx                 # Tipos TypeScript
│
└── utils/                         # (Opcional)
    └── [feature]Validations.ts    # Validaciones específicas
```

---

## 5. Key Workflows

### Development

```bash
# Opción 1: Todo con Docker
docker-compose up --build

# Opción 2: Frontend y Backend separados
npm run dev                  # Frontend (Puerto 5173)
cd backend && npm run dev    # Backend (Puerto 3000)

# Opción 3: Solo Frontend (backend externo)
VITE_API_URL=https://api.example.com npm run dev
```

### Adding a New Feature (Step-by-Step)

1. **Create Feature Directory Structure**
```bash
   mkdir -p src/features/my-feature/{components,hooks,services,types}
   ```

2. **Define Types** (`types/index.tsx`)
```typescript
   export interface MyFeature {
     id: string;
     name: string;
     // ...
   }
   ```

3. **Create Service** (`services/myFeatureService.tsx`)
```typescript
   import apiClient from '@/api/apiClient';
   
   export const myFeatureService = {
     getAll: () => apiClient.get('/api/my-features'),
     getById: (id: string) => apiClient.get(`/api/my-features/${id}`),
     create: (data: any) => apiClient.post('/api/my-features', data),
     update: (id: string, data: any) => apiClient.put(`/api/my-features/${id}`, data),
     delete: (id: string) => apiClient.delete(`/api/my-features/${id}`)
   };
   ```

4. **Create Hook** (`hooks/useMyFeature.tsx`)
```typescript
   import { useState } from 'react';
   import toast from 'react-hot-toast';
   import { myFeatureService } from '../services/myFeatureService';
   
   export const useMyFeature = () => {
     const [items, setItems] = useState([]);
     const [loading, setLoading] = useState(false);
     
     const fetchItems = async () => {
       setLoading(true);
       try {
         const response = await myFeatureService.getAll();
         setItems(response.data);
       } catch (error) {
         toast.error('Error al cargar datos');
       } finally {
         setLoading(false);
       }
     };
     
     const addItem = async (data: any) => {
       try {
         const response = await myFeatureService.create(data);
         setItems(prev => [...prev, response.data]);
         toast.success('Creado exitosamente');
       } catch (error) {
         toast.error('Error al crear');
       }
     };
     
     return { items, loading, fetchItems, addItem };
   };
   ```

5. **Create Components** (Modal, Table, etc.)
   
6. **Create Backend Controller** (`backend/src/controllers/my-feature.controller.ts`)

7. **Create Backend Routes** (`backend/src/routes/my-feature.routes.ts`)

8. **Register Routes in App** (`backend/src/app.ts`)

9. **Add Page** (`src/pages/MyFeature/MyFeature.tsx`)

10. **Register Route** (`src/routes/index.tsx`)

---

## 6. Development Standards (STRICT)

### Code Style

#### TypeScript

- ✅ **Strict typing required**. Evitar `any` en todo momento
- ✅ **Interfaces** para objetos, **Types** para unions/primitives
- ✅ **Exports typed**: Todas las funciones públicas deben tener tipos explícitos

```typescript
// ✅ GOOD
interface User {
  id: string;
  name: string;
  role: UserRole;
}

export const getUser = (id: string): Promise<User> => {
  // ...
};

// ❌ BAD
export const getUser = (id: any): any => {
  // ...
};
```

#### Naming Conventions

- **Components**: `PascalCase` (e.g., `PeriodModal`, `StudentTable`)
- **Hooks**: `camelCase` starting with `use` (e.g., `usePeriods`, `useAuth`)
- **Functions/Variables**: `camelCase` (e.g., `fetchStudents`, `isLoading`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRIES`, `API_BASE_URL`)
- **Types/Interfaces**: `PascalCase` (e.g., `Period`, `StudentData`)

#### File Naming

- **Components**: `PascalCase.tsx` (e.g., `PeriodModal.tsx`)
- **Hooks**: `camelCase.tsx` (e.g., `usePeriods.tsx`)
- **Utils**: `camelCase.ts` (e.g., `formatDate.ts`)

### UX/UI (`technical-specs.md`)

#### Colors
- ✅ **Use semantic variables**: `--color-text-primary`, `--color-btn-primary-bg`
- ❌ **NO hardcoded hex values**: `#3B82F6` _(NEVER)_

```css
/* ✅ GOOD */
.button {
  background: var(--color-btn-primary-bg);
}

/* ❌ BAD */
.button {
  background: #3B82F6;
}
```

#### Contrast

- **Mínimo**: WCAG AA (4.5:1)
- **Objetivo**: WCAG AAA (7:1)

#### Consistency

- Seguir definiciones de componentes en `components/ui/`
- Usar componentes atómicos reutilizables
- Aplicar spacing consistente (Tailwind classes)

### Error Handling

```typescript
// ✅ Pattern Standard
const addPeriod = async (data: PeriodData) => {
  try {
    setLoading(true);
    const response = await periodService.create(data);
    setPeriods(prev => [...prev, response.data]);
    toast.success('Periodo creado exitosamente');
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Error al crear periodo';
    toast.error(message);
    console.error('[usePeriods] Error creating period:', error);
    throw error;
  } finally {
    setLoading(false);
  }
};
```

### Hooks Best Practices

1. **Encapsulate logic**: Toda lógica de negocio debe estar en hooks
2. **Return objects, not arrays**: `{ data, loading, error }` no `[data, loading, error]`
3. **Cleanup effects**: Siempre limpiar listeners, timeouts, etc.
4. **Dependencies accuracy**: Evitar `eslint-disable` en useEffect

---

## 7. Important Files & Directories

| Path | Description |
| ------ | ------------- |
| Path | Description |
| ------ | ------------- |
| [`src/api/apiClient.ts`](file:///c:/Users/Server%20Admin/Documents/GitHub/UNEFA_DASHBOARD/src/api/apiClient.ts) | Cliente Axios con interceptores (auth, retries, errors) |
| [`src/api/crudServiceFactory.ts`](file:///c:/Users/Server%20Admin/Documents/GitHub/UNEFA_DASHBOARD/src/api/crudServiceFactory.ts) | Factory para servicios CRUD genéricos |
| [`src/context/AuthContext.tsx`](file:///c:/Users/Server%20Admin/Documents/GitHub/UNEFA_DASHBOARD/src/context/AuthContext.tsx) | Contexto global de autenticación |
| [`src/routes/index.tsx`](file:///c:/Users/Server%20Admin/Documents/GitHub/UNEFA_DASHBOARD/src/routes/index.tsx) | Definición de rutas con lazy loading |
| [`technical-specs.md`](file:///c:/Users/Server%20Admin/Documents/GitHub/UNEFA_DASHBOARD/technical-specs.md) | Sistema de colores y especificaciones UI |
| [`ux-standards.md`](file:///c:/Users/Server%20Admin/Documents/GitHub/UNEFA_DASHBOARD/ux-standards.md) | Estándares UX y accesibilidad |
| [`DOCKER_GUIDE.md`](file:///c:/Users/Server%20Admin/Documents/GitHub/UNEFA_DASHBOARD/DOCKER_GUIDE.md) | Docker setup y troubleshooting |
| [`DB-postgres.sql`](file:///c:/Users/Server%20Admin/Documents/GitHub/UNEFA_DASHBOARD/DB-postgres.sql) | Database schema reference |

---

## 8. Common Patterns

### Pattern 1: CRUD Feature

Revisar `src/features/periods/` como ejemplo completo:
- Hook: `usePeriods.tsx`
- Service: `periodService.tsx`
- Components: `PeriodModal.tsx`, `PeriodTable.tsx`, `PeriodViewModal.tsx`
- Types: `types/index.tsx`
- Validations: `utils/periodValidations.ts`

### Pattern 2: Modal with Form

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  description: z.string().optional()
});

type FormData = z.infer<typeof schema>;

export const MyModal = ({ isOpen, onClose, onSubmit }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema)
  });

  const onSubmitForm = (data: FormData) => {
    onSubmit(data);
    onClose();
  };

  return (
    <UnifiedDialog isOpen={isOpen} onClose={onClose} title="Crear">
      <form onSubmit={handleSubmit(onSubmitForm)}>
        <CustomInput
          label="Nombre"
          {...register('name')}
          error={errors.name?.message}
        />
        
        <button type="submit">Guardar</button>
      </form>
    </UnifiedDialog>
  );
};
```

### Pattern 3: Table with Actions

```typescript
export const MyTable = ({ data, onEdit, onDelete }) => {
  const columns = [
    { key: 'name', label: 'Nombre' },
    { key: 'status', label: 'Estado' },
    { key: 'actions', label: 'Acciones' }
  ];

  return (
    <Table columns={columns}>
      {data.map(item => (
        <TableRow key={item.id}>
          <TableCell>{item.name}</TableCell>
          <TableCell>
            <Badge variant={item.status}>{item.status}</Badge>
          </TableCell>
          <TableCell>
            <ActionButtons
              onEdit={() => onEdit(item)}
              onDelete={() => onDelete(item.id)}
            />
          </TableCell>
        </TableRow>
      ))}
    </Table>
  );
};
```

---

## 9. Troubleshooting Guide

### Common Issues

#### 1. "Module not found" Errors
**Síntoma**: `Cannot find module '@/components/...'`

**Solución**:
- Verificar `tsconfig.json` paths configuration
- Reiniciar TS server en VSCode (`Ctrl+Shift+P` → "Restart TS Server")
- Verificar que el path sea correcto (case-sensitive)

#### 2. Supabase Connection Errors
**Síntoma**: `Connection to Supabase failed`

**Solución**:
- Verificar `.env` y `backend/.env` tienen las credenciales correctas
- Verificar que `VITE_SUPABASE_URL` y `SUPABASE_URL` coincidan
- Revisar que el service role key sea el correcto (backend)

#### 3. CORS Errors
**Síntoma**: `Access-Control-Allow-Origin header is missing`

**Solución**:
- Verificar `backend/src/app.ts` configuración de CORS
- Asegurar que el frontend URL esté en allowed origins
- En producción, configurar `ALLOWED_ORIGINS` env var

#### 4. 401 Unauthorized After Login
**Síntoma**: Redirect loop a `/signin`

**Solución**:
- Verificar que las cookies se estén seteando (`withCredentials: true`)
- Revisar `apiClient.ts` configuración
- Verificar middleware de auth en backend
- Comprobar que `JWT_SECRET` sea el mismo en backend

#### 5. Docker Container Fails to Start
**Síntoma**: Container exits immediately

**Solución**:
- Verificar que los archivos `.env` existan
- Revisar logs: `docker-compose logs -f`
- Verificar puertos no estén en uso: `netstat -ano | findstr :5173`
- Reconstruir: `docker-compose down && docker-compose up --build`

---

## 10. MCP Tools Usage — Agent Behavior Rules

Este proyecto está instrumentado con múltiples servidores MCP. Las siguientes reglas son **obligatorias** para cualquier agente/IA que trabaje en el codebase.

---

### ⚠️ Priority 1: Use Codebase Memory (knowledge graph) antes de explorar código

**Codebase Memory** indexó el proyecto en un grafo de conocimiento: **13.941 nodos, 28.990 aristas** — funciones, rutas, interfaces, clusters con 85% de cohesión.

**CUANDO USAR Codebase Memory:**
- Para entender un flujo completo sin leer archivos: `trace_path`
- Para buscar funciones, componentes o tipos: `search_graph`
- Para explorar un feature antes de modificarlo: `search_graph(query: "...")` + `trace_path`
- Para obtener la arquitectura general: `get_architecture(aspects: ['all'])`
- Para medir impacto de cambios sin commitear: `detect_changes`
- Para encontrar hot spots / código de alto riesgo: `query_graph` con filtros de complejidad
- Para hacer preguntas estructurales (quién llama esto, quién implementa esto): `trace_path` y `search_graph`

**CÓMO USAR Codebase Memory:**

```text
# Entender qué llama  una función
trace_path(function_name="getStudents", direction="both", depth=3)

# Buscar algo por nombre
search_graph(name_pattern=".*Period.*", label="Function")

# Busqueda semántica (entiende contexto)
search_graph(query="periodos academicos con fechas")

# Arquitectura completa
get_architecture(aspects=['all'])

# Cambios sin commitear + impacto
detect_changes()

# Cypher query — encontrar dead code
query_graph(query="MATCH (f:Function) WHERE NOT EXISTS { (f)<-[:CALLS]-() } AND NOT f.is_entry_point AND f.qualified_name STARTS WITH 'C-Users-Server-Admin-Documents-GitHub-UNEFA_DASHBOARD.src' AND size(f.file_path) > 0 RETURN f.name, f.file_path")

# Cypher query — funciones complejas
query_graph(query="MATCH (f:Function) WHERE f.complexity > 15 RETURN f.name, f.file_path, f.complexity, f.cognitive ORDER BY f.complexity DESC")
```

**ANTES DE** leer 3+ archivos para entender algo, preguntale al grafo. Una `trace_path` reemplaza 10-15 tool calls de grep/read.

---

### ⚠️ Priority 2: Use Context7 MCP for Documentation

**Context7** proporciona documentación actualizada y ejemplos de librerías/frameworks.

**CUANDO USAR Context7:**
- Antes de implementar cualquier feature nueva
- Al usar librerías o dependencias del proyecto
- Para entender APIs de terceros
- Para verificar mejores prácticas de frameworks (React, Next.js, Tailwind, etc.)
- Antes de buscar en el código cuando hay documentación oficial disponible

**CÓMO USAR Context7:**

```bash
# 1. Primero resolver el library ID
context7_resolve-library-id(query: "qué necesitas", libraryName: "nombre de librería")

# 2. Luego consultar la documentación
context7_query-docs(libraryId: "/react/react", query: "tu pregunta específica")
```

**EJEMPLOS DE USO:**
| Necesidad | Context7 Query |
|-----------|----------------|
| React useState | "useState hook examples" |
| Tailwind forms | "form input styling" |
| React Hook Form | "form validation with zod" |
| Supabase auth | "user authentication" |
| Next.js routing | "dynamic routes" |

**NUNCA** buscar en el código primero si hay documentación oficial disponible en Context7.

---

### ⚠️ Priority 3: Use Engram (persistent memory)

**Engram** guarda contexto entre sesiones — archivos modificados, decisiones, bugs, descubrimientos.

**CUANDO USAR Engram:**
- Cada vez que terminás una tarea sustancial: `mem_save` con el resumen
- Al empezar una sesión: preguntar primero si hay contexto previo
- Si te referís a "como hicimos X antes": buscar con `mem_search`
- Si completás un cambio importante: `mem_session_summary`

---

### ⚠️ Priority 4: Systematic Debugging
1. **Reproduce** the error first
2. **Check logs**: Browser console + backend terminal (Supabase MCP: `get_logs`)
3. **Isolate** (frontend vs backend vs database — usá `trace_path` si es code flow)
4. **Use Codebase Memory** para entender el flujo del bug: `trace_path(funcion, direction="inbound")`
5. **Use Context7** si el bug involucra una librería externa
6. **Fix** with minimal changes
7. **Test** the fix thoroughly
8. **Save discovery** a Engram: `mem_save` con tipo `bugfix`

---

### ⚠️ Priority 5: Planning Before Coding (con grafo)
1. **Use `detect_changes()`** para ver impacto de cambios no commiteados
2. **Use `get_architecture()`** si es un cambio grande
3. **Use `trace_path()`** o `search_graph()`** para entender el feature completo
4. **Use Context7** para documentación de librerías involucradas
5. **Check** existing patterns and features
6. **Design** the solution
7. **Implement** incrementally

---

### Performance & Quality
- ✅ Use `React.memo` for expensive components
- ✅ Lazy load routes and heavy components
- ✅ Debounce search inputs
- ✅ Optimize images and assets
- ✅ Use pagination for large lists
- ✅ Implement proper caching strategies
- ✅ Use Codebase Memory `query_graph` para encontrar código complejo antes de refactors
- ✅ Usar `detect_changes` antes de commits grandes para verificar impacto

### Aesthetics & UX
- ✅ Follow design system religiously
- ✅ Implement loading states everywhere
- ✅ Show meaningful error messages
- ✅ Add smooth transitions (Framer Motion)
- ✅ Support keyboard navigation
- ✅ Ensure WCAG AA compliance minimum

---

## 11. Quick Reference Commands

```bash
# Development
npm run dev                      # Start frontend dev server
cd backend && npm run dev        # Start backend dev server

# Build
npm run build                    # Build frontend for production
cd backend && npm run build      # Build backend (if needed)

# Testing
npm test                         # Run tests
npm run lint                     # Lint code

# Docker
docker-compose up --build        # Start all services
docker-compose down              # Stop all services
docker-compose logs -f [service] # View logs

# Database
# Ver DB-postgres.sql para schema reference
# Usar dashboard de Supabase para queries manuales
```

---

## 12. Resources & Links

- **React Docs**: https://react.dev/
- **TypeScript Docs**: https://www.typescriptlang.org/docs/
- **Tailwind CSS v4**: https://tailwindcss.com/
- **Vite Docs**: https://vitejs.dev/guide/
- **Supabase Docs**: https://supabase.com/docs
- **React Hook Form**: https://react-hook-form.com/
- **Zod**: https://zod.dev/
- **Electron**: https://www.electronjs.org/docs
- **PGlite**: https://pglite.dev/
- **Framer Motion**: https://motion.dev/
- **MapLibre GL**: https://maplibre.org/
- **Playwright**: https://playwright.dev/
- **Storybook**: https://storybook.js.org/
- **Render**: https://render.com/docs
- **Vercel**: https://vercel.com/docs**
