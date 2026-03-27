# Guía de Interfaz: Prácticas Profesionales > Inscripción

## 1. Descripción General

El módulo de **Inscripción** es el segundo paso del flujo de prácticas profesionales. Permite formalizar la práctica del estudiante asignando tutores académicos, institución receptora y responsable institucional.

### Propósito

- Formalizar la inscripción de estudiantes a prácticas profesionales
- Asignar tutor académico y tutor metodológico
- Asignar institución receptora y responsable institucional
- Gestionar el estado de inscripciones (activa/inactiva)
- Registrar observaciones y datos adicionales
- Generar códigos únicos de inscripción

### Ruta

```
/enrollment
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
│  INSCRIPCIÓN DE PRÁCTICAS PROFESIONALES                                       │
│  Formaliza la inscripción de estudiantes y asigna tutores e instituciones       │
│                                                                                 │
│  ┌─────────────────────────────────────┐ ┌──────────────────────────────┐   │
│  │ [+ Nueva Inscripción]               │ │ [Filtros: Período | Estado]│   │
│  └─────────────────────────────────────┘ └──────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │  Cédula | Estudiante      | Tutor    | Institución   | Período | E     │   │
│  │  ─────────────────────────────────────────────────────────────────────│   │
│  │  V12345678| Juan García    | Dr. Pérez| Hospital XYZ  | 1-2026  | ✓     │   │
│  │  V87654321| María López    | Dra. González| Empresa ABC| 1-2026  | ✓     │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Componentes del Módulo

### 3.1 Header

```
INSCRIPCIÓN DE PRÁCTICAS PROFESIONALES
Formaliza la inscripción de estudiantes y asigna tutores e instituciones
```

### 3.2 Botones de Acción

| Botón | Icono | Acción |
|-------|-------|--------|
| Nueva Inscripción | ➕ | Abre modal de registro |
| Exportar PDF | 📥 | Genera reporte PDF |

### 3.3 Filtros

| Filtro | Opciones |
|--------|----------|
| Período | Todos los períodos activos |
| Estado | Activo / Inactivo |

---

## 4. Tabla de Inscripciones

### 4.1 Columnas

| Columna | Descripción | Ordenable |
|---------|-------------|-----------|
| Cédula | Identificación del estudiante | ✅ |
| Estudiante | Nombre completo | ✅ |
| Tutor Académico | Nombre del tutor | ✅ |
| Institución | Nombre de la empresa | ✅ |
| Período | Período académico | ✅ |
| Fecha | Fecha de inscripción | ✅ |
| Estado | Estatus actual | ✅ |
| Acciones | Menú de acciones | ❌ |

### 4.2 Estados

| Status | Label | Color |
|--------|-------|-------|
| true | Activo | Verde |
| false | Inactivo | Gris |

---

## 5. Modal de Inscripción

### 5.1 Secciones del Formulario

El formulario tiene un flujo de pasos:

#### Paso 1: Datos del Estudiante (desde Pre-Inscripción)

| Campo | Tipo | Required | Descripción |
|-------|------|----------|-------------|
| Cédula | text | ✅ Sí | Desde pre-inscripción |
| Período | select | ✅ Sí | Período académico |
| Tipo de Práctica | select | ✅ Sí | Ordinaria / Especial |

#### Paso 2: Tutor Académico

| Campo | Tipo | Required | Descripción |
|-------|------|----------|-------------|
| Tutor Académico | select | ✅Sí | Tutor de la universidad |
| Teléfono | text | Auto | Teléfono del tutor |

#### Paso 3: Tutor Metodológico

| Campo | Tipo | Required | Descripción |
|-------|------|----------|-------------|
| Tutor Metodológico | select | ✅Sí | Tutor metodológico |
| Teléfono | text | Auto | Teléfono del tutor |

#### Paso 4: Institución Receptora

| Campo | Tipo | Required | Descripción |
|-------|------|----------|-------------|
| Institución | select | ✅Sí | Empresa receptora |
| Responsable | select | ✅Sí | Persona de contacto |
| Teléfono | text | Auto | Teléfono de la institución |
| Dirección | text | Auto | Dirección de la institución |

#### Paso 5: Datos Adicionales

| Campo | Tipo | Required | Descripción |
|-------|------|----------|-------------|
| Región | text | ✅Sí | Región geográfica |
| Núcleo | text | ✅Sí | Núcleo universitario |
| Observaciones | textarea | ❌ No | Notas adicionales |

### 5.2 UI del Modal

```
┌─────────────────────────────────────────────────────────────────────────┐
│  NUEVA INSCRIPCIÓN                                                    │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 1. DATOS DEL ESTUDIANTE                                        │   │
│  │                                                                 │   │
│  │  Período Académico *                                            │   │
│  │  ┌─────────────────────────────────────────────┐                 │   │
│  │  │ Seleccione...                          ▼│                 │   │
│  │  └─────────────────────────────────────────────┘                 │   │
│  │                                                                 │   │
│  │  Tipo de Práctica *                                              │   │
│  │  ┌─────────────────────────────────────────────┐                 │   │
│  │  │ Ordinaria                                 ▼│                 │   │
│  │  └─────────────────────────────────────────────┘                 │   │
│  │                                                                 │   │
│  │  [Importar desde Pre-Inscripción]                                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 2. TUTOR ACADÉMICO                                             │   │
│  │                                                                 │   │
│  │  Tutor Académico *                                               │   │
│  │  ┌─────────────────────────────────────────────┐                 │   │
│  │  │ Seleccione...                          ▼│                 │   │
│  │  └─────────────────────────────────────────────┘                 │   │
│  │                                                                 │   │
│  │  Teléfono: +58 412-1234567                                     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 3. INSTITUCIÓN RECEPTORA                                       │   │
│  │                                                                 │   │
│  │  Institución *                                                   │   │
│  │  ┌─────────────────────────────────────────────┐                 │   │
│  │  │ Seleccione...                          ▼│                 │   │
│  │  └─────────────────────────────────────────────┘                 │   │
│  │                                                                 │   │
│  │  Responsable Institucional *                                     │   │
│  │  ┌─────────────────────────────────────────────┐                 │   │
│  │  │ Seleccione...                          ▼│                 │   │
│  │  └─────────────────────────────────────────────┘                 │   │
│  │                                                                 │   │
│  │  Dirección: Av. Principal, Edificio...                          │   │
│  │  Teléfono: 0212-1234567                                         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 4. DATOS ADICIONALES                                           │   │
│  │                                                                 │   │
│  │  Región *              Núcleo *                                 │   │
│  │  ┌──────────────┐    ┌──────────────┐                        │   │
│  │  │ Capital       │    │ Caracas      │                        │   │
│  │  └──────────────┘    └──────────────┘                        │   │
│  │                                                                 │   │
│  │  Observaciones:                                                 │   │
│  │  ┌────────────────────────────────────────────────────────┐    │   │
│  │  │                                                        │    │   │
│  │  └────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  [Cancelar]                                    [Confirmar Inscripción] │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Importación desde Pre-Inscripción

