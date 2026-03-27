# Guía de Interfaz: Solicitudes

## 1. Descripción General

El módulo de **Solicitudes** permite gestionar las solicitudes enviadas por los estudiantes durante su proceso de práctica profesional. Es una bandeja de entrada para que administradores y asistentes atiendan berbagai tipos de peticiones.

### Propósito

- Atender solicitudes de estudiantes
- Gestionar reasignaciones (tutor, empresa, carrera)
- Aprobar o rechazar peticiones
- Registrar respuestas y comentarios

### Ruta

```
/admin/requests
```

### Roles que Acceden

| Rol | Acceso |
|-----|--------|
| Administrador (role: 1) | ✅ Sí |
| Asistente (role: 2) | ✅ Sí |
| Tutor (role: 3) | ❌ No |
| Estudiante (role: 4) | ❌ No |

---

## 2. Estructura Visual

### Layout de la Página

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  [SIDEBAR]                              [HEADER: Usuario + Notificaciones]     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  BANDEJA DE SOLICITUDES                                                      │
│  Gestiona las solicitudes enviadas por los estudiantes                          │
│                                                                                 │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐  │
│  │   TOTAL    │ │PENDIENTES │ │ EN REVISIÓN│ │ APROBADAS │ │ RECHAZADAS │  │
│  │     45     │ │     12     │ │     8      │ │     20    │ │     5      │  │
│  │            │ │   (click)  │ │   (click)  │ │   (click) │ │   (click)  │  │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘ └────────────┘  │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  Solicitudes (25)                                                      │   │
│  │                                                                         │   │
│  │  Estudiante      | Tipo          | Asunto        | Fecha    | Estado  │   │
│  │  ─────────────────────────────────────────────────────────────────────│   │
│  │  Juan García    │ Cambio Tutor   | Solicito...   │ 15/03/26│ [Pend.] │   │
│  │  María López    │ Cambio Empresa | Por motivo...  │ 14/03/26│ [Aprob.]│   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Estados de Solicitud

### 3.1 Estados Posibles

| Status | Label | Color | Descripción |
|--------|-------|-------|-------------|
| pending | Pendiente | Amarillo | Esperando atención |
| in_review | En Revisión | Azul | Being processed |
| approved | Aprobada | Verde | Aceptada |
| rejected | Rechazada | Rojo | Denegada |

### 3.2 Tipos de Solicitud

| Tipo | Descripción |
|------|-------------|
| Cambio de Tutor | Solicitud de cambio de tutor académico |
| Cambio de Empresa | Solicitud de cambio de institución receptora |
| Cambio de Carrera | Solicitud de cambio de carrera |
| Extensión de Tiempo | Solicitud de extensión de deadline |
|其他 | Otras solicitudes |

---

## 4. Componentes del Módulo

### 4.1 Tarjetas de Estadísticas

```
┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│   TOTAL    │ │PENDIENTES │ │ EN REVISIÓN│ │ APROBADAS │ │ RECHAZADAS │
│     45     │ │     12     │ │     8      │ │     20    │ │     5      │
└────────────┘ └────────────┘ └────────────┘ └────────────┘ └────────────┘
```

- **Click** en tarjeta filtra por ese estado
- Color de fondo cambia según estado seleccionado

### 4.2 Tabla de Solicitudes

#### Columnas

| Columna | Descripción |
|---------|-------------|
| Estudiante | Nombre y cédula |
| Tipo | Tipo de solicitud |
| Asunto | Resumen de la petición |
| Fecha | Fecha de creación |
| Estado | Badge con estado actual |
| Acciones | Botón "Atender" |

---

## 5. Modal de Atención

### 5.1 Estructura

```
┌─────────────────────────────────────────────────────┐
│  ATENDER SOLICITUD                                 │
│                                                     │
│  ┌──────────────────┐ ┌──────────────────┐        │
│  │ Estudiante:      │ │ Cédula:           │        │
│  │ Juan García      │ │ V-12.345.678      │        │
│  └──────────────────┘ └──────────────────┘        │
│                                                     │
│  Tipo: Cambio de Tutor                             │
│                                                     │
│  ─────────────────────────────────────────────    │
│                                                     │
│  Asunto: Solicito cambio de tutor                  │
│                                                     │
│  Descripción:                                      │
│  ┌────────────────────────────────────────────┐   │
│  │ El estudiante solicita cambio de tutor...   │   │
│  └────────────────────────────────────────────┘   │
│                                                     │
│  (Si es reasignación: Datos de reasignación)      │
│                                                     │
│  ─────────────────────────────────────────────    │
│                                                     │
│  Estado:                                           │
│  ┌────────────────────────────────────────────┐   │
│  │ Pendiente ▼                                 │   │
│  └────────────────────────────────────────────┘   │
│                                                     │
│  Respuesta al Estudiante:                          │
│  ┌────────────────────────────────────────────┐   │
│  │                                            │   │
│  └────────────────────────────────────────────┘   │
│                                                     │
│  [Cancelar]           [Guardar Cambios]          │
└─────────────────────────────────────────────────────┘
```

