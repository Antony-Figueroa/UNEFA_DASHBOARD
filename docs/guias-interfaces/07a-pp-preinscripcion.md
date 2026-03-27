# Guía de Interfaz: Prácticas Profesionales > Pre-Inscripción

## 1. Descripción General

El módulo de **Pre-Inscripción** es el primer paso del flujo de prácticas profesionales. Permite registrar a estudiantes que desean iniciar su proceso de práctica profesional.

### Propósito

- Registrar pre-inscripciones de estudiantes
- Asignar período académico y tipo de práctica
- Validar que el estudiante cumpla los requisitos previos
- Gestionar el estado de pre-inscripciones (activa/inactiva)
- Convertir pre-inscripciones en inscripciones formales

### Ruta

```
/pre-enrollment
```

### Flujo del Estudiante

```
Pre-Inscripción → Inscripción → Seguimiento → Evaluación → Culminación
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
│  PRE-INSCRIPCIÓN DE PRÁCTICAS PROFESIONALES                                   │
│  Gestiona el registro de estudiantes que desean iniciar su práctica profesional│
│                                                                                 │
│  ┌─────────────────────────────────────┐ ┌──────────────────────────────┐   │
│  │ [+ Nueva Pre-Inscripción]            │ │ [Filtros: Período | Tipo]   │   │
│  └─────────────────────────────────────┘ └──────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │  Cédula  | Estudiante      | Período    | Tipo     | Carrera   | E     │   │
│  │  ─────────────────────────────────────────────────────────────────────│   │
│  │  V12345678| Juan García    | 1-2026    | Ordinar..| Ing. Sis..| ✓     │   │
│  │  V87654321| María López    | 1-2026    | Especial | Medicina  | ✓     │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Componentes del Módulo

### 3.1 Header

```
PRE-INSCRIPCIÓN DE PRÁCTICAS PROFESIONALES
Gestiona el registro de estudiantes que desean iniciar su práctica profesional
```

### 3.2 Botones de Acción

| Botón | Icono | Acción |
|-------|-------|--------|
| Nueva Pre-Inscripción | ➕ | Abre modal de registro |

### 3.3 Filtros

| Filtro | Opciones |
|--------|----------|
| Período | Todos los períodos activos |
| Tipo de Práctica | Ordinaria / Especial |

---

## 4. Tabla de Pre-Inscripciones

### 4.1 Columnas

| Columna | Descripción | Ordenable |
|---------|-------------|-----------|
| Cédula | Identificación del estudiante | ✅ |
| Estudiante | Nombre completo | ✅ |
| Período | Período académico | ✅ |
| Tipo | Tipo de práctica | ✅ |
| Carrera | Carrera del estudiante | ✅ |
| Fecha | Fecha de registro | ✅ |
| Estado | Estatus actual | ✅ |
| Acciones | Menú de acciones | ❌ |

### 4.2 Estados

| Status | Label | Color |
|--------|-------|-------|
| true | Activo | Verde |
| false | Inactivo | Gris |

---

## 5. Modal de Pre-Inscripción

### 5.1 Flujo del Formulario

El formulario tiene un flujo de 3 pasos:

#### Paso 1: Datos del Estudiante

| Campo | Tipo | Required | Validaciones |
|-------|------|----------|--------------|
| Cédula | text | ✅ Sí | Formato V-00.000.000 |
| Buscar | button | - | Busca estudiante existente o permite crear nuevo |

#### Paso 2: Datos de la Práctica

| Campo | Tipo | Required | Validaciones |
|-------|------|----------|--------------|
| Período | select | ✅ Sí | Período activo |
| Tipo de Práctica | select | ✅ Sí | Ordinaria / Especial |
| Carrera | select | ✅Sí | Carrera del estudiante |

#### Paso 3: Confirmación

- Resumen de datos
- Botón de confirmación

### 5.2 UI del Modal

```
┌─────────────────────────────────────────────────────────────────────────┐
│  NUEVA PRE-INSCRIPCIÓN                                                 │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 1. DATOS DEL ESTUDIANTE                                       │   │
│  │                                                                 │   │
│  │  Cédula de Identidad *                                        │   │
│  │  ┌─────────────────────────────────────────────┐            │   │
│  │  │ V00.000.000                                │  [Buscar]  │   │
│  │  └─────────────────────────────────────────────┘            │   │
│  │                                                                 │   │
│  │  Si el estudiante no existe, se mostrará la opción de       │   │
│  │  registrarlo desde aquí.                                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 2. DATOS DE LA PRÁCTICA                                       │   │
│  │                                                                 │   │
│  │  Período Académico *                                           │   │
│  │  ┌─────────────────────────────────────────────┐            │   │
│  │  │ Seleccione...                              ▼│            │   │
│  │  └─────────────────────────────────────────────┘            │   │
│  │                                                                 │   │
│  │  Tipo de Práctica *                                            │   │
│  │  ┌─────────────────────────────────────────────┐            │   │
│  │  │ Ordinaria                                  ▼│            │   │
│  │  └─────────────────────────────────────────────┘            │   │
│  │                                                                 │   │
│  │  Carrera *                                                      │   │
│  │  ┌─────────────────────────────────────────────┐            │   │
│  │  │ Seleccione...                              ▼│            │   │
│  │  └─────────────────────────────────────────────┘            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 3. CONFIRMACIÓN                                                 │   │
│  │                                                                 │   │
│  │  Resumen de Pre-Inscripción:                                    │   │
│  │  ───────────────────────────────                                 │   │
│  │  Estudiante: Juan García                                        │   │
│  │  Cédula: V-12.345.678                                           │   │
│  │  Período: 1-2026                                               │   │
│  │  Tipo: Ordinaria                                                │   │
│  │  Carrera: Ingeniería de Sistemas                               │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  [Cancelar]                                    [Confirmar Pre-Inscripción]│
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Búsqueda de Estudiante

