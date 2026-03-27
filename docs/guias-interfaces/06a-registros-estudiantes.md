# Guía de Interfaz: Registros > Estudiantes

## 1. Descripción General

El módulo de **Estudiantes** permite gestionar el registro de estudiantes de la institución. Es parte del módulo "Registros" en el sidebar y permite realizar operaciones CRUD sobre la entidad estudiante.

### Propósito

- Registrar nuevos estudiantes en el sistema
- Editar información de estudiantes existentes
- Gestionar el estado de estudiantes (activo/inactivo)
- Visualizar información detallada de cada estudiante
- Generar reportes PDF y Excel

### Ruta

```
/students
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
│  GESTIÓN DE ESTUDIANTES                                                        │
│  Administra los registros de estudiantes registrados en el sistema             │
│                                                                                 │
│  ┌─────────────────────────────────────┐ ┌──────────────────────────────┐   │
│  │ [Export Excel] [Reporte PDF] [+ Nuevo Estudiante]                    │   │
│  └─────────────────────────────────────┘ └──────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  [Activos] [Inactivos]                                                  │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                         │   │
│  │  #  | Cédula   | Nombres        | Apellidos     | Carrera     | E   │   │
│  │  ─────────────────────────────────────────────────────────────────────│   │
│  │  1  | V12345678| Juan Pérez     | García        | Ing. Sis.  | ✓   │   │
│  │  2  | V87654321| María López    | Pérez         | Medicina    | ✓   │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Componentes del Módulo

### 3.1 Header

```
GESTIÓN DE ESTUDIANTES
Administra los registros de estudiantes registrados en el sistema
```

### 3.2 Botones de Acción

| Botón | Icono | Acción |
|-------|-------|--------|
| Export Excel | 📊 | Exporta datos a Excel |
| Reporte PDF | 📥 | Genera reporte PDF |
| Nuevo Estudiante | ➕ | Abre modal de registro |

### 3.3 Pestañas

```
[Activos] [Inactivos]
```

- **Activos**: Estudiantes con `status = true`
- **Inactivos**: Estudiantes con `status = false`

---

## 4. Tabla de Estudiantes

### 4.1 Columnas

| Columna | Descripción | Ordenable |
|---------|-------------|-----------|
| # | Número de fila | ❌ |
| Cédula | Número de identificación | ✅ |
| Nombres | Nombres completos | ✅ |
| Apellidos | Apellidos completos | ✅ |
| Carrera | Carrera asignada | ✅ |
| Estado | Estatus actual | ✅ |
| Acciones | Menú de acciones | ❌ |

### 4.2 Estados

| Status | Label | Color |
|--------|-------|-------|
| true | Activo | Verde |
| false | Inactivo | Gris |

---

## 5. Modal de Estudiante

### 5.1 Secciones del Formulario

El formulario de estudiante está dividido en 4 secciones:

#### Sección 1: Datos de Identificación

| Campo | Tipo | Required | Validaciones |
|-------|------|----------|--------------|
| Prefijo | select | ✅ Sí | V (Venezolano) o E (Extranjero) |
| Número de Cédula | text | ✅ Sí | 8 dígitos, único en el sistema |
| Verificar Disponibilidad | button | - | Verifica si la cédula ya existe |

#### Sección 2: Nombres y Apellidos

| Campo | Tipo | Required | Validaciones |
|-------|------|----------|--------------|
| Primer Nombre | text | ✅ Sí | Solo letras, máximo 50 caracteres |
| Segundo Nombre | text | ❌ No | Solo letras |
| Primer Apellido | text | ✅ Sí | Solo letras |
| Segundo Apellido | text | ❌ No | Solo letras |

#### Sección 3: Datos Personales

| Campo | Tipo | Required | Validaciones |
|-------|------|----------|--------------|
| Sexo | select | ✅ Sí | FEMENINO / MASCULINO / OTRO |
| Fecha de Nacimiento | date | ✅ Sí | No puede ser futura |
| Estado Civil | select | ✅ Sí | SOLTERO / CASADO / DIVORCIADO / VIUDO |
| Teléfono | text | ✅ Sí | Formato: 0412-1234567 |
| Correo Electrónico | text | ✅ Sí | Formato email válido, único |
| Dirección | textarea | ✅ Sí | Dirección de habitación |

#### Sección 4: Datos Académicos

| Campo | Tipo | Required | Validaciones |
|-------|------|----------|--------------|
| Carrera | select | ✅ Sí | Debe existir en el sistema |
| Semestre | text | ✅ Sí | Formato: 01-12 |
| Sección | text | ✅ Sí | Número de sección |
| Régimen | select | ✅ Sí | DIURNO / NOCTURNO / MIXTO |
| Tipo de Estudiante | select | ✅ Sí | CIVIL / MILITAR |
| Rango Militar | select | Condicional | Si tipo = MILITAR |
| ¿Trabaja? | select | ✅ Sí | SI / NO |
| Empresa | text | Condicional | Si trabaja = SI |

### 5.2 UI del Modal

```
┌─────────────────────────────────────────────────────────────────────────┐
│  REGISTRAR NUEVO ESTUDIANTE                                           │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ DATOS DE IDENTIFICACIÓN                                         │   │
│  │                                                                 │   │
│  │  Prefijo *         Número de Cédula *                          │   │
│  │  ┌──────────┐     ┌──────────────────────┐                    │   │
│  │  │ V       ▼│     │ V00.000.000          │                    │   │
│  │  └──────────┘     └──────────────────────┘                    │   │
│  │                                        [Verificar Disponibilidad]│   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ NOMBRES Y APELLIDOS                                            │   │
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
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ DATOS PERSONALES                                                │   │
│  │                                                                 │   │
│  │  Sexo *            Fecha de Nacimiento *  Estado Civil *     │   │
│  │  ┌──────────┐     ┌──────────────┐      ┌──────────┐        │   │
│  │  │ Selecc..▼│     │ 📅 15/03/2000│      │ Selecc..▼│        │   │
│  │  └──────────┘     └──────────────┘      └──────────┘        │   │
│  │                                                                 │   │
│  │  Teléfono *        Correo Electrónico *                       │   │
│  │  ┌──────────────┐  ┌────────────────────────────────┐        │   │
│  │  │ 0412-1234567 │  │ juan@correo.com                │        │   │
│  │  └──────────────┘  └────────────────────────────────┘        │   │
│  │                                                                 │   │
│  │  Dirección *                                                     │   │
│  │  ┌────────────────────────────────────────────────────────┐    │   │
│  │  │ Calle 123, Ciudad, Estado                             │    │   │
│  │  └────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ DATOS ACADÉMICOS                                                │   │
│  │                                                                 │   │
│  │  Carrera *         Semestre *        Sección *               │   │
│  │  ┌──────────┐     ┌──────────┐      ┌──────────┐           │   │
│  │  │ Selecc..▼│     │ 08       │      │ 236      │           │   │
│  │  └──────────┘     └──────────┘      └──────────┘           │   │
│  │                                                                 │   │
│  │  Régimen *         Tipo de Estudiante *                      │   │
│  │  ┌──────────┐     ┌──────────┐                             │   │
│  │  │ DIURNO ▼ │     │ CIVIL   ▼│                             │   │
│  │  └──────────┘     └──────────┘                             │   │
│  │                                                                 │   │
│  │  ¿Trabaja? *                                                  │   │
│  │  ┌──────────┐                                                 │   │
│  │  │ NO      ▼│                                                 │   │
│  │  └──────────┘                                                 │   │
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
// Envío a API: V12345678

