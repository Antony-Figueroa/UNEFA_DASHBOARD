# Guía de Interfaz: Dashboard Tutor

## 1. Descripción General

El **Dashboard Tutor** es la pantalla principal que ven los usuarios con rol de **Tutor Académico** tras iniciar sesión. Proporciona un resumen de sus estudiantes asignados, pasantías activas y actividades pendientes.

### Propósito

- Mostrar estadísticas de estudiantes asignados al tutor
- Visualizar estado de pasantías (activas, pendientes, completadas)
- Proporcionar acceso rápido a funciones frecuentes
- Mostrar información sobre capacidades del tutor

### Ruta

```
/tutor/dashboard
```

### Roles que Acceden

| Rol | Acceso |
|-----|--------|
| Administrador (role: 1) | ❌ No |
| Asistente (role: 2) | ❌ No |
| Tutor (role: 3) | ✅ Sí |
| Estudiante (role: 4) | ❌ No (usa `/student/dashboard`) |

---

## 2. Estructura Visual

### Layout del Dashboard Tutor

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  [SIDEBAR]                              [HEADER: Usuario + Notificaciones]     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  PANEL DE TUTOR                                                                │
│  Resumen de sus estudiantes asignados y actividades de seguimiento             │
│                                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌─────────┐ │
│  │ 👥 Total         │  │ 💼 Pasantías    │  │ 📝 Notas        │  │ 🏆      │ │
│  │    Estudiantes   │  │    Activas       │  │    Pendientes   │  │ Completadas│ │
│  │       12        │  │       8          │  │       3         │  │    4      │ │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  └─────────┘ │
│                                                                                 │
│  ┌─────────────────────────────────────┐  ┌─────────────────────────────────┐  │
│  │  ACCIONES RÁPIDAS                  │  │  INFORMACIÓN                    │  │
│  │                                    │  │                                 │  │
│  │  [👥] Ver Estudiantes             │  │  Como tutor académico,          │  │
│  │  [📝] Cargar Notas                │  │  usted puede:                  │  │
│  │  [💼] Seguimiento                 │  │                                 │  │
│  │  [📊] Reportes                   │  │  ✓ Ver y gestionar estudiantes  │  │
│  │                                    │  │  ✓ Registrar seguimiento        │  │
│  │                                    │  │  ✓ Cargar notas finales        │  │
│  │                                    │  │  ✓ Generar reportes            │  │
│  └─────────────────────────────────────┘  └─────────────────────────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Componentes del Dashboard

### 3.1 Header

```
PANEL DE TUTOR
Resumen de sus estudiantes asignados y actividades de seguimiento
```

- **Título**: "Panel de Tutor"
- **Descripción**: Subtítulo explicativo

---

### 3.2 StatCards (Tarjetas de Estadísticas)

#### Tarjetas Mostradas

| Tarjeta | Icono | Color | Descripción |
|---------|-------|-------|-------------|
| Total Estudiantes | Users | Azul | Total de estudiantes asignados |
| Pasantías Activas | Briefcase | Verde | Estudiantes con pasantía en curso |
| Notas Pendientes | ClipboardCheck | Naranja | Pasantías activas sin nota cargada |
| Completadas | Award | Púrpura | Pasantías finalizadas |

#### Datos del Backend

```typescript
interface TutorDashboardStats {
  totalStudents: number;      // Total asignaciones
  activeInternships: number;   // Status = 2 (en curso) y Status = 1
  pendingGrades: number;       // En curso pero sin nota (GRADE = 0 o null)
  completedInternships: number;// Status = 3 (completada)
}
```

#### UI de Tarjeta

```
┌────────────────────────────────────┐
│ ┌────┐                            │
│ │ 👥 │  Total Estudiantes         │
│ └────┘                            │
│                                    │
│              12                    │
└────────────────────────────────────┘
```

---

### 3.3 Acciones Rápidas

Sección con enlaces directos a las funciones más frecuentes del tutor.

#### Acciones Disponibles