### 6.1 Descripción

Una funcionalidad clave es **importar datos desde una pre-inscripción existente**, lo que evita capturar nuevamente los datos del estudiante.

### 6.2 Flujo

1. El usuario hace clic en "Importar desde Pre-Inscripción"
2. Se muestra una lista de pre-inscripciones activas
3. El usuario selecciona una
4. Los datos se completan automáticamente

### 6.3 Datos Importados

| Campo | Origen |
|-------|--------|
| Cédula | Pre-Inscripción |
| Nombre del estudiante | Pre-Inscripción |
| Teléfono | Pre-Inscripción |
| Período | Pre-Inscripción |
| Tipo de Práctica | Pre-Inscripción |
| Carrera | Pre-Inscripción |

---

## 7. Asignación de Tutores

### 7.1 Tutor Académico

Es el tutor de la universidad que supervisa la práctica profesional del estudiante.

| Campo | Descripción |
|-------|-------------|
| Selección | Lista de tutores activos |
| Teléfono | Se autocompleta al seleccionar |

### 7.2 Tutor Metodológico

Es el tutor que maneja la parte metodológica/académica.

| Campo | Descripción |
|-------|-------------|
| Selección | Lista de tutores activos |
| Teléfono | Se autocompleta al seleccionar |

---

## 8. Asignación de Institución

### 8.1 Institución Receptora

Empresa o institución donde el estudiante realizará su práctica.

| Campo | Descripción |
|-------|-------------|
| Selección | Lista de instituciones activas |
| Dirección | Se autocompleta |
| Teléfono | Se autocompleta |

### 8.2 Responsable Institucional

Persona de contacto en la institución receptora.

| Campo | Descripción |
|-------|-------------|
| Selección | Responsables de la institución seleccionada |
| Teléfono | Se autocompleta |

---

## 9. Acciones

### 9.1 Acciones por Registro

| Acción | Icono | Descripción |
|--------|-------|-------------|
| Ver | 👁️ | Ver detalles completos |
| Editar | ✏️ | Modificar datos de inscripción |
| Ver Carta | 📄 | Ver/Cargar carta de aceptación |
| Activar/Desactivar | 🔄 | Cambiar estado |
| Eliminar | 🗑️ | Eliminar permanentemente |

