# Guía de Interfaz: Prácticas Profesionales > Seguimiento

## 1. Descripción General

El módulo de **Seguimiento** es el tercer paso del flujo de prácticas profesionales. Permite registrar y gestionar las visitas de seguimiento a estudiantes que están realizando su práctica profesional.

### Propósito

- Registrar visitas de seguimiento a estudiantes
- Documentar observaciones y recomendaciones
- Controlar si hubo traslado de institución
- Visualizar estadísticas de seguimiento
- Gestionar el estado de registros (activo/inactivo)

### Ruta

```
/tracking
```

### Flujo del Estudiante

```
Pre-Inscripción → Inscripción → Seguimiento → Evaluación → Culminación
    (Paso 1)      (Paso 2)       (Paso 3)      (Paso 4)      (Paso 5)
```

### Roles que Acceden

| Rol | Acceso |
|-----|--------|
| Administrador (role: 1) | ✅ Sí |
| Asistente (role: 2) | ✅ Sí |
| Tutor (role: 3) | ✅ Sí |
| Estudiante (role: 4) | ❌ No |

---

## 2. Estructura Visual

### Layout de la Página

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  [SIDEBAR]                              [HEADER: Usuario + Notificaciones]     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  SEGUIMIENTO DE PRÁCTICAS PROFESIONALES                                      │
│  Registra y gestiona las visitas de seguimiento a estudiantes                   │
│                                                                                 │
│  ┌─────────────────────────────────────┐ ┌──────────────────────────────┐   │
│  │ [+ Nuevo Seguimiento]               │ │ [Estadísticas]               │   │
│  └─────────────────────────────────────┘ └──────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  ESTADÍSTICAS DE SEGUIMIENTO                                          │   │
│  │                                                                         │   │
│  │   Total Seguimientos: 45    Con Traslado: 5    Sin Traslado: 40        │   │
│  │   [████████████░░░░░░░░░░]  11% con traslado                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  [Activos] [Inactivos]                                                  │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                         │   │
│  │  Fecha   | Estudiante      | Título        | Traslado | Observaciones   │   │
│  │  ─────────────────────────────────────────────────────────────────────│   │
│  │  15/03/26| Juan García    | Visita 1     | No       | Todo bien...   │   │
│  │  10/03/26| María López    | Seguimiento  | Sí       | Traslado a...  │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Componentes del Módulo

### 3.1 Header

```
SEGUIMIENTO DE PRÁCTICAS PROFESIONALES
Registra y gestiona las visitas de seguimiento a estudiantes
```

### 3.2 Botones de Acción

| Botón | Icono | Acción |
|-------|-------|--------|
| Nuevo Seguimiento | ➕ | Abre modal de registro |
| Estadísticas | 📊 | Muestra panel de estadísticas |

### 3.3 Pestañas

```
[Activos] [Inactivos]
```

- **Activos**: Registros con `status = true`
- **Inactivos**: Registros con `status = false`

---

## 4. Estadísticas de Seguimiento

### 4.1 Métricas Mostradas

| Métrica | Descripción |
|---------|-------------|
| Total Seguimientos | Cantidad total de registros |
| Con Traslado | Seguimientos con traslado = true |
| Sin Traslado | Seguimientos con traslado = false |
| Porcentaje | Porcentaje de seguimientos con traslado |

### 4.2 Visualización

```
┌─────────────────────────────────────────────┐
│  ESTADÍSTICAS DE SEGUIMIENTO               │
│                                             │
│  Total Seguimientos: 45                     │
│  Con Traslado: 5                            │
│  Sin Traslado: 40                           │
│                                             │
│  [████████████░░░░░░░░░░░] 11%            │
└─────────────────────────────────────────────┘
```

---

## 5. Tabla de Seguimientos

### 5.1 Columnas

| Columna | Descripción | Ordenable |
|---------|-------------|-----------|
| Fecha | Fecha de creación | ✅ |
| Estudiante | Nombre del estudiante | ✅ |
| Título | Título del reporte | ✅ |
| Traslado | Si hubo traslado | ✅ |
| Observaciones | Notas del seguimiento | ❌ |
| Acciones | Menú de acciones | ❌ |

