# Guía de Interfaz: Gestión de Períodos

## 1. Descripción General

El módulo de **Períodos** permite administrar los lapsos académicos del sistema. Cada período representa un ciclo académico (ej. "1-2026", "2-2026") con fechas de inicio y fin, y un estado que determina su fase actual.

### Propósito

- Crear, editar y eliminar períodos académicos
- Controlar el estado de cada período (Pendiente, En Curso, Culminado)
- Visualizar el progreso de los períodos activos
- Generar reportes PDF de períodos

### Ruta

```
/period
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
│  GESTIÓN DE PERÍODOS                                                           │
│  Administra los lapsos académicos y su estado actual                          │
│                                                                                 │
│  ┌─────────────────────────────────────┐ ┌──────────────────────────────┐   │
│  │ [Reporte PDF]  [+ Nuevo Período]   │ │                              │   │
│  └─────────────────────────────────────┘ └──────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  [Activos] [Inactivos]           (Tabs de navegación)                 │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                         │   │
│  │  Código | Descripción | Inicio  | Fin      | Estado  | Progreso | A │   │
│  │  ─────────────────────────────────────────────────────────────────────│   │
│  │  1-2026 | 2026-I      | 15/01   | 15/05   | En Curso| ████░░░  | ⋮ │   │
│  │  2-2025 | 2025-II     | 01/09   | 15/12   | Culminad| ██████   | ⋮ │   │
│  │  1-2025 | 2025-I      | 15/01   | 15/05   | Culminad| ██████   | ⋮ │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Componentes del Módulo

### 3.1 Header

```
GESTIÓN DE PERÍODOS
Administra los lapsos académicos y su estado actual
```

- **Título**: "Gestión de Períodos"
- **Descripción**: Subtítulo explicativo

### 3.2 Botones de Acción

| Botón | Icono | Acción |
|-------|-------|--------|
| Reporte | 📥 | Abre modal de PDF |
| Nuevo Período | ➕ | Abre modal de creación |

### 3.3 Tabs de Navegación

```
[Activos] [Inactivos]
```

- **Activos**: Muestra períodos con `status = true`
- **Inactivos**: Muestra períodos con `status = false`

---

## 4. Tabla de Períodos

### 4.1 Columnas

| Columna | Descripción | Ordenable |
|---------|-------------|-----------|
| Código | Código único del período | ✅ |
| Descripción | Nombre del período | ✅ |
| Fecha Inicio | Fecha de inicio | ✅ |
| Fecha Fin | Fecha de culminación | ✅ |
| Estado | Fase actual | ✅ |
| Progreso | Barra de avance (% días transcurridas) | ❌ |
| Acciones | Menú de acciones | ❌ |

### 4.2 Estados del Período

| Status | Label | Color | Descripción |
|--------|-------|-------|-------------|
| 1 | Pendiente | Azul | Período programado, no ha iniciado |
| 2 | En Curso | Verde | Período activo actualmente |
| 3 | Culminado | Gris | Período terminado |

### 4.3 Fila de Período En Curso

```
┌────────────────────────────────────────────────────────────────────────────┐
│  1-2026  │  2026-I  │  15/01/2026  │  15/05/2026  │ [En Curso] │ ████░░░ │
└────────────────────────────────────────────────────────────────────────────┘
```

#### Información Adicional (calculada)

- **Días transcurridos**: Días desde inicio
- **Días restantes**: Días hasta fin
- **Semanas restantes**: Semanas restantes (aproximado)

---

## 5. Acciones por Estado

### 5.1 Período Pendiente (Status = 1)

| Acción | Icono | Descripción |
|--------|-------|-------------|
| Editar | ✏️ | Modificar datos del período |
| Activar | ▶️ | Cambiar a "En Curso" |
| Ver | 👁️ | Ver detalles completos |
| Eliminar | 🗑️ | Enviar a inactivos |

### 5.2 Período En Curso (Status = 2)

| Acción | Icono | Descripción |
|--------|-------|-------------|
| Editar | ✏️ | Modificar datos del período |
| Culminar | ✅ | Finalizar período (no editable después) |
| Ver | 👁️ | Ver detalles completos |
| Eliminar | 🗑️ | Enviar a inactivos |

### 5.3 Período Culminado (Status = 3)

| Acción | Icono | Descripción |
|--------|-------|-------------|
| Ver | 👁️ | Ver detalles completos |
| Reactivar | 🔄 | Cambiar a "En Curso" |

> **Nota**: Los períodos culminados NO pueden ser editados.

---

## 6. Modal de Creación/Edición

### 6.1 Campos del Formulario

| Campo | Tipo | Required | Validaciones |
|-------|------|----------|--------------|
| Código | text | ✅ Sí | Único, formato automático (Tipo-Año ej: 1-2026) |
| Descripción | text | ✅ Sí | Nombre visible del período |
| Fecha Inicio | date | ✅ Sí | No puede ser anterior a hoy (para nuevos) |
| Fecha Fin | date | ✅ Sí | Debe ser mayor a inicio |
| Tipo de Período | select | ✅ Sí | "1" (Enero-Mayo) o "2" (Septiembre-Diciembre) |

### 6.2 UI del Modal (Creación)

```
┌─────────────────────────────────────────────┐
│  CREAR NUEVO PERIODO                        │
│                                             │
│  Código *                                   │
│  ┌─────────────────────────────────────┐   │
│  │ 1-2026                              │   │
│  └─────────────────────────────────────┘   │
│  (Auto-generado: AAAA-X)                    │
│                                             │
│  Descripción *                              │
│  ┌─────────────────────────────────────┐   │
│  │ 2026-I                              │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Tipo de Período *                          │
│  ┌─────────────────────────────────────┐   │
│  │ Seleccione...                      ▼  │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Fecha de Inicio *                          │
│  ┌─────────────────────────────────────┐   │
│  │ 📅 15/01/2026                      │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Fecha de Fin *                             │
│  ┌─────────────────────────────────────┐   │
│  │ 📅 15/05/2026                      │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  [Cancelar]              [Guardar]        │
└─────────────────────────────────────────────┘
```

### 6.3 Validaciones

```typescript
// Código automático según tipo
const generateCode = (year, tipo) => {
  return tipo === '1' ? `${year}-1` : `${year}-2`;
};

