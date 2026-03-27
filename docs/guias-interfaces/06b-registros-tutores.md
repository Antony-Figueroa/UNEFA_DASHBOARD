# Guía de Interfaz: Registros > Tutores

## 1. Descripción General

El módulo de **Tutores** permite gestionar el registro de tutores académicos de la institución. Es parte del módulo "Registros" en el sidebar y permite realizar operaciones CRUD sobre la entidad tutor.

### Propósito

- Registrar nuevos tutores académicos
- Editar información de tutores existentes
- Gestionar el estado de tutores (activo/inactivo)
- Asignar tutores a carreras específicas
- Visualizar información detallada de cada tutor
- Generar reportes PDF

### Ruta

```
/tutors
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
│  GESTIÓN DE TUTORES                                                           │
│  Administra los registros de tutores académicos registrados en el sistema      │
│                                                                                 │
│  ┌─────────────────────────────────────┐ ┌──────────────────────────────┐   │
│  │ [Reporte PDF]  [+ Nuevo Tutor]      │ │                              │   │
│  └─────────────────────────────────────┘ └──────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  [Activos] [Inactivos]                                                  │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                         │   │
│  │  #  | Cédula   | Nombres        | Apellidos     | Profesión   | E   │   │
│  │  ─────────────────────────────────────────────────────────────────────│   │
│  │  1  | V12345678| Dr. Juan      | García        | Ing. Sis.   | ✓   │   │
│  │  2  | V87654321| Dra. María    | López         | Medicina    | ✓   │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Componentes del Módulo

### 3.1 Header

```
GESTIÓN DE TUTORES
Administra los registros de tutores académicos registrados en el sistema
```

### 3.2 Botones de Acción

| Botón | Icono | Acción |
|-------|-------|--------|
| Reporte PDF | 📥 | Genera reporte PDF |
| Nuevo Tutor | ➕ | Abre modal de registro |

### 3.3 Pestañas

```
[Activos] [Inactivos]
```

- **Activos**: Tutores con `status = true`
- **Inactivos**: Tutores con `status = false`

---

## 4. Tabla de Tutores

### 4.1 Columnas

| Columna | Descripción | Ordenable |
|---------|-------------|-----------|
| # | Número de fila | ❌ |
| Cédula | Número de identificación | ✅ |
| Nombres | Nombres completos | ✅ |
| Apellidos | Apellidos completos | ✅ |
| Profesión | Profesión del tutor | ✅ |
| Estado | Estatus actual | ✅ |
| Acciones | Menú de acciones | ❌ |

### 4.2 Estados

| Status | Label | Color |
|--------|-------|-------|
| true | Activo | Verde |
| false | Inactivo | Gris |

---

## 5. Modal de Tutor

### 5.1 Secciones del Formulario

El formulario de tutor está dividido en 3 secciones:

#### Sección 1: Datos de Identificación

| Campo | Tipo | Required | Validaciones |
|-------|------|----------|--------------|
| Prefijo | select | ✅ Sí | V (Venezolano) o E (Extranjero) |
| Número de Cédula | text | ✅ Sí | 8 dígitos, único en el sistema |

#### Sección 2: Datos Personales

| Campo | Tipo | Required | Validaciones |
|-------|------|----------|--------------|
| Primer Nombre | text | ✅ Sí | Solo letras |
| Segundo Nombre | text | ❌ No | Solo letras |
| Primer Apellido | text | ✅ Sí | Solo letras |
| Segundo Apellido | text | ❌ No | Solo letras |
| Sexo | select | ✅ Sí | FEMENINO / MASCULINO |
| Teléfono | text | ✅ Sí | Formato: 0412-1234567 |
| Correo Electrónico | text | ✅ Sí | Formato email válido |

#### Sección 3: Datos Profesionales

| Campo | Tipo | Required | Validaciones |
|-------|------|----------|--------------|
| Profesión | text | ✅ Sí | Profesión del tutor |
| Título | text | ✅ Sí | Título académico |
| Condición | select | ✅ Sí | ORDINARIO / CONTRATADO |
| Dedicación | text | ✅ Sí | Dedicación horaria |
| Categoría | text | ✅ Sí | Categoría docente |
| Carreras Asignadas | multi-select | ✅ Sí | Al menos una carrera |

### 5.2 UI del Modal

```
┌─────────────────────────────────────────────────────────────────────────┐
│  REGISTRAR NUEVO TUTOR                                                  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ DATOS DE IDENTIFICACIÓN                                         │   │
│  │                                                                 │   │
│  │  Prefijo *         Número de Cédula *                          │   │
│  │  ┌──────────┐     ┌──────────────────────┐                    │   │
│  │  │ V       ▼│     │ V00.000.000          │                    │   │
│  │  └──────────┘     └──────────────────────┘                    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ DATOS PERSONALES                                                │   │
│  │                                                                 │   │
│  │  Primer Nombre *    Segundo Nombre                             │   │
│  │  ┌──────────────┐  ┌──────────────┐                          │   │
│  │  │ Juan          │  │ Pedro        │                          │   │
│  │  └──────────────┘  └──────────────┘                          │   │
│  │                                                                 │   │
│  │  Primer Apellido *  Segundo Apellido                          │   │
│  │  ┌──────────────┐  ┌──────────────┐                          │   │
│  │  │ García       │  │ López        │                          │   │
│  │  └──────────────┘  └──────────────┘                          │   │
│  │                                                                 │   │
│  │  Sexo *            Teléfono *        Correo *                 │   │
│  │  ┌──────────┐     ┌──────────────┐  ┌──────────────────┐    │   │
│  │  │ MASCUL..▼│     │ 0412-1234567 │  │ juan@tutores.edu │    │   │
│  │  └──────────┘     └──────────────┘  └──────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ DATOS PROFESIONALES                                             │   │
│  │                                                                 │   │
│  │  Profesión *        Título *                                    │   │
│  │  ┌──────────────┐  ┌──────────────┐                          │   │
│  │  │ Ingeniero    │  │ MSc.         │                          │   │
│  │  └──────────────┘  └──────────────┘                          │   │
│  │                                                                 │   │
│  │  Condición *      Dedicación *       Categoría *              │   │
│  │  ┌──────────┐     ┌──────────────┐  ┌──────────────┐       │   │
│  │  │ ORDINAR..▼│     │ Tiempo Compl..│  │ Instructor   │       │   │
│  │  └──────────┘     └──────────────┘  └──────────────┘       │   │
│  │                                                                 │   │
│  │  Carreras Asignadas *                                           │   │
│  │  ┌────────────────────────────────────────────────────────┐    │   │
│  │  │ ☑ Ingeniería de Sistemas                               │    │   │
│  │  │ ☑ Ingeniería Civil                                     │    │   │
│  │  │ ☐ Ingeniería Eléctrica                                 │    │   │
│  │  └────────────────────────────────────────────────────────┘    │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  [Cancelar]                                    [Registrar]            │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Validaciones en Cliente

