# Project Context & Agent Guide

> **Guía completa para desarrolladores, agentes de IA y colaboradores del proyecto UNEFA Dashboard**

---

## 1. Project Overview

**UNEFA Dashboard** es un sistema de gestión académica completo diseñado para universidades.

- **Tipo**: Full-stack Web Application (Admin Dashboard)
- **Versión**: 2.0.2
- **Core Value**: Arquitectura robusta y escalable para gestión académica integral
- **Language**: Global Spanish (es)
- **Licencia**: MIT

---

## 2. Tech Stack


### Frontend (`/`)

- **Framework**: React 19 + Vite 6
- **Lenguaje**: TypeScript 5.7.2 (strict mode)
- **Styling**: Tailwind CSS v4 + Variables CSS Semánticas
- **State/Logic**: React Hooks (Custom), Context API (Global)
- **Routing**: React Router 7 (lazy loading)
- **Forms**: React Hook Form + Zod
- **HTTP Client**: Axios (con interceptores)
- **UI Libs**: ApexCharts, FullCalendar, Framer Motion, React Hot Toast, Lucide React
- **PDF**: @react-pdf/renderer





### Backend (`/backend`)

- **Runtime**: Node.js >= 18.x
- **Framework**: Express.js 4.22
- **Language**: TypeScript
- **Auth**: JWT + Bcryptjs
- **Database Client**: Supabase JS (PostgreSQL)
- **Security**: Helmet, CORS




### Infrastructure

- **Database**: Supabase (PostgreSQL managed)
- **Containerization**: Docker + Docker Compose
- **Deployment**: Vercel (Frontend), Railway/Render (Backend)
- **Analytics**: Vercel Analytics



---

## 3. Architecture

- **Runtime**: Node.js >= 18.x
- **Framework**: Express.js 4.22
- **Language**: TypeScript
- **Auth**: JWT + Bcryptjs
- **Database Client**: Supabase JS (PostgreSQL)
- **Security**: Helmet, CORS

```text
1. UI Components → Eventos del usuario
2. Pages → Orchestación de features
3. Hooks (features/*/hooks) → Estado y lógica de negocio
4. Services (features/*/services) → Comunicación con API
5. Backend Routes (backend/src/routes) → Recepción de requests
6. Controllers (backend/src/controllers) → Ejecución de lógica
7. DB Layer → Interacción con Supabase
```

### Directory Structure Key

src/
├── features/          # Self-contained modules (16 features)
│   ├── auth/
│   ├── periods/
│   ├── careers/
│   ├── students/
│   ├── tutors/
│   ├── institutions/
│   ├── enrollment/
│   ├── pre-enrollment/
│   ├── tracking/
│   ├── users/
│   ├── dashboard/
│   ├── internship-home/
│   ├── internship-types/
│   ├── lists/
│   ├── crudTemplate/
│   └── types/
│
├── api/               # Centralized Axios instance + factories
├── components/        # Shared components (UI, Form, Common)
├── layout/            # Main layout shell (Sidebar, Header)
├── pages/             # 37 route pages
├── routes/            # Route definitions (lazy loaded)
├── context/           # Global contexts (Auth, Theme, etc.)
└── hooks/             # 9 shared hooks

```text
src/
├── features/          # Self-contained modules (16 features)
│   ├── auth/
│   ├── periods/
│   ├── careers/
│   ├── students/
│   ├── tutors/
│   ├── institutions/
│   ├── enrollment/
│   ├── pre-enrollment/
│   ├── tracking/
│   ├── users/
│   ├── dashboard/
│   ├── internship-home/
│   ├── internship-types/
│   ├── lists/
│   ├── crudTemplate/
│   └── types/
│
├── api/               # Centralized Axios instance + factories
├── components/        # Shared components (UI, Form, Common)
├── layout/            # Main layout shell (Sidebar, Header)
├── pages/             # 37 route pages
├── routes/            # Route definitions (lazy loaded)
├── context/           # Global contexts (Auth, Theme, etc.)
└── hooks/             # 9 shared hooks

backend/src/
├── controllers/       # 14 controllers (business logic)
├── routes/            # 14 route files (endpoints)
├── middlewares/       # Auth, validation, error handling
├── services/          # Email, external integrations
└── lib/               # Supabase client, utilities
```

---

## 4. Features Map

### Sistema de Módulos (16 Features)

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
| **users** | Gestión de usuarios | `/api/users` | UserModal, UserTable |
| **dashboard** | Estadísticas y métricas | `/api/dashboard` | StatCards, Charts |
| **internship-home** | Landing page pública | - | HeroSection, Features |
| **internship-types** | Tipos de pasantías | `/api/internship-types` | TypeModal, TypeTable |
| **lists** | Configuración de listas | `/api/lists` | ListConfig |
| **crudTemplate** | Template para nuevos features | - | Ejemplo CRUD completo |
| **types** | Tipos compartidos | - | TypeScript definitions |


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

 - **Database**: Supabase (PostgreSQL managed)
 - **Containerization**: Docker + Docker Compose
 - **Deployment**: Vercel (Frontend), Railway/Render (Backend)
 - **Analytics**: Vercel Analytics

   import toast from 'react-hot-toast';
   
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


  ```text
  1. UI Components → Eventos del usuario
  2. Pages → Orchestación de features
  3. Hooks (features/*/hooks) → Estado y lógica de negocio
  4. Services (features/*/services) → Comunicación con API
  5. Backend Routes (backend/src/routes) → Recepción de requests
  6. Controllers (backend/src/controllers) → Ejecución de lógica
  7. DB Layer → Interacción con Supabase
  ```

1. **Add Page** (`src/pages/MyFeature/MyFeature.tsx`)

2. **Register Route** (`src/routes/index.tsx`)

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
```text
backend/src/
├── controllers/       # 14 controllers (business logic)
├── routes/            # 14 route files (endpoints)
├── middlewares/       # Auth, validation, error handling
├── services/          # Email, external integrations
└── lib/               # Supabase client, utilities
```

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

## 10. Agent Behavior Rules

### Systematic Debugging
1. **Reproduce** el error first
2. **Check logs**: Browser console + backend terminal
3. **Isolate** the issue (frontend vs backend vs database)
4. **Fix** with minimal changes
5. **Test** the fix thoroughly
6. **Document** en CHANGELOG si es relevante

### Planning Before Coding
1. **Understand** the requirement completely
2. **Check** existing patterns and  features
3. **Design** the solution (diagramas si es complejo)
4. **Get approval** for large changes
5. **Implement** incrementally
6. **Test** at each step

### Performance First
- ✅ Use `React.memo` for expensive components
- ✅ Lazy load routes and heavy components
- ✅ Debounce search inputs
- ✅ Optimize images and assets
- ✅ Use pagination for large lists
- ✅ Implement proper caching strategies

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

---

**💡 Para análisis arquitectónico completo, ver [analisis_arquitectonico.md](file:///C:/Users/Server%20Admin/.gemini/antigravity/brain/dfdf19b2-b679-41e5-8b88-5807eeb8b79c/analisis_arquitectonico.md)**
