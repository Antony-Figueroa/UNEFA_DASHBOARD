# Guía de Interfaz: Gestión de Carreras y Tipos de Prácticas

## 1. Descripción General

El módulo de **Carreras** permite administrar las ofertas académicas de la institución. Este módulo tiene dos secciones principales:

1. **Carreras**: Gestión de carreras universitarias
2. **Tipos de Prácticas**: Gestión de tipos de prácticas profesionales

### Propósito

- Crear, editar y eliminar carreras universitarias
- Configurar parámetros de aprobación (nota mínima)
- Gestionar tipos de prácticas profesionales
- Asociar tipos de prácticas a cada carrera

### Ruta

```
/careers
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
│  GESTIÓN DE CARRERAS                                                           │
│  Configura las ofertas académicas y parámetros de aprobación                   │
│                                                                                 │
│  ┌─────────────────────────────────────┐ ┌──────────────────────────────┐   │
│  │ [Reporte PDF]  [+ Nueva Carrera]   │ │                              │   │
│  └─────────────────────────────────────┘ └──────────────────────────────┘   │
│                                                                                 │
│  [Carreras] [Tipos de Prácticas]          (Tabs principales)                  │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  [Activas] [Inactivas]                                                  │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                         │   │
│  │  Código | Carrera        | Acrónimo | Tipo    | Nota Mín. | Estado    │   │
│  │  ─────────────────────────────────────────────────────────────────────│   │
│  │  ING-SIS| Ingeniería de  |  ISO     | LARGA  |   10      | [Activo]  │   │
│  │          Sistemas                                                         │   │
│  │  MED    | Medicina        |  MED     | LARGA  |   10      | [Activo]  │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Secciones del Módulo

### 3.1 Pestañas Principales

```
[Carreras] [Tipos de Prácticas]
```

- **Carreras**: Gestión de carreras universitarias
- **Tipos de Prácticas**: Gestión de tipos de pasantía

### 3.2 Pestañas Secundarias

```
[Activas] [Inactivas]
```

- **Activas**: Muestra registros con `status = true`
- **Inactivas**: Muestra registros con `status = false`

---

## 4. Sección: Carreras

### 4.1 Tabla de Carreras

#### Columnas

| Columna | Descripción | Ordenable |
|---------|-------------|-----------|
| Código | Código académico de la carrera | ✅ |
| Carrera | Nombre completo | ✅ |
| Acrónimo | Siglas | ✅ |
| Tipo | CORTA/LARGA | ✅ |
| Nota Mín. | Nota mínima aprobatoria | ✅ |
| Estado | Activo/Inactivo | ✅ |
| Acciones | Menú de acciones | ❌ |

### 4.2 Tipos de Carrera

| Tipo | Descripción |
|------|-------------|
| CORTA | Carreras técnicas (2-3 años) |
| LARGA | Ingenierías y licenciaturas (4-5+ años) |

### 4.3 Estados

| Status | Label | Color |
|--------|-------|-------|
| true/1 | Activo | Verde |
| false/0 | Inactivo | Gris |

---

## 5. Modal de Carrera

### 5.1 Campos del Formulario

| Campo | Tipo | Required | Validaciones |
|-------|------|----------|--------------|
| Código de Carrera | text | ✅ Sí | Único, formato: XXX-XXX |
| Nombre de Carrera | text | ✅ Sí | Nombre completo |
| Acrónimo | text | ✅ Sí | Siglas (máx 10 chars) |
| Tipo de Carrera | select | ✅ Sí | CORTA o LARGA |
| Nota Mínima | number | ✅ Sí | 1-20 |
| Tipos de Práctica | multi-select | ✅ Sí | Al menos 1 |

### 5.2 UI del Modal

```
┌─────────────────────────────────────────────────┐
│  CREAR NUEVA CARRERA                           │
│                                                 │
│  Código de Carrera *                           │
│  ┌─────────────────────────────────────────┐   │
│  │ ING-SIS                                  │   │
│  └─────────────────────────────────────────┘   │
│  (Formato: XXX-XXX)                            │
│                                                 │
│  Nombre de Carrera *                           │
│  ┌─────────────────────────────────────────┐   │
│  │ Ingeniería de Sistemas                  │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Acrónimo *                                    │
│  ┌─────────────────────────────────────────┐   │
│  │ ISO                                      │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Tipo de Carrera *                             │
│  ┌─────────────────────────────────────────┐   │
│  │ Seleccione...                          ▼│   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Nota Mínima Aprobatoria *                      │
│  ┌─────────────────────────────────────────┐   │
│  │ 10                                       │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Tipos de Práctica Permitidos *                 │
│  ┌─────────────────────────────────────────┐   │
│  │ ☑ Práctica I                            │   │
│  │ ☑ Práctica II                           │   │
│  │ ☐ Práctica III                          │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  [+ Agregar Nuevo Tipo]                        │
│                                                 │
│  [Cancelar]              [Guardar]            │
└─────────────────────────────────────────────────┘
```

### 5.3 Validaciones

```typescript
// Schema Zod
careerCode: z.string()
  .min(1, "El código es requerido")
  .regex(/^[A-Z]{3}-[A-Z]{3}$/, "Formato: XXX-XXX"),