### 6.1 Flujo

1. Usuario ingresa la cédula
2. Click en "Buscar"
3. Sistema busca estudiante existente:
   - **Encontrado**: Completa datos automáticamente
   - **No encontrado**: Muestra opción de crear nuevo estudiante

### 6.2 Integración con StudentModal

Si el estudiante no existe, se abre el modal de estudiante para crear uno nuevo:

```
┌─────────────────────────────────────────────┐
│  ¿Estudiante no encontrado?                  │
│                                             │
│  [✕ Cerrar]  [+ Registrar Nuevo Estudiante]│
└─────────────────────────────────────────────┘
```

---

## 7. Períodos y Tipos de Práctica

### 7.1 Períodos

Los períodos se cargan desde el módulo de Gestión > Períodos:
- Solo muestra períodos con `status = true`
- Solo períodos "En Curso" (periodStatus = 2) o "Pendiente" (periodStatus = 1)

### 7.2 Tipos de Práctica

| Tipo | Descripción |
|------|-------------|
| ORDINARIA | Práctica profesional regular |
| ESPECIAL | Práctica especial (hospitalaria/comunitaria) |

---

## 8. Acciones

### 8.1 Acciones por Registro

| Acción | Icono | Descripción |
|--------|-------|-------------|
| Ver | 👁️ | Ver detalles completos |
| Editar | ✏️ | Modificar datos de pre-inscripción |
| Convertir a Inscripción | ➡️ | Convierte en inscripción formal |
| Activar/Desactivar | 🔄 | Cambiar estado |
| Eliminar | 🗑️ | Eliminar permanentemente |

### 8.2 Convertir a Inscripción

Esta es la acción principal. Transforma una pre-inscripción en inscripción formal, permitiendo:
- Asignar tutor académico
- Asignar institución receptora
- Definir fechas de inicio y fin

---

## 9. Tipos de Datos

### 9.1 PreEnrollment

```typescript
interface PreEnrollment {
  preEnrollmentId: string;
  
  // Datos del Estudiante
  identificationPrefix: "V" | "E";
  identificationNumber: string;
  studentName: string;
  phone: string;
  
  // Datos de la Práctica
  period: string;              // ej: "1-2026"
  practiceType: string;         // ORDINARIA / ESPECIAL
  careerName: string;
  enrollmentCode: string;        // ej: "ING-AI-111-336-S3"
  
  // Metadatos
  preEnrollmentDate: Date;
  status: boolean;
  isInUse?: boolean;
}
```

