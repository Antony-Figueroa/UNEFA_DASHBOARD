# Guía de Interfaz: Dashboard Admin

## 1. Descripción General

El **Dashboard Admin** es la pantalla principal que ven los usuarios con rol de **Administrador** y **Asistente** tras iniciar sesión. Proporciona una visión general del sistema con métricas clave, gráficos interactivos y distribución de datos.

### Propósito

- Mostrar estadísticas en tiempo real del sistema
- Visualizar tendencias de inscripciones y crecimiento
- Distribución de estudiantes por carrera
- Información del período académico activo

### Ruta

```
/dashboard
```

### Roles que Acceden

| Rol | Acceso |
|-----|--------|
| Administrador (role: 1) | ✅ Sí |
| Asistente (role: 2) | ✅ Sí |
| Tutor (role: 3) | ❌ No (usa `/tutor/dashboard`) |
| Estudiante (role: 4) | ❌ No (usa `/student/dashboard`) |

---

## 2. Estructura Visual

### Layout del Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  [SIDEBAR]                              [HEADER: Usuario + Notificaciones]     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  BIENVENIDO, [Usuario]!                                              │   │
│  │  Fecha y hora actual                                                 │   │
│  │  [Botón: Nueva Pre-inscripción]                                      │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐            │
│  │ 📅 Período      │  │ 👥 Estudiantes   │  │ 🏢 Instituciones │            │
│  │   en curso      │  │   activos        │  │   activas        │            │
│  │   1-2026       │  │      245         │  │       28         │            │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘            │
│                                                                                 │
│  ┌─────────────────────────────────────────────┐ ┌────────────────────────┐  │
│  │                                             │ │  METRICAS DE CRECIMIENTO│  │
│  │     ESTADÍSTICAS DE REGISTRO                │ │                        │  │
│  │     [7d] [30d] [Todo]                      │ │  Este mes: 45          │  │
│  │                                             │ │  Mes anterior: 38      │  │
│  │    📈 Área/Curva de registros              │ │  Cambio: +18%  ↑       │  │
│  │                                             │ │                        │  │
│  │                                             │ │  [Barras semanales]    │  │
│  └─────────────────────────────────────────────┘ └────────────────────────┘  │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  DISTRIBUCIÓN POR CARRERA                                            │   │
│  │  [Vista Cards] [Vista Donut] [Vista Barras]                          │   │
│  │                                                                       │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │   │
│  │  │ Ing.     │ │ Medicina │ │ Derecho  │ │ Admin.   │               │   │
│  │  │ Sistemas  │ │          │ │          │ │ Empresas  │               │   │
│  │  │  35%     │ │   25%    │ │   20%    │ │   20%    │               │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘               │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Componentes del Dashboard

### 3.1 WelcomeBanner

El banner de bienvenida muestra un saludo personalizado basado en la hora del día.

#### Características

- **Saludo dinámico**: Buenos días / Buenas tardes / Buenas noches
- **Nombre del usuario**: Desde el contexto de autenticación
- **Fecha y hora**: Actualizable en tiempo real
- **Efectos visuales**: Partículas animadas de fondo

#### Código

```typescript
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "¡Buenos días!";
  if (hour >= 12 && hour < 19) return "¡Buenas tardes!";
  return "¡Buenas noches!";
};
```

---

### 3.2 HomeQuickStats

Tarjetas de estadísticas rápidas con contadores animados.

#### Tarjetas Mostradas

| Tarjeta | Icono | Color | Valor |
|---------|-------|-------|-------|
| Período en curso | Calendario | Azul (brand) | Descripción del período |
| Estudiantes activos | Usuarios | Verde | Número de estudiantes con STATUS=1 |
| Instituciones activas | Edificio | Amarillo | Número de instituciones con STATUS=1 |

#### Animación

- Contador animado (0 → valor final)
- Efecto hover con elevación
- Barra de progreso inferior animada

---

### 3.3 RegistrationStatsChart

Gráfico de área que muestra las inscripciones a lo largo del tiempo.

#### Características

- **Tipo**: Área (area chart)
- **Filtros**: 7 días, 30 días, Todo
- **Eje X**: Fechas
- **Eje Y**: Cantidad de registros

#### Opciones del Gráfico

```typescript
{
  chart: {
    type: 'area',
    height: 350,
    toolbar: { show: false },
    zoom: { enabled: false }
  },
  stroke: {
    curve: 'smooth',
    width: 3,
    colors: ['#054F94']  // Color brand
  },
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.4,
      opacityTo: 0.05
    }
  }
}
```