// Validaciones:
- Solo números (8 dígitos)
- Unique en la base de datos
- Verificación de disponibilidad en tiempo real
```

### 6.2 Teléfono

```typescript
// Formato visual: 0412-1234567
// Validaciones:
- Solo dígitos (11 caracteres)
- Prefijo válido (0412, 0414, 0416, 0424, 0426, 0212, etc.)
```

### 6.3 Email

```typescript
// Validaciones:
- Formato email válido
- Unique en la base de datos
```

### 6.4 Nombres y Apellidos

```typescript
// Validaciones:
- Solo letras y espacios
- Máximo 50 caracteres
- Mayúsculas automáticas
```

---

## 7. Búsqueda y Filtros

### 7.1 Búsqueda Global

Campo de búsqueda que filtra por:
- Número de cédula
- Nombres
- Apellidos

### 7.2 Filtros Adicionales

| Filtro | Opciones |
|--------|----------|
| Carrera | Todas las activas |
| Régimen | DIURNO / NOCTURNO / MIXTO |
| Estado | ACTIVO / INACTIVO |

---

## 8. Acciones

### 8.1 Acciones por Registro

| Acción | Icono | Descripción |
|--------|-------|-------------|
| Ver | 👁️ | Ver detalles completos |
| Editar | ✏️ | Modificar datos del estudiante |
| Activar/Desactivar | 🔄 | Cambiar estado |
| Eliminar | 🗑️ | Eliminar permanentemente |

### 8.2 Verificación de Disponibilidad

Antes de guardar, el sistema verifica:
- ✅ Cédula no esté registrada
- ✅ Email no esté registrado

Si ya existe, muestra los datos del estudiante existente y ofrece opciones:
- Ver estudiante existente
- Editar estudiante existente

---

## 9. Tipos de Datos

### 9.1 Student

```typescript
interface Student {
  // Identificación
  studentId: string;
  identificationPrefix: "V" | "E";
  identificationNumber: string;
  