### 9.2 CreatePreEnrollmentPayload

```typescript
type CreatePreEnrollmentPayload = Omit<PreEnrollment, "preEnrollmentId" | "preEnrollmentDate" | "status" | "isInUse">;
```

---

## 10. Obtención de Datos

### 10.1 Hook

```typescript
const {
  preEnrollments,
  status,
  loadingAction,
  error,
  addPreEnrollment,
  editPreEnrollment,
  toggleStatus,
  bulkRemovePreEnrollments,
  bulkRestorePreEnrollments,
} = usePreEnrollment();
```

### 10.2 Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/pre-enrollments` | Obtener pre-inscripciones |
| POST | `/api/pre-enrollments` | Crear pre-inscripción |
| PUT | `/api/pre-enrollments/:id` | Actualizar pre-inscripción |
| DELETE | `/api/pre-enrollments/:id` | Eliminar pre-inscripción |

---

## 11. Validaciones

### 11.1 Campo Cédula

```typescript
// Formato visual: V00.000.000
// Validaciones:
- Solo números (8 dígitos)
- Prefijo válido (V o E)
```

### 11.2 Campo Período

```typescript
// Debe existir en el sistema
// Debe estar activo
```

### 11.3 Campo Carrera

```typescript
// Debe existir en el sistema
// Debe tener el tipo de práctica seleccionado disponible
```

---

## 12. Casos Edge

| Caso | Comportamiento |
|------|----------------|
| Estudiante ya pre-inscrito | Muestra warning, permite ver existente |
| Estudiante no existe | Opción de crear nuevo |
| Período sin carreras | Validación rejecta |
| Pre-inscripción con inscripción activa | No permite eliminar |
| Cédula inválida | Validación rejecta |

---

## 13. Flujo Completo de Práctica Profesional

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FLUJO DE PRÁCTICA PROFESIONAL                       │
└─────────────────────────────────────────────────────────────────────────────┘

   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
   │ PRE-         │     │ INSCRIPCIÓN  │     │ SEGUIMIENTO  │
   │ INSCRIPCIÓN  │────▶│              │────▶│              │
   │              │     │              │     │              │
   └──────────────┘     └──────────────┘     └──────────────┘
                                                        │
   ┌──────────────┐     ┌──────────────┐              │
   │ CULMINACIÓN  │◀────│ EVALUACIONES │◀─────────────┘
   │              │     │              │
   └──────────────┘     └──────────────┘
```

| Etapa | Módulo | Descripción |
|-------|--------|-------------|
| 1 | Pre-Inscripción | Registro inicial del estudiante |
| 2 | Inscripción | Asignación de tutor e institución |
| 3 | Seguimiento | Visitas y bitácoras |
| 4 | Evaluaciones | Calificaciones |
| 5 | Culminación | Finalización del proceso |

---

## 14. Archivos Relacionados

### Frontend

| Archivo | Descripción |
|---------|-------------|
| `src/pages/PreEnrollment/PreEnrollment.tsx` | Página principal |
| `src/features/pre-enrollment/components/PreEnrollmentTable.tsx` | Tabla de pre-inscripciones |
| `src/features/pre-enrollment/components/PreEnrollmentModal.tsx` | Modal de creación |
| `src/features/pre-enrollment/components/PreEnrollmentViewModal.tsx` | Modal de visualización |
| `src/features/pre-enrollment/hooks/usePreEnrollment.tsx` | Hook de lógica |
| `src/features/pre-enrollment/types/index.ts` | Tipos TypeScript |

### Backend

| Archivo | Descripción |
|---------|-------------|
| `backend/src/routes/pre-enrollment.routes.ts` | Rutas de pre-inscripción |
| `backend/src/controllers/pre-enrollment.controller.ts` | Controlador |

---

## 15. Siguiente Módulo

El módulo "Prácticas Profesionales" tiene 5 submódulos:

| # | Módulo | Ruta |
|---|--------|------|
| 07a | Pre-Inscripción | `/pre-enrollment` (actual) |
| 07b | Inscripción | `/enrollment` |
| 07c | Seguimiento | `/tracking` |
| 07d | Evaluaciones | `/evaluations` |
| 07e | Culminación | `/culmination` |