// Descripción automática
const generateDescription = (year, tipo) => {
  return tipo === '1' ? `${year}-I` : `${year}-II`;
};
```

---

## 7. Modal de Visualización

### 7.1 Campos Mostrados

| Campo | Descripción |
|-------|-------------|
| Código | Código único |
| Descripción | Nombre del período |
| Tipo | "I" (Enero-Mayo) o "II" (Septiembre-Diciembre) |
| Fecha Inicio | Fecha de inicio |
| Fecha Fin | Fecha de culminación |
| Estado | Status actual |
| Estado Lógico | Activo/Inactivo |
| Fecha de Creación | Cuándo fue creado |

---

## 8. Confirmaciones

### 8.1 Activar Período

```
┌─────────────────────────────────────────────┐
│  ⚠️ Confirmar Activación                     │
│                                             │
│  ¿Estás seguro de que deseas activar el    │
│  período "1-2026"?                          │
│                                             │
│  Esto loputará "En Curso" y permitirá       │
│  registrar actividades.                     │
│                                             │
│  [Cancelar]        [Activar]               │
└─────────────────────────────────────────────┘
```

### 8.2 Culminar Período

```
┌─────────────────────────────────────────────┐
│  ⚠️ Confirmar Culminación                   │
│                                             │
│  ¿Estás seguro de que deseas culminar el   │
│  período "1-2026"?                          │
│                                             │
│  Los períodos culminados no se pueden      │
│  editar.                                    │
│                                             │
│  [Cancelar]        [Culminar]              │
└─────────────────────────────────────────────┘
```

### 8.3 Eliminar Período

```
┌─────────────────────────────────────────────┐
│  ⚠️ Confirmar Envío a Inactivos             │
│                                             │
│  ¿Estás seguro de que deseas enviar el     │
│  período "2-2025" a Inactivos?             │
│                                             │
│  [Cancelar]        [Confirmar]             │
└─────────────────────────────────────────────┘
```

---

## 9. Obtención de Datos

### 9.1 Hook: usePeriods

```typescript
const {
  periodos,
  status,
  loadingAction,
  error,
  addPeriod,
  editPeriod,
  removePeriod,
} = usePeriods();
```

### 9.2 Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/periodos` | Obtener todos los períodos |
| POST | `/api/periodos` | Crear período |
| PUT | `/api/periodos/:id` | Actualizar período |
| DELETE | `/api/periodos/:id` | Eliminar período |

---

## 10. Tipos de Datos

### 10.1 Periodo (Modelo de Dominio)