  // Nombres
  firstName: string;
  middleName?: string;
  lastName: string;
  secondLastName?: string;
  
  // Datos Personales
  sex: "FEMENINO" | "MASCULINO" | "OTRO";
  birthDate: string;        // ISO: YYYY-MM-DD
  civilStatus: "SOLTERO" | "CASADO" | "DIVORCIADO" | "VIUDO";
  phone: string;
  email: string;
  address: string;
  
  // Datos Académicos
  careerId?: string;
  careerName?: string;
  institutionId?: string;
  institutionName?: string;
  semester: string;          // "01" - "12"
  section: string;
  regime: "DIURNO" | "NOCTURNO" | "MIXTO";
  
  // Clasificación
  studentType: "CIVIL" | "MILITAR";
  militaryRank: string;
  works: "SI" | "NO";
  
  // Metadatos
  enrollmentDate: Date;
  status: boolean;
  isInUse?: boolean;
}
```

### 9.2 CreateStudentPayload

```typescript
type CreateStudentPayload = Omit<Student, "studentId" | "enrollmentDate" | "status" | "isInUse">;
```

---

## 10. Obtención de Datos

### 10.1 Hook

```typescript
const {
  students,
  status,
  loadingAction,
  error,
  addStudent,
  editStudent,
  toggleStatus,
  bulkRemoveStudents,
  bulkRestoreStudents,
} = useStudents();
```

### 10.2 Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/students` | Obtener todos los estudiantes |
| POST | `/api/students` | Crear estudiante |
| PUT | `/api/students/:id` | Actualizar estudiante |
| DELETE | `/api/students/:id` | Eliminar estudiante |

---

## 11. Listas Dinámicas

El módulo utiliza listas dinámicas cargadas desde el sistema:

| Lista | Uso |
|-------|-----|
| Nacionalidad | Campo no visible en UI actual |
| Sexo | Selección de sexo |
| PREFIJO | Prefijos telefónicos |
| Registro Civil | Estados civiles |
| Regime/Turno | Régimen de estudio |
| Tipo de estudiante | CIVIL / MILITAR |
| Trabajo | SI / NO |
| Rango Militar | Rangos militares |

---

## 12. Exportación

### 12.1 Export Excel

Genera un archivo Excel con los datos de los estudiantes filtrados.

### 12.2 Reporte PDF

```
┌─────────────────────────────────────────────┐
│  REPORTE DE ESTUDIANTES                     │
│                                             │
│  [Búsqueda...]                             │
│                                             │
│  Filtrar por Carrera:                       │
│  ┌─────────────────────────────────────┐    │
│  │ Seleccione...                      ▼│   │
│  └─────────────────────────────────────┘    │
│                                             │
│  Filtrar Régimen:                           │
│  ┌─────────────────────────────────────┐    │
│  │ Seleccione...                      ▼│   │
│  └─────────────────────────────────────┘    │
│                                             │
│  Vista previa de tabla...                   │
│                                             │
│         [📥 Descargar PDF]                  │
└─────────────────────────────────────────────┘
```

---

## 13. Casos Edge

| Caso | Comportamiento |
|------|----------------|
| Cédula duplicada | Muestra error, sugiere ver estudiante existente |
| Email duplicado | Muestra error |
| Estudiante en uso | Warning al intentar eliminar permanentemente |
| Teléfono inválido | Validación rejecta |
| Fecha de nacimiento futura | Validación rejecta |
| estudiante inactivo | No permite edición desde modal de otros módulos |

---

## 14. Archivos Relacionados

### Frontend

| Archivo | Descripción |
|---------|-------------|
| `src/pages/Students/students.tsx` | Página principal |
| `src/features/students/components/StudentTable.tsx` | Tabla de estudiantes |
| `src/features/students/components/StudentModal.tsx` | Modal de creación/edición |
| `src/features/students/components/StudentViewModal.tsx` | Modal de visualización |
| `src/features/students/hooks/useStudents.tsx` | Hook de lógica de negocio |
| `src/features/students/types/index.tsx` | Tipos TypeScript |
| `src/features/students/services/studentsService.ts` | Servicio API |

### Backend

| Archivo | Descripción |
|---------|-------------|
| `backend/src/routes/students.routes.ts` | Rutas de estudiantes |
| `backend/src/controllers/students.controller.ts` | Controlador |

---

## 15. Siguiente Módulo

El módulo "Registros" tiene 3 submódulos:

| # | Módulo | Ruta |
|---|--------|------|
| 06a | Estudiantes | `/students` (actual) |
| 06b | Tutores | `/tutors` |
| 06c | Instituciones | `/institutions` |