### 6.1 Cédula

```typescript
// Formato visual: V00.000.000
// Validaciones:
- Solo números (8 dígitos)
- Unique en la base de datos
```

### 6.2 Teléfono

```typescript
// Formato visual: 0412-1234567
// Validaciones:
- Solo dígitos (11 caracteres)
- Prefijo válido
```

### 6.3 Email

```typescript
// Validaciones:
- Formato email válido
- Unique en la base de datos
```

---

## 7. Carreras Asignadas

### 7.1 Descripción

Cada tutor puede estar asignado a **una o múltiples carreras**. Esto determina qué estudiantes podrán ser asignados a ese tutor durante su práctica profesional.

### 7.2 UI de Selección

```
Carreras Asignadas *:
┌─────────────────────────────────────────┐
│ ☑ Ingeniería de Sistemas               │
│ ☑ Ingeniería Civil                      │
│ ☐ Ingeniería Eléctrica                  │
│ ☐ Medicina                              │
│ ☐ Derecho                              │
└─────────────────────────────────────────┘
```

---

## 8. Acciones

### 8.1 Acciones por Registro

| Acción | Icono | Descripción |
|--------|-------|-------------|
| Ver | 👁️ | Ver detalles completos |
| Editar | ✏️ | Modificar datos del tutor |
| Activar/Desactivar | 🔄 | Cambiar estado |
| Eliminar | 🗑️ | Eliminar permanentemente |