### 5.2 Campos

| Campo | Tipo | Required | Descripción |
|-------|------|----------|-------------|
| Estado | select | ✅ Sí | Nuevo estado de la solicitud |
| Nueva Tutor/Empresa/Carrera | select | Condicional | Datos de reasignación |
| Respuesta | textarea | ❌ No | Comentario para el estudiante |

---

## 6. Datos de Reasignación

Cuando la solicitud es de reasignación (Cambio de Tutor, Empresa o Carrera):

### 6.1 Campos Dinámicos

| Tipo de Solicitud | Campo |
|-------------------|-------|
| Cambio de Tutor | Nuevo Tutor |
| Cambio de Empresa | Nueva Empresa |
| Cambio de Carrera | Nueva Carrera |

### 6.2 Opciones

Las opciones se cargan desde:
- Tutores → módulo de Tutores
- Empresas → módulo de Instituciones
- Carreras → módulo de Carreras

---

## 7. Tipos de Datos

### 7.1 AdminRequest

```typescript
interface AdminRequest {
  id: number;
  studentId: number;
  studentCi: string;
  studentName: string;
  studentEmail: string;
  typeId: number;
  typeName: string;
  subject: string;
  description: string;
  status: 'pending' | 'in_review' | 'approved' | 'rejected';
  response: string | null;
  processedByName: string | null;
  createdAt: string;
  processedAt: string | null;
  
  // Para reasignaciones
  isReassignment?: boolean;
  reassignmentData?: {
    newTutorId?: number;
    newInstitutionId?: number;
    newCareerId?: number;
    reason?: string;
  };
}
```

### 7.2 Stats

```typescript
interface RequestStats {
  total: number;
  pending: number;
  in_review: number;
  approved: number;
  rejected: number;
}
```

---

## 8. Obtención de Datos

### 8.1 Hook

```typescript
const {
  requests,
  stats,
  loading,
  fetchRequests,
  updateStatus
} = useAdminRequests();
```

### 8.2 Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/admin/requests` | Obtener solicitudes |
| GET | `/api/admin/requests/stats` | Obtener estadísticas |
| PUT | `/api/admin/requests/:id` | Actualizar estado |

### 8.3 Parámetros

```typescript
// GET /api/admin/requests?status=pending
{
  status?: 'pending' | 'in_review' | 'approved' | 'rejected'
}
```

---

## 9. Acciones

### 9.1 Acciones por Solicitud

| Acción | Descripción |
|--------|-------------|
| Atender | Abrir modal para procesar |
| Cambiar Estado | Actualizar estado |
| Responder | Agregar comentario |

---

## 10. Casos Edge

| Caso | Comportamiento |
|------|----------------|
| Solicitud ya procesada | Permite actualizar estado |
| Reasignación sin opciones | Muestra mensaje de error |
| Estudiante inactivo | Warning pero permite atender |
| Sin descripción | Muestra campo vacío |

---

## 11. Módulos Relacionados

| Módulo | Relación |
|--------|----------|
| Estudiantes | Datos del solicitante |
| Tutores | Opciones de reasignación |
| Instituciones | Opciones de reasignación |
| Carreras | Opciones de reasignación |

---

## 12. Archivos Relacionados

### Frontend

| Archivo | Descripción |
|---------|-------------|
| `src/pages/Admin/AdminRequests.tsx` | Página principal |
| `src/features/student/services/adminRequestsService.ts` | Servicio API |

### Backend

| Archivo | Descripción |
|---------|-------------|
| `backend/src/routes/admin-requests.routes.ts` | Rutas |
| `backend/src/controllers/admin-requests.controller.ts` | Controlador |

---

## 13. Siguiente Módulo

El sidebar continúa con:

| # | Módulo | Ruta |
|---|--------|------|
| 09 | Reportes | `/reports` |
| 10 | Configuración | `/configure/*` |
