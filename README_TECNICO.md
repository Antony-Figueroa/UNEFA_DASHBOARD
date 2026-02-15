# UNEFA Dashboard - Documentación Técnica Completa

> **Especificaciones técnicas profundas de implementación, patrones de diseño y guías de mantenimiento**

---

## 📋 Índice

1. [Arquitectura del Sistema](#-arquitectura-del-sistema)
2. [Tecnologías y Versiones](#-tecnologías-y-versiones)  
3. [Sistema de Gestión de Estado](#-sistema-de-gestión-de-estado)
4. [API Client y Comunicación](#-api-client-y-comunicación)
5. [Sistema de Autenticación](#-sistema-de-autenticación)
6. [Patrones de Diseño Implementados](#-patrones-de-diseño-implementados)
7. [Testing](#-testing)
8. [Performance y Optimizaciones](#-performance-y-optimizaciones)
9. [Guía de Mantenimiento](#-guía-de-mantenimiento)

---

## 🏗️ Arquitectura del Sistema

### Clean Architecture + Feature-Based

El proyecto implementa una combinación de **Clean Architecture** y **Feature-Based Architecture** para máxima mantenibilidad y escalabilidad.

#### Principios SOLID Aplicados

- **S** - Single Responsibility: Cada módulo/hook/servicio tiene una única responsabilidad
- **O** - Open/Closed: Extensible vía factories, cerrado a modificación de código base
- **L** - Liskov Substitution: Componentes intercambiables con misma interfaz
- **I** - Interface Segregation: Interfaces específicas no genéricas
- **D** - Dependency Inversion: Dependencia de abstracciones (hooks/services), no implementaciones concretas

### Flujo de Datos Unidireccional

\`\`\`mermaid
sequenceDiagram
    participant UI as UI Component
    participant Hook as Custom Hook
    participant Service as Service Layer
    participant API as API Client
    participant Backend as Express Server
    participant DB as Supabase

    UI->>Hook: User Action
    Hook->>Service: Call Service Method
    Service->>API: HTTP Request (Axios)
    API->>Backend: API Call
    Backend->>DB: Query/Mutation
    DB-->>Backend: Data
    Backend-->>API: Response
    API-->>Service: Parsed Data
    Service-->>Hook: Update State
    Hook-->>UI: Re-render
\`\`\`

### Organización por Features

Cada feature en \`src/features/[feature-name]/\` es completamente autocontenido:

\`\`\`
[feature]/
├── components/        # UI específica del feature
├── hooks/             # Lógica de negocio y estado
├── services/          # Comunicación con API
├── types/             # Definiciones TypeScript
└── utils/             # Utilidades específicas
\`\`\`

**Ventajas**:
- ✅ Fácil de entender y navegar
- ✅ Módulos independientes y reutilizables
- ✅ Escalable sin aumentar complejidad
- ✅ Testing más simple (unit tests por feature)

---

## 🛠️ Tecnologías y Versiones

### Frontend Stack

| Tecnología | Versión | Propósito | Decisión de Diseño |
|------------|---------|-----------|-------------------|
| **React** | 19.0.0 | UI Library | Última versión estable, performance mejorado |
| **TypeScript** | 5.7.2 | Type Safety | Strict mode para máxima seguridad de tipos |
| **Vite** | 6.1.0 | Build Tool | HMR ultra-rápido, optimización automática |
| **Tailwind CSS** | 4.1.18 | Styling | Utility-first, tree-shaking automático |
| **React Router** | 7.1.5 | Routing | Lazy loading nativo, mejor performance |
| **React Hook Form** | 7.69.0 | Forms | Menor re-renders, mejor performance |
| **Zod** | 4.3.3 | Validation | Type-safe schemas, runtime validation |
| **Axios** | 1.13.2 | HTTP Client | Interceptores, reintentos automáticos |

### Backend Stack

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Express** | 4.22.1 | Server Framework |
| **Supabase JS** | 2.90.1 | PostgreSQL Client |
| **JWT** | Latest | Authentication |
| **Bcrypt** | Latest | Password Hashing |
| **Helmet** | 8.1.0 | Security Headers |

---

## ⚙️ Sistema de Gestión de Estado

### Estrategia Multi-Nivel

#### 1. Estado Local (useState)
Para estado efímero de componentes (modales, toggles, forms):

\`\`\`typescript
const [isOpen, setIsOpen] = useState(false);
const [selectedItem, setSelectedItem] = useState<Item | null>(null);
\`\`\`

#### 2. Context API (Global State)
Para estado compartido entre toda la app:

**AuthContext** (\`src/context/AuthContext.tsx\`):
\`\`\`typescript
interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
}
\`\`\`

**Características**:
- ✅ Verificación de sesión al cargar app
- ✅ Sincronización entre pestañas (localStorage events)
- ✅ Logout con limpieza completa (localStorage + sessionStorage)
- ✅ Optimización: No verifica auth en rutas públicas

#### 3. Custom Hooks (Feature State)
Para lógica de negocio y estado de features:

**Patrón Estándar**:
\`\`\`typescript
export const useFeature = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await featureService.getAll();
      setItems(response.data);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Error al cargar';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (data: ItemData) => {
    try {
      const response = await featureService.create(data);
      setItems(prev => [...prev, response.data]);
      toast.success('Creado exitosamente');
      return response.data;
    } catch (err: any) {
      toast.error('Error al crear');
      throw err;
    }
  };

  return { items, loading, error, fetchItems, addItem };
};
\`\`\`

---

## 📡 API Client y Comunicación

### Axios Client Configurado (\`src/api/apiClient.ts\`)

#### Características Principales

1. **Base URL Dinámica**:
   \`\`\`typescript
   const baseURL = import.meta.env.VITE_API_URL || 
     (isProd ? "/api" : "http://localhost:3000/api");
   \`\`\`

2. **Timeout Extendido**: 40s para manejar cold-starts (Render/Railway)

3. **Credentials**: \`withCredentials: true\` para cookies HttpOnly

#### Interceptores

**Request Interceptor**:
- Logging de requests (desarrollo)
- Posibilidad de inyectar headers dinámicos

**Response Interceptor**:

1. **Manejo de 401 (Sesión Expirada)**:
   \`\`\`typescript
   if (error.response?.status === 401 && !isPublicPage) {
     window.location.replace('/signin');
   }
   \`\`\`

2. **Reintentos Exponenciales**:
   - Máximo 3 reintentos
   - Backoff: 2^retry * 1000ms
   - Solo para errores de red, 5xx, 429, 503:
   \`\`\`typescript
   const shouldRetry = 
     error.code === 'ECONNABORTED' ||
     error.code === 'ERR_NETWORK' ||
     !error.response ||
     error.response.status === 429 ||
     error.response.status === 503 ||
     error.response.status >= 500;
   \`\`\`

3. **Logging Contextual**:
   \`\`\`typescript
   console.error(\`[API Response Error]: \${error.message} en \${config?.url}\`, {
     status: error.response?.status,
     data: error.response?.data
   });
   \`\`\`

### CRUD Service Factory (\`src/api/crudServiceFactory.ts\`)

Genera servicios estandarizados para evitar código repetitivo:

\`\`\`typescript
export const createCrudService = <T>(endpoint: string) => ({
  getAll: () => apiClient.get<T[]>(\`/\${endpoint}\`),
  getById: (id: string) => apiClient.get<T>(\`/\${endpoint}/\${id}\`),
  create: (data: Partial<T>) => apiClient.post<T>(\`/\${endpoint}\`, data),
  update: (id: string, data: Partial<T>) => 
    apiClient.put<T>(\`/\${endpoint}/\${id}\`, data),
  delete: (id: string) => apiClient.delete(\`/\${endpoint}/\${id}\`)
});

// Uso:
export const periodsService = createCrudService<Period>('periodos');
\`\`\`

---

## 🔐 Sistema de Autenticación

### Flujo Completo

1. **Login** → Backend valida credenciales → Genera JWT → Set cookie HttpOnly
2. **Requests subsecuentes** → Cookie automáticamente incluida (withCredentials)
3. **Backend middleware** → Verifica JWT en cada request protegido
4. **Frontend AuthContext** → Mantiene estado de user

### Componentes de Autenticación

#### ProtectedRoute
\`\`\`typescript
<ProtectedRoute allowedRoles={[0, 1]}>
  <AdminPage />
</ProtectedRoute>
\`\`\`

**Características**:
- Verifica si usuario está autenticado
- Opcionalmente verifica roles permitidos
- Redirige a /signin si no autenticado
- Muestra loader durante verificación

#### PublicRoute
Solo accesible si **NO** está autenticado (signin, signup):
\`\`\`typescript
<PublicRoute>
  <SignIn />
</PublicRoute>
\`\`\`

### Sincronización entre Pestañas

\`\`\`typescript
// AuthContext escucha eventos de localStorage
useEffect(() => {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'auth_logout') {
      setUser(null);
      window.location.replace('/signin');
    }
  };
  window.addEventListener('storage', handleStorageChange);
  return () => removeEventListener('storage', handleStorageChange);
}, []);

// Al hacer logout, emite evento:
localStorage.setItem('auth_logout', Date.now().toString());
\`\`\`

---

## 🎨 Patrones de Diseño Implementados

### 1. Factory Pattern

**CRUD Service Factory**: Genera servicios CRUD genéricos
\`\`\`typescript
const periodsService = createCrudService<Period>('periodos');
const careersService = createCrudService<Career>('careers');
\`\`\`

### 2. Provider Pattern

**Context Providers**: Estado global compartido
\`\`\`typescript
<AuthProvider>
  <ThemeProvider>
    <App />
  </ThemeProvider>
</AuthProvider>
\`\`\`

### 3. Custom Hook Pattern

Encapsulación de lógica compleja:
\`\`\`typescript
const { periods, loading, addPeriod } = usePeriods();
\`\`\`

### 4. Compound Components

Componentes complejos con subcomponentes:
\`\`\`typescript
<UnifiedDialog isOpen={isOpen} onClose={onClose}>
  <DialogHeader>...</DialogHeader>
  <DialogBody>...</DialogBody>
  <DialogFooter>...</DialogFooter>
</UnifiedDialog>
\`\`\`

### 5. Render Props / Children as Function

Para componentes reutilizables con lógica customizable

### 6. Higher-Order Component (HOC)

ProtectedRoute, PublicRoute:
\`\`\`typescript
const withAuth = (Component) => {
  return (props) => {
    const { user } = useAuth();
    if (!user) return <Navigate to="/signin" />;
    return <Component {...props} />;
  };
};
\`\`\`

---

## 🧪 Testing

### Configuración (Vitest + Testing Library)

**vite.config.ts**:
\`\`\`typescript
test: {
  environment: 'jsdom',
  globals: true,
  setupFiles: './src/test/setup.ts'
}
\`\`\`

### Estrategia de Testing

1. **Unit Tests**: Hooks, servicios, utilidades
2. **Component Tests**: Componentes individuales
3. **Integration Tests**: Features completos

### Ejemplo de Test

\`\`\`typescript
import { renderHook, waitFor } from '@testing-library/react';
import { usePeriods } from '../hooks/usePeriods';

describe('usePeriods', () => {
  it('should fetch periods on mount', async () => {
    const { result } = renderHook(() => usePeriods());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.periods).toHaveLength(3);
    });
  });
});
\`\`\`

---

## ⚡ Performance y Optimizaciones

### Frontend

#### 1. Code Splitting Manual (Vite)

\`\`\`typescript
// vite.config.ts
manualChunks(id) {
  if (id.includes('@react-pdf')) return 'vendor-pdf';
  if (id.includes('apexcharts')) return 'vendor-charts';
  if (id.includes('lucide-react')) return 'vendor-icons';
  if (id.includes('react')) return 'vendor-core';
}
\`\`\`

**Resultado**: Chunks separados = mejor caching

#### 2. Lazy Loading de Rutas

\`\`\`typescript
const Home = lazy(() => import('../pages/Dashboard/Home'));
const Students = lazy(() => import('../pages/Students/students'));

<Route path="/dashboard" element={<Home />} />
<Route path="/students" element={<Students />} />
\`\`\`

#### 3. React.memo para Componentes Pesados

\`\`\`typescript
export const ExpensiveTable = React.memo(({ data }) => {
  // rendering pesado
}, (prevProps, nextProps) => {
  return prevProps.data === nextProps.data;
});
\`\`\`

#### 4. Debouncing en Búsquedas

\`\`\`typescript
const debouncedSearch = useMemo(
  () => debounce((query: string) => {
    performSearch(query);
  }, 300),
  []
);
\`\`\`

### Backend

1. **Connection Pooling**: Supabase maneja automáticamente
2. **Índices en DB**: En columnas frecuentemente consultadas
3. **Paginación**: Limitar resultados por página

---

## 🔧 Guía de Mantenimiento

### Añadir un Nuevo Feature

Ver guía completa en [AGENTS.md](file:///c:/Users/Server%20Admin/Documents/GitHub/UNEFA_DASHBOARD/AGENTS.md#adding-a-new-feature-step-by-step)

### Actualizar Dependencias

\`\`\`bash
# Verificar outdated
npm outdated

# Actualizar package.json
npm update

# Para major versions (cuidado!)
npm install react@latest
\`\`\`

### Debugging

#### Frontend
1. React DevTools
2. Console logs con prefijos: \`[HookName] Action:\`
3. Network tab para API calls

#### Backend
1. Logs en consola con contexto
2. Postman para testing de endpoints
3. Supabase Dashboard para queries directas

### Convenciones de Código

**TSDoc** obligatorio en funciones públicas:
\`\`\`typescript
/**
 * Fetches all active periods from the database
 * @returns Promise with array of Period objects
 * @throws {Error} If network request fails
 */
export const fetchActivePeriods = async (): Promise<Period[]> => {
  // ...
};
\`\`\`

**Error Handling** estandarizado:
\`\`\`typescript
try {
  // action
} catch (error: any) {
  const message = error.response?.data?.message || 'Error default';
  toast.error(message);
  console.error('[Context:Action]', error);
  throw error; // re-throw si necesario
}
\`\`\`

---

## 📚 Referencias

- [README.md](file:///c:/Users/Server%20Admin/Documents/GitHub/UNEFA_DASHBOARD/README.md) - Introducción y quick start
- [AGENTS.md](file:///c:/Users/Server%20Admin/Documents/GitHub/UNEFA_DASHBOARD/AGENTS.md) - Guía completa para desarrolladores
- [Análisis Arquitectónico](file:///C:/Users/Server%20Admin/.gemini/antigravity/brain/dfdf19b2-b679-41e5-8b88-5807eeb8b79c/analisis_arquitectonico.md) - Análisis profundo del sistema

---

**Versión**: 2.0.2  
**Última actualización**: 2026-02-15