careerName: z.string()
  .min(1, "El nombre es requerido")
  .max(200, "Máximo 200 caracteres"),

careerAbbreviation: z.string()
  .min(1, "El acrónimo es requerido")
  .max(10, "Máximo 10 caracteres"),

minimumGrade: z.number()
  .min(1, "Mínimo 1")
  .max(20, "Máximo 20"),

careerType: z.enum(['CORTA', 'LARGA']),

internshipTypeIds: z.array(z.string())
  .min(1, "Seleccione al menos un tipo de práctica")
```

---

## 6. Sección: Tipos de Prácticas

### 6.1 Descripción

Los **Tipos de Prácticas** definen los diferentes tipos de pasantías que pueden realizar los estudiantes según su carrera.

### 6.2 Tabla de Tipos de Prácticas

#### Columnas

| Columna | Descripción |
|---------|-------------|
| Nombre | Nombre del tipo de práctica |
| Prioridad | Orden de prioridad |
| Estado | Activo/Inactivo |

### 6.3 Modal de Tipo de Práctica

#### Campos

| Campo | Tipo | Required |
|-------|------|----------|
| Nombre | text | ✅ Sí |
| Prioridad | number | ✅ Sí |

---

## 7. Acciones

### 7.1 Acciones por Registro

| Acción | Icono | Descripción |
|--------|-------|-------------|
| Editar | ✏️ | Modificar datos |
| Ver | 👁️ | Ver detalles completos |
| Activar/Desactivar | 🔄 | Cambiar estado |
| Eliminar | 🗑️ | Eliminar permanentemente |

### 7.2 Acciones Masivas

| Acción | Descripción |
|--------|-------------|
| Seleccionar múltiples | Checkboxes en cada fila |
| Eliminar seleccionados | Enviar a inactivos |
| Restaurar seleccionados | Reactivar |

---

## 8. Confirmaciones

### 8.1 Desactivar Carrera

```
┌─────────────────────────────────────────────┐
│  ⚠️ Confirmar Desactivación                 │
│                                             │
│  ¿Estás seguro de que deseas desactivar    │
│  la carrera "Ingeniería de Sistemas"?     │
│                                             │
│  [Cancelar]        [Desactivar]           │
└─────────────────────────────────────────────┘
```

### 8.2 Activar Carrera

```
┌─────────────────────────────────────────────┐
│  ✅ Confirmar Activación                     │
│                                             │
│  ¿Estás seguro de que deseas activar       │
│  la carrera "Ingeniería de Sistemas"?     │
│                                             │
│  [Cancelar]        [Activar]               │
└─────────────────────────────────────────────┘
```

### 8.3 Eliminar Carrera (Permanente)

```
┌─────────────────────────────────────────────┐
│  ⚠️ Eliminar Carrera Permanentemente        │
│                                             │
│  ¿Estás seguro de que deseas eliminar      │
│  permanentemente la carrera "Medicina"?    │
│                                             │
│  Esta acción no se puede deshacer.         │
│                                             │
│  [Cancelar]        [Confirmar]             │
└─────────────────────────────────────────────┘
```

---

## 9. Tipos de Datos

### 9.1 Carrera (Career)

```typescript
interface Career {
  careerId: string | number;      // ID único
  careerCode: string;             // Código (ej: "ING-SIS")
  careerName: string;             // Nombre completo
  careerAbbreviation: string;      // Acrónimo (ej: "ISO")
  minimumGrade: number;           // Nota mínima (1-20)
  careerType: 'CORTA' | 'LARGA'; // Tipo de carrera
  internshipTypeIds?: string[];   // Tipos de práctica permitidos
  internshipPriorities?: number[];// Prioridades
  creationDate: Date;             // Fecha de creación
  status: boolean | number;       // Estado
  isInUse?: boolean;              // Si está en uso
  hasPendingEvaluations?: boolean; // Si tiene evaluaciones pendientes
}
```

### 9.2 CreateCareerPayload

```typescript
type CreateCareerPayload = Omit<Career, 'careerId' | 'creationDate' | 'isInUse' | 'hasPendingEvaluations'>;
```

### 9.3 InternshipType

```typescript
interface InternshipType {
  id: number;              // ID único
  name: string;            // Nombre
  priority: number;        // Prioridad
  status: boolean;         // Estado
  creationDate: Date;      // Fecha de creación
}
```

---

## 10. Obtención de Datos

### 10.1 Hooks

```typescript
// Para Carreras
const {
  careers,
  filteredCareers,
  status,
  addCareer,
  editCareer,
  removeCareer,
  toggleCareerStatus,
  bulkRemoveCareers,
  bulkRestoreCareers,
} = useCareers();

