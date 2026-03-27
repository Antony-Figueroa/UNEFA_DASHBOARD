# Guía de Interfaz: Dashboard Estudiante

## 1. Descripción General

El **Dashboard Estudiante** es la pantalla principal que ven los usuarios con rol de **Estudiante** tras iniciar sesión. Proporciona una visión personalizada de su estado de práctica profesional, progreso de horas, solicitudes pendientes y accesos rápidos a sus funcionalidades.

### Propósito

- Mostrar información personal del estudiante
- Visualizar estado de la pasantía (activa, completada, etc.)
- Mostrar progreso de horas requeridas
- Gestionar bitácoras de actividades
- Acceder a solicitudes, documentos y perfil

### Ruta

```
/student/dashboard
```

### Roles que Acceden

| Rol | Acceso |
|-----|--------|
| Administrador (role: 1) | ❌ No |
| Asistente (role: 2) | ❌ No |
| Tutor (role: 3) | ❌ No |
| Estudiante (role: 4) | ✅ Sí |

---

## 2. Estructura Visual

### Layout del Dashboard Estudiante

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  [SIDEBAR]                              [HEADER: Usuario + Notificaciones]     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  BIENVENIDO, [Nombre del Estudiante]!                                        │
│  Consulta tu información de pasantía y gestiona tus registros                │
│                                                                                 │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐              │
│  │ 👤 Cédula  │ │ 💼 Pasantía│ │ 📝 Solicit.│ │ ⏱️ Horas  │              │
│  │ V12345678  │ │   Activa   │ │  2 pendient│ │   80/120h │              │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘              │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │  PROGRESO DE HORAS                                                  │     │
│  │                                                                       │     │
│  │    80 horas                    67% completado                       │     │
│  │    de 120 horas requeridas                                            │     │
│  │    [███████████████████████████████░░░░░░░░░░░░░]                  │     │
│  │                                                                       │     │
│  │    Registros: 15   |   Aprobados: 12   |   Pendientes: 3           │     │
│  └─────────────────────────────────────────────────────────────────────┘     │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │  MI PASANTÍA                                                       │     │
│  │                                                                       │     │
│  │  Estado:    [✅ Activo]         Carrera:    Ingeniería Sistemas   │     │
│  │  Tipo:      Práctica I           Período:    1-2026              │     │
│  │  Empresa:   Empresa XYZ           Tutor:      Juan Pérez          │     │
│  │  Inicio:    15/01/2026          Nota:       14.5               │     │
│  └─────────────────────────────────────────────────────────────────────┘     │
│                                                                                 │
│  ┌─────────────────────────────┐ ┌─────────────────────────────────────┐    │
│  │  REGISTROS RECIENTES        │ │  ACCIONES RÁPIDAS                 │    │
│  │                             │ │                                     │    │
│  │  [✓] Descripción...        │ │  📝 Nueva Solicitud               │    │
│  │      20/03 - 4h - Semanal  │ │  👤 Mi Perfil                     │    │
│  │                             │ │  📅 Bitácora                     │    │
│  │  [✓] Descripción...        │ │  📄 Documentos                   │    │
│  │      15/03 - 4h - Semanal  │ │                                     │    │
│  │                             │ │                                     │    │
│  │  [⏳] Descripción...       │ │                                     │    │
│  │      10/03 - 4h - Semanal  │ │                                     │    │
│  └─────────────────────────────┘ └─────────────────────────────────────┘    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Componentes del Dashboard

### 3.1 Header

```
BIENVENIDO, [Nombre del Estudiante]!
Consulta tu información de pasantía y gestiona tus registros
```

- **Saludo personalizado**: "Bienvenido, {nombre}"
- **Descripción**: Subtítulo explicativo

---

### 3.2 QuickStats (Tarjetas de Información)

#### Tarjetas Mostradas

| Tarjeta | Icono | Color | Descripción |
|---------|-------|-------|-------------|
| Cédula | User | Azul | Número de cédula del estudiante |
| Pasantía | Briefcase | Verde | "Activa" o "Sin pasantía" |
| Solicitudes | FileText | Naranja | Cantidad de solicitudes pendientes |
| Horas | Clock | Púrpura | Horas completadas / requeridas |

---

### 3.3 Progreso de Horas

#### Componente Condicional

Solo se muestra si el estudiante tiene una pasantía activa (`data.internship`).

#### UI

```
┌─────────────────────────────────────────────┐
│  PROGRESO DE HORAS                          │
│                                             │
│  80 horas                  67% completado   │
│  de 120 horas requeridas                    │
│                                             │
│  [████████████████████████████████░░░░░░░░] │
│                                             │
│  Registros: 15  |  Aprobados: 12  |  Pendientes: 3 │
└─────────────────────────────────────────────┘
```

#### Lógica de Colores

| Porcentaje | Color de Barra |
|------------|----------------|
| >= 100% | Verde (success) |
| >= 50% y < 100% | Naranja (warning) |
| < 50% | Rojo (error) |

#### Datos