---

### 3.4 GrowthMetrics

Muestra métricas de crecimiento mensual.

#### Información Mostrada

| Métrica | Descripción |
|---------|-------------|
| Total mes actual | Inscripciones del mes en curso |
| Total mes anterior | Inscripciones del mes pasado |
| Cambio porcentual | Diferencia entre meses |
| Tendencia | Indicador visual (↑ arriba, ↓ abajo, → neutral) |
| Desglose semanal | 4 barras representando semanas |
| Desglose diario | Datos del día |

#### Cálculo del Porcentaje

```typescript
const percentageChange = prevMonthCount 
  ? ((lastMonthCount - prevMonthCount) / prevMonthCount) * 100 
  : 0;
```

---

### 3.5 CareerDistributionChart

Muestra la distribución de estudiantes por carrera.

#### Vistas Disponibles

1. **Cards** (predeterminada): Tarjetas con porcentaje y barra de progreso
2. **Donut**: Gráfico circular
3. **Barras**: Gráfico de barras horizontal

#### Persistencia

La preferencia de vista se guarda en `localStorage`:

```typescript
const STORAGE_KEY = 'dashboard-career-view-preference';
```

#### Colores Institucionales

```typescript
const careerColors = [
  '#054F94', // Azul UNEFA principal
  '#C5A059', // Dorado insignias
  '#065A99', // Azul oscuro
  '#D4AF37', // Oro brillante
  // ...
];
```

#### Datos Mostrados

| Campo | Descripción |
|-------|-------------|
| careerName | Nombre de la carrera |
| studentCount | Cantidad de estudiantes |
| percentage | Porcentaje del total |

---

## 4. Obtención de Datos

### 4.1 Hook: useDashboardStats

```typescript
const { stats, loading, error, refresh } = useDashboardStats();
```

#### Características

- **Carga inicial**: Automática al montar el componente
- **Polling**: Actualiza cada 30 segundos en segundo plano
- **Refresh manual**: Función disponible para forzar actualización

```typescript
useEffect(() => {
  fetchStats();
  
  const interval = setInterval(() => {
    fetchStats(true); // silent = true
  }, 30000);
  
  return () => clearInterval(interval);
}, [fetchStats]);
```

---

### 4.2 Endpoint

```
GET /api/dashboard/stats
```

### 4.3 Tipos de Datos (DashboardStats)

```typescript
interface DashboardStats {
  // Básicos
  totalStudents: number;
  activeStudents: number;
  totalInstitutions: number;
  activeInstitutions: number;
  
  // Período
  currentPeriod: {
    description: string;
    startDate: string;
    endDate: string;
  } | null;
  
  // Inscripciones
  totalEnrollments: number;
  totalPreEnrollments: number;
  activePeriods: number;
  pendingRequests: number;
  completionRate: number;
  
  // Gráficos
  registrationStats: Array<{
    date: string;
    count: number;
  }>;
  
  monthlyGrowth: {
    totalLastMonth: number;
    totalPrevMonth: number;
    percentageChange: number;
    trend: 'up' | 'down' | 'neutral';
    weeklyBreakdown: Array<{ label: string; count: number }>;
    dailyBreakdown: Array<{ label: string; count: number }>;
  };
  
  careerDistribution: Array<{
    careerName: string;
    studentCount: number;
    percentage: number;
  }>;
  
  monthlyEnrollments: Array<{
    month: string;
    count: number;
  }>;
  
  monthlyTarget: {
    target: number;
    current: number;
    today: number;
    percentage: number;
  };
}
```

---

### 4.4 Consultas del Backend

El controlador realiza las siguientes consultas a Supabase:

#### Estudiantes

```typescript
// Total estudiantes
supabase.from('t_students').select('*', { count: 'exact', head: true })

// Estudiantes activos
supabase.from('t_students').select('*', { count: 'exact', head: true }).eq('STATUS', 1)
```

#### Instituciones

```typescript
// Total instituciones
supabase.from('t_institution').select('*', { count: 'exact', head: true })

// Instituciones activas
supabase.from('t_institution').select('*', { count: 'exact', head: true }).eq('STATUS', 1)
```

#### Período Activo

```typescript
// Período con status "en curso" (PERIOD_STATUS = 2)
supabase.from('t_internships_period')
  .select('*')
  .eq('PERIOD_STATUS', '2')
  .eq('STATUS', 1)
  .order('START_DATE', { ascending: false })
  .limit(1)
  .single()
```