### 5.2 Estados

| Status | Label | Color |
|--------|-------|-------|
| true | Activo | Verde |
| false | Inactivo | Gris |

### 5.3 Traslado

| Valor | Label | Color |
|-------|-------|-------|
| true | Sí | Naranja |
| false | No | Verde |

---

## 6. Modal de Seguimiento

### 6.1 Campos del Formulario

| Campo | Tipo | Required | Validaciones |
|-------|------|----------|--------------|
| Cédula del Estudiante | text | ✅ Sí | Formato V-00.000.000 |
| Nombre del Estudiante | text | ✅ Sí | Solo lectura (auto) |
| Título del Reporte | text | ✅ Sí | Descripción de la actividad |
| ¿Hubo Traslado? | select | ✅ Sí | Sí / No |
| Ruta | text | ✅ Sí | Ubicación/lugar |
| Observaciones | textarea | ✅ Sí | Detalles del seguimiento |

### 6.2 UI del Modal

```
┌─────────────────────────────────────────────────────────────────────────┐
│  NUEVO REGISTRO DE SEGUIMIENTO                                         │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  DATOS DEL ESTUDIANTE                                           │   │
│  │                                                                 │   │
│  │  Cédula del Estudiante *                                        │   │
│  │  ┌─────────────────────────────────────────────┐                 │   │
│  │  │ V00.000.000                                │                 │   │
│  │  └─────────────────────────────────────────────┘                 │   │
│  │                                                                 │   │
│  │  Nombre del Estudiante:                                         │   │
│  │  Juan García                                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  DETALLES DEL SEGUIMIENTO                                      │   │
│  │                                                                 │   │
│  │  Título del Reporte *                                           │   │
│  │  ┌─────────────────────────────────────────────┐                 │   │
│  │  │ Primera visita de seguimiento                │                 │   │
│  │  └─────────────────────────────────────────────┘                 │   │
│  │                                                                 │   │
│  │  ¿Hubo Traslado? *                                             │   │
│  │  ┌─────────────────────────────────────────────┐                 │   │
│  │  │ Seleccione...                          ▼│                 │   │
│  │  └─────────────────────────────────────────────┘                 │   │
│  │                                                                 │   │
│  │  Ruta *                                                        │   │
│  │  ┌─────────────────────────────────────────────┐                 │   │
│  │  │ Av. Principal, Edificio Centro               │                 │   │
│  │  └─────────────────────────────────────────────┘                 │   │
│  │                                                                 │   │
│  │  Observaciones *                                                │   │
│  │  ┌────────────────────────────────────────────────────────┐    │   │
│  │  │ El estudiante se encuentra realizando sus actividades   │    │   │
│  │  │ de manera satisfactoria en la empresa.                  │    │   │
│  │  │                                                         │    │   │
│  │  └────────────────────────────────────────────────────────┘    │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  [Cancelar]                                    [Guardar]              │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Validaciones

### 7.1 Cédula del Estudiante

```typescript
// Formato visual: V00.000.000
// Validaciones:
- Solo números (8 dígitos)
- El estudiante debe existir en el sistema
- El estudiante debe tener una inscripción activa
```

### 7.2 Título del Reporte

```typescript
// Validaciones:
- Obligatorio
- Mínimo 3 caracteres
- Máximo 200 caracteres
```

### 7.3 Traslado

```typescript
// Opciones:
- true: "Sí" - Hubo cambio de institución
- false: "No" - Sin cambio
```

---

## 8. Acciones

### 8.1 Acciones por Registro

| Acción | Icono | Descripción |
|--------|-------|-------------|
| Ver | 👁️ | Ver detalles completos |
| Editar | ✏️ | Modificar datos del seguimiento |
| Activar/Desactivar | 🔄 | Cambiar estado |
| Eliminar | 🗑️ | Eliminar permanentemente |

### 8.2 Polling de Estadísticas

Las estadísticas se actualizan automáticamente cada 30 segundos.

---

## 9. Tipos de Datos

### 9.1 Tracking

```typescript
interface Tracking {
  trackingId: string;
  