```typescript
hoursProgress: {
  completed: number;    // Horas completadas
  required: number;    // Horas requeridas (default: 120)
  percentage: number;  // Porcentaje = (completed / required) * 100
}
```

---

### 3.4 Mi Pasantía

#### Estado: Con Pasantía

Muestra información detallada de la pasantía:

```
┌─────────────────────────────────────────────┐
│  MI PASANTÍA                              │
│                                             │
│  Estado:      [✅ Activo]                   │
│  Carrera:     Ingeniería Sistemas           │
│  Tipo:        Práctica I                   │
│  Período:     1-2026                       │
│                                             │
│  Empresa:     Empresa XYZ                   │
│  Tutor:       Juan Pérez                    │
│  Inicio:      15/01/2026                    │
│  Nota:        14.5                          │
└─────────────────────────────────────────────┘
```

#### Campos Mostrados

| Campo | Fuente | Notas |
|-------|--------|-------|
| Estado | `status` | Badge con color según estado |
| Carrera | `careerName` | De la tabla de carreras |
| Tipo de Práctica | `practiceType` | Tipo de práctica profesional |
| Período | `period` | Período académico |
| Empresa | `institutionName` | Institution receptora |
| Tutor Académico | `tutorName` | "Sin asignar" si null |
| Fecha de Inicio | `startDate` | "Por definir" si null |
| Nota Final | `grade` | "Sin calificar" si = 0 |

#### Estados Posibles

| Status | Badge Color | Label |
|--------|-------------|-------|
| `active` | success | Activo |
| `completed` | info | Completado |
| `pre-enrolled` | warning | Pre-inscrito |
| `suspended` | error | Suspendido |

#### Estado: Sin Pasantía

```
┌─────────────────────────────────────────────┐
│  MI PASANTÍA                              │
│                                             │
│           [Icono maleta]                   │
│                                             │
│  No tienes una pasantía activa registrada  │
│  Contacta a coordinación para más información│
└─────────────────────────────────────────────┘
```

---

### 3.5 Registros Recientes

Muestra los últimos registros de bitácora del estudiante.

#### UI

```
┌─────────────────────────────────────────────┐
│  REGISTROS RECIENTES           [+ Nuevo]  │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ ✓ Descripción de la actividad...      │ │
│  │   20/03 - 4h - Semanal   [Aprobado]  │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ ✓ Descripción de la actividad...      │ │
│  │   15/03 - 4h - Semanal   [Aprobado]  │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ ⏳ Descripción de la actividad...     │ │
│  │   10/03 - 4h - Semanal   [Pendiente]│ │
│  └───────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

#### Datos

```typescript
activityLogs: {
  totalLogs: number;      // Total de registros
  approvedLogs: number;   // Aprobados
  pendingLogs: number;   // Pendientes de aprobación
  recentLogs: [
    {
      id: number;
      date: string;
      hours: number;
      description: string;
      type: string;
      approved: boolean;
    }
  ];
}
```

#### Badge según Estado

| approved | Badge |
|----------|-------|
| true | Verde "Aprobado" |
| false | Naranja "Pendiente" |

---

### 3.6 Acciones Rápidas

Enlaces directos a las funcionalidades del estudiante.

#### Acciones Disponibles

| Acción | Icono | Ruta | Descripción |
|--------|-------|------|-------------|
| Nueva Solicitud | FileText | `/student/requests` | Enviar solicitudes a coordinación |
| Mi Perfil | User | `/student/profile` | Ver y editar datos personales |
| Bitácora | Calendar | `/student/activity-logs/{id}` | Registrar actividades semanales |
| Documentos | FileUp | `/student/documents` | Subir cartas e informes |

#### UI

```
┌─────────────────────────────────────────────┐
│  ACCIONES RÁPIDAS                          │
│                                             │
│  ┌─────────────────────────────┐ ┌──────┐│
│  │ 📝 Nueva Solicitud           │ │ 👤   ││
│  │    Envía solicitudes...      │ │ Mi   ││
│  └─────────────────────────────┘ │ Perfil││
│  ┌─────────────────────────────┐ └──────┘│
│  │ 📅 Bitácora                 │         │
│  │    Actividades semanales    │         │
│  └─────────────────────────────┘         │
│  ┌─────────────────────────────┐         │
│  │ 📄 Documentos                │         │
│  │    Subir cartas...          │         │
│  └─────────────────────────────┘         │
└─────────────────────────────────────────────┘
```

---

## 4. Obtención de Datos

### 4.1 Hook

El componente usa estado local:

```typescript
const [data, setData] = useState<DashboardData | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  fetchDashboard();
}, []);

const fetchDashboard = async () => {
  const result = await studentService.getDashboard();
  setData(result);
};
```

---

### 4.2 Servicio

```typescript
// src/features/student/services/studentService.ts
getDashboard: async (): Promise<DashboardData> => {
  const response = await apiClient.get('/student/dashboard');
  return response.data;
}
```

---

### 4.3 Endpoint

```
GET /api/student/dashboard
```

**Headers:**
```typescript
{
  "Cookie": "auth_token=..."
}
```

---

### 4.4 Tipos de Datos

```typescript
interface DashboardData {
  student: {
    id: number;
    ci: string;
    name: string;
    surname: string;
    email: string;
    phone: string;
  };
  