#### Distribución por Carrera

```typescript
supabase.from('t_students')
  .select('CAREER_ID, t_career(CAREER_NAME)')
  .eq('STATUS', 1)
```

#### Registro de Inscripciones (últimos 30 días)

```typescript
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

supabase.from('t_students')
  .select('REGISTRATION_DATE')
  .gte('REGISTRATION_DATE', thirtyDaysAgo.toISOString())
  .order('REGISTRATION_DATE', { ascending: true })
```

---

## 5. Manejo de Estados

### 5.1 Estados del Componente

| Estado | Descripción |
|--------|-------------|
| `loading` | true mientras carga datos inicialmente |
| `error` | Mensaje de error si falla la carga |
| `stats` | Datos del dashboard o null |

### 5.2 Manejo de Errores

```typescript
useEffect(() => {
  if (error) {
    addToast({
      variant: "error",
      title: "Error de Conexión",
      message: typeof error === 'string' ? error : "No se pudieron cargar las estadísticas."
    });
  }
}, [error, addToast]);
```

---

## 6. Interactividad

### 6.1 Filtros del Gráfico de Registros

El usuario puede filtrar por período de tiempo:

| Opción | Descripción |
|--------|-------------|
| 7d | Últimos 7 días |
| 30d | Últimos 30 días |
| all | Todo el historial |

```typescript
const filteredData = useMemo(() => {
  if (filter === '7d') return data.slice(-7);
  if (filter === '30d') return data.slice(-30);
  return data;
}, [data, filter]);
```

### 6.2 Cambio de Vista (Carreras)

El usuario puede elegir entre 3 vistas:

1. **Cards** - Vista predeterminada
2. **Donut** - Gráfico circular
3. **Barras** - Gráfico de barras

La preferencia se guarda en localStorage y persiste entre sesiones.

---

## 7. Animaciones

### 7.1 Contadores Animados

Los números tienen animación de conteo desde 0 hasta el valor final:

```typescript
const AnimatedCounter: React.FC<{ value: number; duration?: number }> = ({ 
  value, 
  duration = 1.5 
}) => {
  // Animación con requestAnimationFrame
  // Función de easing: easeOutQuart
};
```

### 7.2 Transiciones

- **Entradas**: Opacidad y translateY con stagger
- **Hover**: Elevación y sombra en tarjetas
- **Barras**: Animación de izquierda a derecha

---

## 8. Archivos Relacionados

### Frontend

| Archivo | Descripción |
|---------|-------------|
| `src/pages/Dashboard/Home.tsx` | Componente principal del dashboard |
| `src/components/common/WelcomeBanner.tsx` | Banner de bienvenida |
| `src/components/common/HomeQuickStats.tsx` | Tarjetas de estadísticas rápidas |
| `src/features/dashboard/components/RegistrationStatsChart.tsx` | Gráfico de registros |
| `src/features/dashboard/components/GrowthMetrics.tsx` | Métricas de crecimiento |
| `src/features/dashboard/components/CareerDistributionChart.tsx` | Distribución por carrera |
| `src/features/dashboard/hooks/useDashboardStats.ts` | Hook de gestión de datos |
| `src/features/dashboard/types/index.ts` | Tipos TypeScript |
| `src/features/dashboard/services/dashboardService.ts` | Servicio API |

### Backend

| Archivo | Descripción |
|---------|-------------|
| `backend/src/routes/dashboard.routes.ts` | Definición de rutas |
| `backend/src/controllers/dashboard.controller.ts` | Controlador con consultas |

---

## 9. Casos Edge

| Caso | Comportamiento |
|------|----------------|
| Sin período activo | Muestra "Sin período activo" |
| Error de conexión | Muestra toast de error, mantiene UI |
| Sin estudiantes | Muestra 0 en contadores |
| Sin datos de registro | Gráfico vacío sin error |
| localStorage no disponible | Usa vista cards por defecto |

---

## 10. Próximos Pasos del Flujo

Desde el Dashboard Admin, el usuario puede navegar a:

| Módulo | Ruta | Descripción |
|--------|------|-------------|
| Pre-inscripción | `/pre-enrollment` | Crear nueva pre-inscripción |
| Estudiantes | `/students` | Gestionar estudiantes |
| Tutores | `/tutors` | Gestionar tutores |
| Instituciones | `/institutions` | Gestionar instituciones |
| Carreras | `/careers` | Gestionar carreras |
| Períodos | `/periods` | Gestionar períodos |
| Informes | `/reports` | Ver informes detallados |