### 8.2 Restricciones

| Caso | Comportamiento |
|------|----------------|
| Tutor con estudiantes asignados | Warning al intentar eliminar |
| Tutor inactivo | No puede recibir nuevas asignaciones |

---

## 9. Tipos de Datos

### 9.1 Tutor

```typescript
interface Tutor {
  // Identificación
  tutorId: string;
  identificationPrefix: "V" | "E";
  identificationNumber: string;
  
  // Nombres
  firstName: string;
  middleName?: string;
  lastName: string;
  secondLastName?: string;
  
  // Datos Personales
  sex: "FEMENINO" | "MASCULINO";
  phone: string;
  email: string;
  
  // Datos Profesionales
  profession: string;
  titulo: string;
  condition: string;
  dedication: string;
  category: string;
  
  // Relaciones
  carreras: string[];           // IDs de carreras asignadas
  practiceTypes?: string[];     // Tipos de práctica asignados
  
  // Metadatos
  registrationDate: Date;
  status: boolean;
  isInUse?: boolean;
}
```

### 9.2 CreateTutorPayload

```typescript
type CreateTutorPayload = Omit<Tutor, 'tutorId' | 'registrationDate' | 'status' | 'isInUse'>;
```

---

## 10. Obtención de Datos

### 10.1 Hook

```typescript
const {
  tutors,
  status,
  loadingAction,
  error,
  addTutor,
  editTutor,
  toggleStatus,
  bulkRemoveTutors,
  bulkRestoreTutors,
} = useTutors();
```

### 10.2 Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/tutors` | Obtener todos los tutores |
| POST | `/api/tutors` | Crear tutor |
| PUT | `/api/tutors/:id` | Actualizar tutor |
| DELETE | `/api/tutors/:id` | Eliminar tutor |

---

## 11. Listas Dinámicas

El módulo utiliza listas dinámicas:

| Lista | Uso |
|-------|-----|
| Tipo de Práctica | ÚNICA / HOSPITALARIA / COMUNITARIA |
| Condición | ORDINARIO / CONTRATADO |

---

## 12. Reporte PDF

### 12.1 Columnas del PDF

| Columna | Datos |
|---------|-------|
| Cédula | identificationPrefix + identificationNumber |
| Nombre | firstName + lastName |
| Profesión | profession |
| Título | titulo |
| Condición | condition |
| Estado | status |

---

## 13. Casos Edge

| Caso | Comportamiento |
|------|----------------|
| Cédula duplicada | Muestra error |
| Email duplicado | Muestra error |
| Tutor con estudiantes | Warning al eliminar |
| Sin carreras asignadas | Validación rejecta |
| Tutor inactivo | No aparece en asignaciones |

---

## 14. Archivos Relacionados

### Frontend

| Archivo | Descripción |
|---------|-------------|
| `src/pages/Tutors/tutors.tsx` | Página principal |
| `src/features/tutors/components/TutorTable.tsx` | Tabla de tutores |
| `src/features/tutors/components/TutorModal.tsx` | Modal de creación/edición |
| `src/features/tutors/components/TutorViewModal.tsx` | Modal de visualización |
| `src/features/tutors/hooks/useTutors.tsx` | Hook de lógica |
| `src/features/tutors/types/index.tsx` | Tipos TypeScript |

### Backend

| Archivo | Descripción |
|---------|-------------|
| `backend/src/routes/tutors.routes.ts` | Rutas de tutores |
| `backend/src/controllers/tutors.controller.ts` | Controlador |

---

## 15. Siguiente Módulo

El módulo "Registros" tiene 3 submódulos:

| # | Módulo | Ruta |
|---|--------|------|
| 06a | Estudiantes | `/students` |
| 06b | Tutores | `/tutors` (actual) |
| 06c | Instituciones | `/institutions` |