```typescript
interface Periodo {
  periodId: string;           // ID único
  code: string;              // Código (ej: "1-2026")
  description: string;        // Descripción (ej: "2026-I")
  startDate: Date;           // Fecha de inicio
  endDate: Date;             // Fecha de fin
  creationDate: Date;        // Fecha de creación
  periodStatus: 1 | 2 | 3;  // Estado del período
  status: boolean;           // Estado lógico (activo/inactivo)
  isInUse?: boolean;         // Si está en uso
}
```

### 10.2 CreatePeriodPayload

```typescript
interface CreatePeriodPayload {
  code: string;
  description: string;
  startDate: Date;
  endDate: Date;
  periodStatus: 1 | 2 | 3;
  status: boolean;
}
```

### 10.3 PeriodoRowData

```typescript
interface PeriodoRowData extends Omit<Periodo, 'startDate' | 'endDate' | 'creationDate'> {
  startDate: string;         // Formateado: "15/01/2026"
  endDate: string;           // Formateado: "15/05/2026"
  rawStartDate: Date;       // Original para cálculos
  rawEndDate: Date;         // Original para cálculos
  progress: number | null;  // Porcentaje de progreso
  daysPassed?: number;      // Días transcurridos
  daysRemaining?: number;    // Días restantes
  weeksRemaining?: number;    // Semanas restantes
}
```

---

## 11. Estados del Componente

| Estado | Descripción |
|--------|-------------|
| `loading` | Cargando datos iniciales |
| `error` | Error al cargar datos |
| `idle` | Datos cargados, esperando interacción |

---

## 12. Reporte PDF

### 12.1 Modal de Generación

```
┌─────────────────────────────────────────────┐
│  REPORTE DE PERÍODOS ACADÉMICOS             │
│                                             │
│  [🔍 Buscar...]                            │
│                                             │
│  Filtrar por Estado:                        │
│  ┌─────────────────────────────────────┐    │
│  │ Seleccione...                      ▼│    │
│  └─────────────────────────────────────┘    │
│  (Todos / Pendiente / En Curso / Culminado) │
│                                             │
│  Vista previa de tabla...                   │
│                                             │
│         [📥 Descargar PDF]                  │
└─────────────────────────────────────────────┘
```

### 12.2 Columnas del PDF

| Columna | Datos |
|---------|-------|
| Código | `code` |
| Descripción | `description` |
| Fecha Inicio | `startDate` formateada |
| Fecha Fin | `endDate` formateada |
| Estado | Label según `periodStatus` |

---

## 13. Navegación

### 13.1 Flujo desde Dashboard

```
Dashboard Admin
    │
    ▼
Gestión → Períodos (/period)
```

### 13.2 Módulos Relacionados

| Módulo | Ruta | Relación |
|--------|------|----------|
| Carreras | `/careers` | Períodos definen cuándo se ofrecen carreras |
| Pre-Inscripción | `/pre-enrollment` | Requiere período activo |
| Inscripción | `/enrollment` | Requiere período activo |

---

## 14. Casos Edge

| Caso | Comportamiento |
|------|----------------|
| Sin períodos | Muestra tabla vacía con mensaje |
| Período activo sin fecha fin | No permite culminación |
| Código duplicado | Validación拒绝 creación |
| Período en uso | Muestra warning al eliminar |
| Fechas invertidas | Validaciónrejecta guardado |
| Período culminado | No permite edición |

---

## 15. Archivos Relacionados

### Frontend

| Archivo | Descripción |
|---------|-------------|
| `src/pages/Period/period.tsx` | Página principal |
| `src/features/periods/components/PeriodTable.tsx` | Tabla de períodos |
| `src/features/periods/components/PeriodModal.tsx` | Modal de creación/edición |
| `src/features/periods/components/PeriodViewModal.tsx` | Modal de visualización |
| `src/features/periods/hooks/usePeriods.tsx` | Hook de lógica de negocio |
| `src/features/periods/types/index.tsx` | Tipos TypeScript |
| `src/features/periods/services/periodService.tsx` | Servicio API |

### Backend

| Archivo | Descripción |
|---------|-------------|
| `backend/src/routes/period.routes.ts` | Definición de rutas |
| `backend/src/controllers/period.controller.ts` | Controlador |

---

## 16. Siguiente Módulo

Este módulo pertenece a **Gestión**. El siguiente en el sidebar es:

| # | Módulo | Ruta |
|---|--------|------|
| 05b | Carreras | `/careers` |