| Acción | Icono | Ruta | Descripción |
|--------|-------|------|-------------|
| Ver Estudiantes | Users | `/tutor/students` | Lista de estudiantes asignados |
| Cargar Notas | ClipboardCheck | `/tutor/grades` | Registro de calificaciones |
| Seguimiento | Briefcase | `/tutor/tracking` | Bitácoras de visitas |
| Reportes | Award | `/tutor/reports` | Generación de informes |

#### UI

```
┌─────────────────────────────────────┐
│  ACCIONES RÁPIDAS                  │
│                                     │
│  ┌─────────────────────────────┐  │
│  │ 👥  Ver Estudiantes         │  │
│  └─────────────────────────────┘  │
│  ┌─────────────────────────────┐  │
│  │ 📝  Cargar Notas           │  │
│  └─────────────────────────────┘  │
│  ┌─────────────────────────────┐  │
│  │ 💼  Seguimiento             │  │
│  └─────────────────────────────┘  │
│  ┌─────────────────────────────┐  │
│  │ 📊  Reportes               │  │
│  └─────────────────────────────┘  │
└─────────────────────────────────────┘
```

---

### 3.4 Información

Sección educativa que muestra las capacidades del rol de tutor.

#### Capacidades del Tutor

```
┌─────────────────────────────────────┐
│  INFORMACIÓN                        │
│                                     │
│  Como tutor académico,              │
│  usted puede:                      │
│                                     │
│  ✓ Ver y gestionar estudiantes     │
│    asignados                       │
│  ✓ Registrar seguimiento de        │
│    pasantías                       │
│  ✓ Cargar notas finales de los     │
│    estudiantes                      │
│  ✓ Generar reportes de sus         │
│    estudiantes                      │
└─────────────────────────────────────┘
```

---

## 4. Obtención de Datos

### 4.1 Hook

El componente usa estado local en lugar de un hook especializado:

```typescript
const [stats, setStats] = useState<TutorDashboardStats | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await tutorService.getDashboard();
      setStats(data);
    } catch (err) {
      setError("Error al cargar estadísticas");
    } finally {
      setLoading(false);
    }
  };

  fetchStats();
}, []);
```

---

### 4.2 Servicio

```typescript
// src/features/tutor/services/tutorService.ts
getDashboard: async (): Promise<TutorDashboardStats> => {
  const response = await apiClient.get(`${API_URL}/dashboard`);
  return response.data.data;
}
```

---

### 4.3 Endpoint

```
GET /api/tutor/dashboard
```

**Headers:**
```typescript
{
  "Cookie": "auth_token=..."
}
```

---

### 4.4 Consultas del Backend

El controlador realiza las siguientes operaciones:

#### Paso 1: Obtener ID del Tutor

```typescript
// Buscar tutor por USER_ID del token JWT
const { data: tutorData } = await supabase
  .from('t_tutors')
  .select('TUTOR_ID')
  .eq('USER_ID', userId)
  .single();
```

#### Paso 2: Obtener Prácticas del Tutor

```typescript
const { data: practices } = await supabase
  .from('t_professional_practices_tutor')
  .select(`
    PROFESSIONAL_PRACTICE_ID,
    TUTOR_TYPE,
    t_professional_practices!inner (
      PROFESSIONAL_PRACTICE_ID,
      PRACTICES_STATUS,
      GRADE,
      STATUS
    )
  `)
  .eq('TUTOR_ID', tutorId);
```

#### Paso 3: Calcular Estadísticas

```typescript
const stats = {
  totalStudents: practices?.length || 0,
  
  activeInternships: practices?.filter((p: any) => 
    p.t_professional_practices?.PRACTICES_STATUS === 2 &&  // En curso
    p.t_professional_practices?.STATUS === 1                // Activo
  ).length || 0,
  
  pendingGrades: practices?.filter((p: any) => 
    p.t_professional_practices?.PRACTICES_STATUS === 2 &&  // En curso
    (!p.t_professional_practices?.GRADE ||                 // Sin nota
     p.t_professional_practices?.GRADE === 0)
  ).length || 0,
  
  completedInternships: practices?.filter((p: any) => 
    p.t_professional_practices?.PRACTICES_STATUS === 3    // Completada
  ).length || 0
};
```

---