---

## 10. Tipos de Datos

### 10.1 Enrollment

```typescript
interface Enrollment {
  enrollmentId: string;
  
  // Datos del Estudiante
  identificationPrefix: "V" | "E";
  identificationNumber: string;
  studentName: string;
  careerName?: string;
  
  // Tutor Académico
  academicTutorId: string;
  academicTutorName?: string;
  academicTutorPhone?: string;
  
  // Tutor Metodológico
  methodologicalTutorId: string;
  methodologicalTutorName?: string;
  methodologicalTutorPhone?: string;
  
  // Institución
  institutionId: string;
  institutionName?: string;
  institutionAddress?: string;
  institutionPhone?: string;
  
  // Responsable Institucional
  institutionResponsibleId: string;
  institutionResponsibleName?: string;
  institutionResponsiblePhone?: string;
  
  // Datos Adicionales
  region?: string;
  nucleus?: string;
  extension?: string;
  institutionType?: string;
  
  // Práctica
  practiceType: string;
  period: string;
  enrollmentCode?: string;
  observation?: string;
  
  // Metadatos
  enrollmentDate: Date;
  status: boolean;
}
```

---

## 11. Obtención de Datos

### 11.1 Hook

```typescript
const {
  enrollments,
  status,
  loadingAction,
  error,
  addEnrollment,
  editEnrollment,
  toggleStatus,
  bulkRemoveEnrollments,
  bulkRestoreEnrollments,
} = useEnrollment();
```

### 11.2 Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/enrollments` | Obtener inscripciones |
| POST | `/api/enrollments` | Crear inscripción |
| PUT | `/api/enrollments/:id` | Actualizar inscripción |
| DELETE | `/api/enrollments/:id` | Eliminar inscripción |

---

## 12. Integraciones con Otros Módulos

El módulo de Inscripción se integra con:

| Módulo | Integración |
|--------|-------------|
| Pre-Inscripción | Importar datos del estudiante |
| Tutores | Selección de tutor académico y metodológico |
| Instituciones | Selección de institución y responsable |
| Carreras | Datos del estudiante |
| Períodos | Período académico |

---

## 13. Casos Edge

| Caso | Comportamiento |
|------|----------------|
| Pre-inscripción ya convertida | No permite crear nueva inscripción |
| Tutor no disponible | No aparece en lista de selección |
| Institución sin responsables | Warning, debe crear responsable primero |
| Estudiante sin pre-inscripción | Permite registro manual |
| Inscripción con seguimiento activo | No permite eliminar |

---

## 14. Flujo Completo de Práctica Profesional

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FLUJO DE PRÁCTICA PROFESIONAL                       │
└─────────────────────────────────────────────────────────────────────────────┘

   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
   │ PRE-         │     │ INSCRIPCIÓN  │     │ SEGUIMIENTO  │
   │ INSCRIPCIÓN  │────▶│              │────▶│              │
   │              │     │ (Este módulo) │     │              │
   └──────────────┘     └──────────────┘     └──────────────┘
                                                        │
   ┌──────────────┐     ┌──────────────┐              │
   │ CULMINACIÓN  │◀────│ EVALUACIONES │◀─────────────┘
   │              │     │              │
   └──────────────┘     └──────────────┘
```

---

## 15. Archivos Relacionados

### Frontend

| Archivo | Descripción |
|---------|-------------|
| `src/pages/Enrollment/Enrollment.tsx` | Página principal |
| `src/features/enrollment/components/EnrollmentTable.tsx` | Tabla de inscripciones |
| `src/features/enrollment/components/EnrollmentModal.tsx` | Modal de creación |
| `src/features/enrollment/components/EnrollmentViewModal.tsx` | Modal de visualización |
| `src/features/enrollment/hooks/useEnrollment.tsx` | Hook de lógica |
| `src/features/enrollment/types/index.ts` | Tipos TypeScript |

### Backend

| Archivo | Descripción |
|---------|-------------|
| `backend/src/routes/enrollment.routes.ts` | Rutas de inscripción |
| `backend/src/controllers/enrollment.controller.ts` | Controlador |

---

## 16. Siguiente Módulo

El módulo "Prácticas Profesionales":

| # | Módulo | Ruta |
|---|--------|------|
| 07a | Pre-Inscripción | `/pre-enrollment` |
| 07b | Inscripción | `/enrollment` (actual) |
| 07c | Seguimiento | `/tracking` |
| 07d | Evaluaciones | `/evaluations` |
| 07e | Culminación | `/culmination` |