// Para Tipos de Prácticas
const {
  internshipTypes,
  options: internshipOptions,
  activeOptions: activeInternshipOptions,
  addInternshipType,
  editInternshipType,
  toggleStatus: toggleTypeStatus,
  bulkRemove: bulkRemoveTypes,
  bulkRestore: bulkRestoreTypes,
} = useInternshipTypes();
```

### 10.2 Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/careers` | Obtener todas las carreras |
| POST | `/api/careers` | Crear carrera |
| PUT | `/api/careers/:id` | Actualizar carrera |
| DELETE | `/api/careers/:id` | Eliminar carrera |
| GET | `/api/internship-types` | Obtener tipos de prácticas |
| POST | `/api/internship-types` | Crear tipo de práctica |
| PUT | `/api/internship-types/:id` | Actualizar tipo |

---

## 11. Relación Carreras ↔ Tipos de Prácticas

### 11.1 Asociación

Cada carrera puede tener **múltiples tipos de práctica** asociados:

```
Carrera: Ingeniería de Sistemas
├── Tipo: Práctica I (Obligatoria)
├── Tipo: Práctica II (Obligatoria)
└── Tipo: Práctica III (Opcional)
```

### 11.2 UI de Selección

```
Tipos de Práctica Permitidos *:
┌─────────────────────────────────────────┐
│ ☑ Práctica I                            │
│ ☑ Práctica II                           │
│ ☐ Práctica III                          │
└─────────────────────────────────────────┘
```

---

## 12. Reporte PDF

### 12.1 Columnas del PDF

| Columna | Datos |
|---------|-------|
| Código | `careerCode` |
| Carrera | `careerName` |
| Acrónimo | `careerAbbreviation` |
| Tipo | `careerType` |

---

## 13. Casos Edge

| Caso | Comportamiento |
|------|----------------|
| Código duplicado | Validación rejecta creación |
| Carrera en uso | Warning al eliminar, no permite permanent delete |
| Sin tipos de práctica | Validación rejecta guardado |
| Nota mínima > 20 | Validación rejecta |
| Carrera culminada | No permite edición |

---

## 14. Archivos Relacionados

### Frontend

| Archivo | Descripción |
|---------|-------------|
| `src/pages/Careers/careers.tsx` | Página principal |
| `src/features/careers/components/CareerTable.tsx` | Tabla de carreras |
| `src/features/careers/components/CareerModal.tsx` | Modal de creación/edición |
| `src/features/careers/components/CareerViewModal.tsx` | Modal de visualización |
| `src/features/careers/hooks/useCareers.tsx` | Hook de carreras |
| `src/features/careers/types/index.tsx` | Tipos de carreras |
| `src/features/internship-types/components/InternshipTypeTable.tsx` | Tabla de tipos |
| `src/features/internship-types/components/InternshipTypeModal.tsx` | Modal de tipos |
| `src/features/internship-types/hooks/useInternshipTypes.tsx` | Hook de tipos |

### Backend

| Archivo | Descripción |
|---------|-------------|
| `backend/src/routes/careers.routes.ts` | Rutas de carreras |
| `backend/src/routes/internship-types.routes.ts` | Rutas de tipos |

---

## 15. Siguiente Módulo

Este módulo pertenece a **Gestión**. El siguiente en el sidebar es:

| # | Módulo | Ruta |
|---|--------|------|
| 06 | Registros > Estudiantes | `/students` |