  internship: StudentInternship | null;
  
  activityLogs: ActivityLogSummary;
  
  stats: DashboardStats;
}

interface StudentInternship {
  enrollmentId: string;
  studentCi: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  careerName: string;
  institutionName: string;
  institutionAddress: string;
  institutionPhone: string;
  period: string;
  practiceType: string;
  enrollmentDate: string;
  startDate: string;
  endDate: string;
  status: string;
  grade: number;
  totalHours: number;
  requiredHours: number;
  tutorName: string;
  tutorPhone: string;
  tutorEmail: string;
  professionalPracticeId: number | null;
}

interface ActivityLogSummary {
  totalHours: number;
  totalLogs: number;
  approvedLogs: number;
  pendingLogs: number;
  recentLogs: Array<{
    id: number;
    date: string;
    hours: number;
    description: string;
    type: string;
    approved: boolean;
  }>;
}

interface DashboardStats {
  hasActiveInternship: boolean;
  pendingRequests: number;
  hoursProgress: {
    completed: number;
    required: number;
    percentage: number;
  };
}
```

---

## 5. Manejo de Estados

### 5.1 Estados del Componente

| Estado | Descripción |
|--------|-------------|
| `loading` | Muestra skeletons mientras carga |
| `error` | Muestra mensaje de error |
| `data` | Muestra el dashboard completo |

### 5.2 UI según Estado

#### Loading

```
┌─────────────────────────────────────────────┐
│  ████████████████████████████████████████   │  (skeleton)
│  ████████████████████████████████████████   │
│  ████████████████████████████████████████   │
│  ████████████████████████████████████████   │
└─────────────────────────────────────────────┘
```

#### Error

```
┌─────────────────────────────────────────────┐
│  Error al cargar datos                     │
└─────────────────────────────────────────────┘
```

---

## 6. Formateo de Fechas

```typescript
const formatDate = (dateStr: string) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "short"
  });
};
```

**Ejemplo:** `2026-03-15` → `15/mar`

---

## 7. Navegación

### 7.1 Flujo desde Login

```
/signin (Login)
    │
    ├─── Success + Role = 4 (Estudiante)
    │         │
    │         ▼
    │    /student/dashboard ◄── Dashboard Estudiante
    │
    └─── Other roles → Different dashboards
```

### 7.2 Rutas del Módulo Estudiante

| Ruta | Componente | Descripción |
|------|------------|-------------|
| `/student/dashboard` | StudentDashboard | Panel principal |
| `/student/profile` | StudentProfile | Datos personales |
| `/student/requests` | StudentRequests | Mis solicitudes |
| `/student/activity-logs/:id` | ActivityLogs | Bitácora de actividades |
| `/student/documents` | StudentDocuments | Mis documentos |
| `/student/evaluations` | StudentEvaluations | Mis evaluaciones |

---

## 8. Comparación: Admin vs Tutor vs Estudiante

| Característica | Admin | Tutor | Estudiante |
|----------------|-------|-------|------------|
| **Datos** | Globales | Asignados | Propios |
| **Gráficos** | Sí | No | No |
| **Estadísticas** | Generales | Del grupo | Personales |
| **Acciones** | CRUD total | Seguimiento | Solicitudes |
| **Progreso** | No | No | Sí (horas) |

---

## 9. Archivos Relacionados

### Frontend

| Archivo | Descripción |
|---------|-------------|
| `src/pages/Student/StudentDashboard.tsx` | Componente principal |
| `src/features/student/services/studentService.ts` | Servicio API |
| `src/features/student/types/index.ts` | Tipos TypeScript |

### Backend

| Archivo | Descripción |
|---------|-------------|
| `backend/src/routes/student-dashboard.routes.ts` | Definición de rutas |
| `backend/src/controllers/student-dashboard.controller.ts` | Controlador |

---

## 10. Casos Edge

| Caso | Comportamiento |
|------|----------------|
| Estudiante sin pasantía | Muestra "Sin pasantía", oculta progreso |
| Sin registros de bitácora | Muestra mensaje "No hay registros" |
| Sin solicitudes pendientes | Muestra "0 pendientes" |
| Nota sin cargar | Muestra "Sin calificar" |
| Tutor no asignado | Muestra "Sin asignar" |
| Error de carga | Muestra mensaje de error |

---

## 11. Próximos Pasos del Flujo

Desde el Dashboard Estudiante, el usuario puede navegar a:

| Módulo | Ruta | Descripción |
|--------|------|-------------|
| Solicitudes | `/student/requests` | Crear y ver solicitudes |
| Perfil | `/student/profile` | Ver/editar datos personales |
| Bitácora | `/student/activity-logs/{id}` | Registrar actividades |
| Documentos | `/student/documents` | Subir documentos |
| Evaluaciones | `/student/evaluations` | Ver calificaciones |