### 4.5 Estados del Backend

| Status | Significado |
|--------|-------------|
| 1 | Activo |
| 2 | En Curso |
| 3 | Completado |
| 4 | Suspendido |

---

## 5. Respuesta del Endpoint

### Éxito

```typescript
{
  "success": true,
  "data": {
    "totalStudents": 12,
    "activeInternships": 8,
    "pendingGrades": 3,
    "completedInternships": 4
  }
}
```

### Error

```typescript
{
  "success": false,
  "message": "Tutor no encontrado para este usuario"
}
```

---

## 6. Manejo de Estados

### 6.1 Estados del Componente

| Estado | Descripción |
|--------|-------------|
| `loading` | true mientras carga datos |
| `error` | Mensaje de error si falla |
| `stats` | Datos del dashboard o null |

### 6.2 UI según Estado

#### Loading

```
┌────────────────────────────────────┐
│ ┌────┐                            │
│ │ 👥 │  Total Estudiantes         │
│ └────┘                            │
│                                    │
│     ████████████                   │
└────────────────────────────────────┘
```

#### Error

```
┌────────────────────────────────────┐
│ Error al cargar estadísticas       │
└────────────────────────────────────┘
```

---

## 7. Navegación

### 7.1 Flujo desde Login

```
/signin (Login)
    │
    ├─── Success + Role = 3 (Tutor)
    │         │
    │         ▼
    │    /tutor/dashboard ◄── Dashboard Tutor
    │
    └─── Other roles → Different dashboards
```

### 7.2 Rutas del Módulo Tutor

| Ruta | Componente | Descripción |
|------|------------|-------------|
| `/tutor/dashboard` | TutorDashboard | Panel principal |
| `/tutor/students` | TutorStudents | Lista de estudiantes |
| `/tutor/grades` | TutorGrades | Cargar/administrar notas |
| `/tutor/tracking` | TutorTracking | Seguimiento de visitas |
| `/tutor/reports` | TutorReports | Reportes y estadísticas |
| `/tutor/profile` | TutorProfile | Perfil del tutor |

---

## 8. Comparación: Admin vs Tutor

### Dashboard Admin

- **Datos**: Globales de todo el sistema
- **Gráficos**: registrationStats, careerDistribution, growth
- **Filtros**: Período, carrera, institución
- **Acciones**: Gestión completa (CRUD)

### Dashboard Tutor

- **Datos**: Solo estudiantes asignados
- **Gráficos**: Ninguno (solo estadísticas)
- **Filtros**: Por status, búsqueda
- **Acciones**: Seguimiento, evaluación, reportes

---

## 9. Archivos Relacionados

### Frontend

| Archivo | Descripción |
|---------|-------------|
| `src/pages/Tutor/TutorDashboard.tsx` | Componente principal |
| `src/features/tutor/services/tutorService.ts` | Servicio API |
| `src/features/tutor/types/index.ts` | Tipos TypeScript |

### Backend

| Archivo | Descripción |
|---------|-------------|
| `backend/src/routes/tutor-dashboard.routes.ts` | Definición de rutas |
| `backend/src/controllers/tutor-dashboard.controller.ts` | Controlador |
| `backend/src/middlewares/auth.middleware.ts` | Middleware de autenticación |

---

## 10. Casos Edge

| Caso | Comportamiento |
|------|----------------|
| Tutor sin estudiantes | Muestra 0 en todas las tarjetas |
| Tutor no encontrado | Error 404 del backend |
| Error de conexión | Muestra mensaje de error |
| Sin prácticas activas | Muestra 0 en activas |
| Todas las notas cargadas | Muestra 0 en pendientes |

---

## 11. Próximos Pasos del Flujo

Desde el Dashboard Tutor, el usuario puede navegar a:

| Módulo | Ruta | Descripción |
|--------|------|-------------|
| Estudiantes | `/tutor/students` | Ver lista de estudiantes asignados |
| Notas | `/tutor/grades` | Cargar/administrar calificaciones |
| Seguimiento | `/tutor/tracking` | Registrar visitas y bitácoras |
| Reportes | `/tutor/reports` | Generar informes de estudiantes |