  // Datos del Estudiante
  studentIdNumber: string;      // Cédula
  studentName: string;          // Nombre completo
  
  // Datos del Seguimiento
  reportTitle: string;          // Título del reporte
  transfer: boolean;           // ¿Hubo traslado?
  route: string;              // Ubicación
  observations: string;       // Observaciones
  
  // Metadatos
  creationDate: Date;
  status: boolean;
}
```

### 9.2 CreateTrackingPayload

```typescript
interface CreateTrackingPayload {
  studentIdNumber: string;
  studentName: string;
  reportTitle: string;
  transfer: boolean;
  route: string;
  observations: string;
}
```

### 9.3 TrackingStats

```typescript
interface TrackingStats {
  totalTrackings: number;
  withTransfer: number;
  withoutTransfer: number;
  transferPercentage: number;
}
```

---

## 10. Obtención de Datos

### 10.1 Hook

```typescript
const {
  trackings,
  status,
  loadingAction,
  error,
  addTracking,
  editTracking,
  removeTracking,
  restoreTracking
} = useTracking();
```

### 10.2 Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/tracking` | Obtener seguimientos |
| POST | `/api/tracking` | Crear seguimiento |
| PUT | `/api/tracking/:id` | Actualizar seguimiento |
| DELETE | `/api/tracking/:id` | Eliminar seguimiento |
| GET | `/api/tracking/stats` | Obtener estadísticas |

---

## 11. Casos Edge

| Caso | Comportamiento |
|------|----------------|
| Estudiante no existe | Validación rejecta |
| Estudiante sin inscripción activa | Warning, permite crear igual |
| Cédula inválida | Validación rejecta |
| Seguimiento inactivo | No aparece en estadísticas |
| Sin observaciones | Validación rejecta |

---

## 12. Flujo Completo de Práctica Profesional

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FLUJO DE PRÁCTICA PROFESIONAL                       │
└─────────────────────────────────────────────────────────────────────────────┘

   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
   │ PRE-         │     │ INSCRIPCIÓN  │     │ SEGUIMIENTO  │
   │ INSCRIPCIÓN  │────▶│              │────▶│              │
   │              │     │              │     │ (Este módulo)│
   └──────────────┘     └──────────────┘     └──────────────┘
                                                        │
   ┌──────────────┐     ┌──────────────┐              │
   │ CULMINACIÓN  │◀────│ EVALUACIONES │◀─────────────┘
   │              │     │              │
   └──────────────┘     └──────────────┘
```

---

## 13. Módulos Relacionados

| Módulo | Relación |
|--------|----------|
| Inscripción | Proporciona estudiantes activos |
| Estudiantes | Valida existencia del estudiante |
| Bitácora de Actividades | Registro complementario |

---

## 14. Archivos Relacionados

### Frontend

| Archivo | Descripción |
|---------|-------------|
| `src/pages/Tracking/Tracking.tsx` | Página principal |
| `src/features/tracking/components/TrackingTable.tsx` | Tabla de seguimientos |
| `src/features/tracking/components/TrackingModal.tsx` | Modal de creación/edición |
| `src/features/tracking/components/TrackingStatsChart.tsx` | Gráfico de estadísticas |
| `src/features/tracking/hooks/useTracking.tsx` | Hook de lógica |
| `src/features/tracking/types/index.ts` | Tipos TypeScript |

### Backend

| Archivo | Descripción |
|---------|-------------|
| `backend/src/routes/tracking.routes.ts` | Rutas de seguimiento |
| `backend/src/controllers/tracking.controller.ts` | Controlador |

---

## 15. Siguiente Módulo

El módulo "Prácticas Profesionales":

| # | Módulo | Ruta |
|---|--------|------|
| 07a | Pre-Inscripción | `/pre-enrollment` |
| 07b | Inscripción | `/enrollment` |
| 07c | Seguimiento | `/tracking` (actual) |
| 07d | Evaluaciones | `/evaluations` |
| 07e | Culminación | `/culmination` |
