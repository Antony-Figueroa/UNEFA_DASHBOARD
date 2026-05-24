# Superentidad Persona — Plan de Implementación

> Documento de análisis y planificación para la creación de una entidad `Persona` centralizada que unifique estudiantes, tutores, usuarios y responsables institucionales.

---

## 1. Estado Actual

Actualmente existen **4 entidades "persona" independientes** sin ningún tipo de herencia o composición compartida:

| Entidad | Tabla BD | ID único | Extensión (campos) |
|---------|----------|----------|-------------------|
| `Student` | `t_students` | `STUDENTS_CI` (UNIQUE) | 21 campos |
| `Tutor` | `t_tutors` | `TUTOR_CI` (UNIQUE) | 18 campos |
| `User` | `t_user` | `USER_CI` (UNIQUE) | 12 campos |
| `InstitutionalResponsible` | `t_institution_manager` | `MANAGER_CI` (UNIQUE) | 15 campos |

### 1.1 Campos duplicados entre tablas

| Campo | `t_students` | `t_tutors` | `t_user` | `t_institution_manager` |
|-------|:-----------:|:---------:|:--------:|:----------------------:|
| ID (PK) | `STUDENTS_ID` | `TUTOR_ID` | `USER_ID` | `MANAGER_ID` |
| Cédula (CI) | `STUDENTS_CI` (UQ) | `TUTOR_CI` (UQ) | `USER_CI` (UQ) | `MANAGER_CI` (UQ) |
| Primer nombre | `NAME` | `NAME` | `NAME` | `NAME` |
| Segundo nombre | `SECOND_NAME` | `SECOND_NAME` | `SECOND_NAME` | `SECOND_NAME` |
| Primer apellido | `SURNAME` | `SURNAME` | `SURNAME` | `SURNAME` |
| Segundo apellido | `SECOND_SURNAME` | `SECOND_SURNAME` | `SECOND_SURNAME` | `SECOND_SURNAME` |
| Email | `EMAIL` | `EMAIL` | `EMAIL` | `EMAIL` |
| Teléfono | `CONTACT_PHONE` | `CONTACT_PHONE` | `PHONE_NUMBER` | `CONTACT_PHONE` |
| Género | `GENDER` | `GENDER` | — | — |
| Fecha nacimiento | `BIRTHDATE` | — | — | — |
| Dirección | `ADDRESS` | — | — | — |
| Estado civil | `MARITAL_STATUS` | — | — | — |
| Status | `STATUS` | `STATUS` | `STATUS` | `STATUS` |
| FK a `t_user` | `USER_ID` | `USER_ID` | (PK) | — |

**~80% de los campos se repiten** en las 4 tablas.

### 1.2 Frontend: Tipos TypeScript duplicados

```typescript
// students/types — 17 campos
interface Student {
  studentId: string; identificationPrefix: "V"|"E"; identificationNumber: string;
  firstName: string; middleName?: string; lastName: string; secondLastName?: string;
  sex: "FEMENINO"|"MASCULINO"|"OTRO"; birthDate: string; civilStatus: string;
  phone: string; email: string; address: string;
  studentType: string; militaryRank?: string; works: "SI"|"NO";
  enrollmentDate: Date; status: boolean; isInUse?: boolean;
}

// tutors/types — 16 campos (mismos campos base, distinto nombre)
interface Tutor {
  tutorId: string; identificationPrefix: "V"|"E"; identificationNumber: string;
  firstName: string; middleName?: string; lastName: string; secondLastName?: string;
  sex: "FEMENINO"|"MASCULINO"; phone: string; email: string;
  profession: string; titulo: string; condition: string; dedication: string; category: string;
  registrationDate: Date; status: boolean; carreras: string[]; isInUse?: boolean;
}

// users/types — 10 campos (nombres distintos!)
interface User {
  id: number; userCi: string; name: string; surname: string;
  email: string; role: number; status: number; creationDate: string; isInUse?: boolean;
}

// institutions/types — 15 campos
interface InstitutionalResponsible {
  responsibleId: string; identificationPrefix: string; identificationNumber: string;
  firstName: string; middleName?: string; lastName: string; secondLastName?: string;
  phone: string; email: string; cargo?: string;
  institutions: ResponsibleInstitution[]; status: boolean; registrationDate: Date;
}
```

### 1.3 Backend: Duplicación en controladores

| Patrón duplicado | Presente en |
|-----------------|-------------|
| `handleDbError` con códigos `23502`, `23505`, `PGRST205`, `PGRST116` | Students, Tutors, InstitutionalResponsibles |
| Verificación de CI único | Students (explícita), Users (vía service), Tutors (no verifica), Responsibles (no verifica) |
| Verificación de Email único | Students (explícita), Users (vía service), Tutors (no verifica), Responsibles (no verifica) |
| `mapDBToFrontend` (split de CI, mapeo de nombres) | Students, Tutors (independientes) |
| Auditoría (`auditCreate`, `auditUpdate`, etc.) | Students, Tutors |
| `dbManager.withRetry()` | Todos los controladores |

---

## 2. Solución Propuesta: Nivel 3 — Full con Base de Datos

**Estrategia**: Una sola fila en `t_persons` por cada CI único, con tablas especializadas referenciando mediante FK.

### 2.1 Beneficios

- **Consistencia de datos**: Un cambio de email/teléfono se propaga a todos los roles
- **Reducción de duplicación**: ~40% menos código en controladores
- **Búsqueda unificada**: Una sola tabla para buscar cualquier persona del sistema
- **Validación centralizada**: CI y Email únicos globalmente
- **Extensibilidad**: Nuevos roles (ej: "Coordinador") solo necesitan FK a `t_persons`

---

## 3. Diseño de Base de Datos

### 3.1 Nueva tabla `t_persons`

```sql
CREATE TABLE t_persons (
    PERSON_ID        SERIAL PRIMARY KEY,
    CI               VARCHAR(10) NOT NULL UNIQUE,
    FIRST_NAME       VARCHAR(255) NOT NULL,
    MIDDLE_NAME      VARCHAR(255),
    LAST_NAME        VARCHAR(255) NOT NULL,
    SECOND_LAST_NAME VARCHAR(255),
    EMAIL            VARCHAR(255) NOT NULL,
    PHONE            VARCHAR(15),
    GENDER           VARCHAR(10),
    BIRTHDATE        DATE,
    ADDRESS          VARCHAR(255),
    MARITAL_STATUS   VARCHAR(45),
    STATUS           SMALLINT DEFAULT 1,
    CREATED_AT       TIMESTAMP DEFAULT NOW(),
    UPDATED_AT       TIMESTAMP DEFAULT NOW()
);

-- Nota: CI se almacena con formato "V-XXXXXXXX" (prefijo + número). No se separa.
-- GENDER normaliza a valores "MASCULINO" / "FEMENINO" (ver migración 002).

CREATE INDEX idx_persons_ci ON t_persons(CI);
CREATE INDEX idx_persons_names ON t_persons(FIRST_NAME, LAST_NAME);
CREATE INDEX idx_persons_email ON t_persons(EMAIL);
CREATE INDEX idx_persons_status ON t_persons(STATUS);
```

### 3.2 Modificación de tablas existentes

Cada tabla conserva solo sus campos **especializados** y agrega `PERSON_ID` como FK.

#### `t_students`

| Acción | Detalle |
|--------|---------|
| **Agregar** | `PERSON_ID INTEGER NOT NULL REFERENCES t_persons(PERSON_ID)` |
| **Migrar a t_persons** | `STUDENTS_CI` (→ CI), `NAME`, `SECOND_NAME`, `SURNAME`, `SECOND_SURNAME`, `GENDER`, `BIRTHDATE`, `CONTACT_PHONE` (→ PHONE), `EMAIL`, `ADDRESS`, `MARITAL_STATUS`, `STATUS` |
| **Conservar** | `STUDENTS_ID` (PK), `STUDENT_TYPE`, `MILITARY_RANK`, `EMPLOYMENT`, `REGISTRATION_DATE`, `USER_ID` |
| **Opcional: dropear** | Columnas duplicadas después de migración verificada |

#### `t_tutors`

| Acción | Detalle |
|--------|---------|
| **Agregar** | `PERSON_ID INTEGER NOT NULL REFERENCES t_persons(PERSON_ID)` |
| **Migrar a t_persons** | `TUTOR_CI` (→ CI), `NAME`, `SECOND_NAME`, `SURNAME`, `SECOND_SURNAME`, `CONTACT_PHONE` (→ PHONE), `GENDER`, `EMAIL`, `STATUS` |
| **Conservar** | `TUTOR_ID` (PK), `PROFESSION`, `CONDITION`, `DEDICATION`, `CATEGORY`, `TITULO`, `USER_ID`, `CREATION_DATE` |

#### `t_user`

| Acción | Detalle |
|--------|---------|
| **Agregar** | `PERSON_ID INTEGER NOT NULL REFERENCES t_persons(PERSON_ID)` |
| **Migrar a t_persons** | `USER_CI` (→ CI), `NAME`, `SECOND_NAME`, `SURNAME`, `SECOND_SURNAME`, `EMAIL`, `PHONE_NUMBER` (→ PHONE), `STATUS` |
| **Conservar** | `USER_ID` (PK), `USER` (login), `LOGIN`, `TERMS_CONDITIONS`, `STATUS_SESSION`, `FAILED_ATTEMPTS`, `LOCK_DATE`, `FORCE_PASSWORD_CHANGE`, `CREATION_DATE` |

#### `t_institution_manager`

| Acción | Detalle |
|--------|---------|
| **Agregar** | `PERSON_ID INTEGER NOT NULL REFERENCES t_persons(PERSON_ID)` |
| **Migrar a t_persons** | `MANAGER_CI` (→ CI), `NAME`, `SECOND_NAME`, `SURNAME`, `SECOND_SURNAME`, `CONTACT_PHONE` (→ PHONE), `EMAIL`, `STATUS` |
| **Conservar** | `MANAGER_ID` (PK), `CARGO`, `INSTITUTION_ID`, `CREATION_DATE` |

### 3.3 Estrategia de resolución de conflictos

Cuando un mismo CI existe en múltiples tablas, se aplica la siguiente **jerarquía de prioridad** para resolver datos contradictorios:

1. **`t_user`** — Máxima prioridad (fuente de autenticación)
2. **`t_students`** — Segunda prioridad (datos más completos: incluye birthdate, address)
3. **`t_tutors`** — Tercera prioridad
4. **`t_institution_manager`** — Última prioridad

> **Normalización de GENDER**: `t_students` usa `CHAR(10)` con valores `"M         "` y `"F         "` (padding). `t_tutors` usa `VARCHAR(45)` con `"MASCULINO"` y `"FEMENINO"`. La migración debe convertir:
> ```sql
> CASE 
>   WHEN TRIM(source."GENDER") IN ('M', 'MASCULINO') THEN 'MASCULINO'
>   WHEN TRIM(source."GENDER") IN ('F', 'FEMENINO')  THEN 'FEMENINO'
>   ELSE TRIM(source."GENDER")
> END
> ```
>
> **Caso especial V-15678901**: Un mismo CI está asociado a **dos personas distintas**: Carmen Rosa Paredes Luna (tutor) y Carlos Andrés Mendoza Rojas (manager). La migración priorizará los datos del tutor (jerarquía), registrará un `WARNING` en `t_person_merge_log`, y dejará una nota para revisión manual.

Los conflictos detectados se registran en una tabla de auditoría:

```sql
CREATE TABLE t_person_merge_log (
    LOG_ID         SERIAL PRIMARY KEY,
    CI             VARCHAR(10) NOT NULL,
    SOURCE_TABLE   VARCHAR(50) NOT NULL,
    SOURCE_ID      INTEGER NOT NULL,
    FIELD_NAME     VARCHAR(50) NOT NULL,
    VALUE_USED     TEXT,
    VALUE_OVER     TEXT,
    OVERRIDDEN_FROM VARCHAR(50),
    CREATED_AT     TIMESTAMP DEFAULT NOW()
);
```

### 3.4 Secuencia de migración

```
Migration 001: CREATE TABLE t_persons
       ↓
Migration 002: Migrar datos - INSERT INTO t_persons
               (recolectar CI únicos, resolver conflictos por jerarquía)
       ↓
Migration 003: ALTER TABLE - ADD COLUMN PERSON_ID + FK
               UPDATE t_students SET PERSON_ID = ...
       ↓
Migration 004: (Opcional) DROP colúmnas duplicadas de tablas hijas
```

---

## 4. Backend — Arquitectura

### 4.1 Nuevo servicio compartido: `person.service.ts`

```typescript
// backend/src/services/person.service.ts

export const personService = {
  // CRUD básico
  getPersonById: (personId: number) => Promise<PersonDTO>,
  getPersonByCi: (ci: string) => Promise<PersonDTO | null>,
  searchPersons: (query: string) => Promise<PersonDTO[]>,
  createPerson: (data: CreatePersonDTO) => Promise<PersonDTO>,
  updatePerson: (personId: number, data: UpdatePersonDTO) => Promise<PersonDTO>,

  // Validaciones compartidas
  validateUniqueCi: (ci: string, excludePersonId?: number) => Promise<boolean>,
  validateUniqueEmail: (email: string, excludePersonId?: number) => Promise<boolean>,

  // Utilidades
  handlePersonError: (error: any, context: string) => never,
  mapPersonToFrontend: (row: any) => PersonFrontend,
  splitCi: (ci: string) => { prefix: string, number: string },
  joinCi: (prefix: string, number: string) => string,
}
```

### 4.2 Nuevo controlador y rutas

```typescript
// backend/src/controllers/persons.controller.ts
export const getPersons       // Listado paginado con búsqueda global
export const getPersonById    // Obtener persona con todos sus roles
export const searchPersons    // Búsqueda por CI, nombre, email
export const createPerson     // Crear persona (uso interno)
export const updatePerson     // Actualizar datos personales
export const togglePersonStatus // Activar/desactivar

// backend/src/routes/persons.routes.ts
// GET    /api/persons
// GET    /api/persons/search?q=
// GET    /api/persons/:id
// POST   /api/persons
// PUT    /api/persons/:id
// PATCH  /api/persons/:id/status
```

### 4.3 Refactorización de controladores existentes

Cada controlador existente se refactoriza para:

1. **Delegar campos personales** a `person.service`
2. **Conservar solo lógica de negocio especializada** del rol
3. **Usar `handlePersonError`** en vez de su propio manejo de errores
4. **Usar `splitCi` / `joinCi`** compartido

```
Ejemplo: createStudent (antes vs después)

ANTES (esquemático):
  └─ Validar edad mínima
  └─ Validar formato email
  └─ Verificar CI único en t_students ← duplicado
  └─ Verificar Email único en t_students ← duplicado
  └─ Insertar en t_students (20 campos)
  └─ Mapear respuesta a frontend (split CI, nombres)

DESPUÉS:
  └─ Validar edad mínima
  └─ personService.validateUniqueCi(ci)  ← compartido
  └─ personService.validateUniqueEmail(email)  ← compartido
  └─ personService.createPerson(personData)  ← compartido (obtiene PERSON_ID)
  └─ Insertar en t_students (campos específicos + PERSON_ID)
  └─ personService.mapPersonToFrontend(...)  ← compartido
```

---

## 5. Frontend — Arquitectura

### 5.1 Nueva interfaz base `Persona`

```typescript
// src/features/types/person.ts
export interface Persona {
  personId: string;
  ci: string;                    // "V-29847715" (unificado, con prefijo)
  firstName: string;
  middleName?: string;
  lastName: string;
  secondLastName?: string;
  email: string;
  phone: string;
  gender?: string;
  birthDate?: string;
  address?: string;
  maritalStatus?: string;
  status: boolean;
  registrationDate: Date;
}
```

### 5.2 Refactorización de tipos existentes

```typescript
// students/types/index.tsx
export interface Student extends Persona {
  studentId: string;
  studentType: 'CIVIL' | 'MILITAR';
  militaryRank?: string;
  works: 'SI' | 'NO';
  enrollmentDate: Date;
}

// tutors/types/index.tsx
export interface Tutor extends Persona {
  tutorId: string;
  profession: string;
  titulo: string;
  condition: string;
  dedication: string;
  category: string;
  carreras: string[];
  practiceTypes?: string[];
}

// users/types/index.ts
export interface User extends Persona {
  id: number;
  username: string;
  role: number;
  // ... campos de seguridad
}

// institutions/types/index.tsx
export interface InstitutionalResponsible extends Persona {
  responsibleId: string;
  cargo?: string;
  institutions: ResponsibleInstitution[];
}
```

### 5.3 Nuevo feature `persons/`

```
src/features/persons/
├── types/
│   └── index.tsx              # Tipos específicos del feature
├── components/
│   ├── PersonFormFields.tsx   # Formulario reutilizable de datos personales
│   ├── PersonView.tsx         # Visualización de datos personales
│   ├── PersonTable.tsx        # Tabla de administración de personas
│   └── PersonModal.tsx        # Modal de creación/edición de persona
├── services/
│   └── personService.tsx      # Llamadas a /api/persons
└── hooks/
    └── usePersons.tsx         # Hook CRUD para personas
```

### 5.4 Refactorización de modales existentes

Cada modal (`StudentModal`, `TutorModal`, `UserModal`, `ManagerModal`) se modifica para:

1. **Usar `<PersonFormFields />`** para la sección de datos personales
2. **Conservar sus campos específicos** (tipo de estudiante, profesión, rol, cargo)
3. **Usar `personService.validateUniqueCi()`** en validación en tiempo real
4. **Enviar datos personales a `/api/persons`** y datos específicos al endpoint del rol

---

## 6. Lista Completa de Archivos

### FASE 1 — Base de Datos

| Archivo | Acción |
|---------|--------|
| `DB-postgres.sql` | Modificar |
| `backend/src/migrations/001_create_persons.sql` | Crear |
| `backend/src/migrations/002_migrate_persons_data.sql` | Crear |
| `backend/src/migrations/003_add_person_fks.sql` | Crear |
| `backend/src/migrations/004_drop_duplicated_columns.sql` | Crear (opcional) |

### FASE 2 — Backend: Servicio Compartido

| Archivo | Acción |
|---------|--------|
| `backend/src/services/person.service.ts` | Crear |
| `backend/src/controllers/persons.controller.ts` | Crear |
| `backend/src/routes/persons.routes.ts` | Crear |
| `backend/src/app.ts` | Modificar |

### FASE 3 — Backend: Refactorizar Controladores

| Archivo | Acción |
|---------|--------|
| `backend/src/controllers/students.controller.ts` | Modificar (~40% reducción) |
| `backend/src/controllers/tutors.controller.ts` | Modificar (~35% reducción) |
| `backend/src/controllers/users.controller.ts` | Modificar (~25% reducción) |
| `backend/src/controllers/institutional-responsibles.controller.ts` | Modificar (~30% reducción) |
| `backend/src/services/users.service.ts` | Modificar |

### FASE 4 — Frontend: Tipos Compartidos

| Archivo | Acción |
|---------|--------|
| `src/features/types/person.ts` | Crear |
| `src/features/students/types/index.tsx` | Modificar |
| `src/features/tutors/types/index.tsx` | Modificar |
| `src/features/users/types/index.ts` | Modificar |
| `src/features/institutions/types/index.tsx` | Modificar |
| `src/features/auth/types/index.ts` | Modificar |
| `src/features/enrollment/types/index.ts` | Posible modificación |

### FASE 5 — Frontend: Feature Persons

| Archivo | Acción |
|---------|--------|
| `src/features/persons/types/index.tsx` | Crear |
| `src/features/persons/services/personService.tsx` | Crear |
| `src/features/persons/hooks/usePersons.tsx` | Crear |
| `src/features/persons/components/PersonFormFields.tsx` | Crear |
| `src/features/persons/components/PersonView.tsx` | Crear |
| `src/features/persons/components/PersonTable.tsx` | Crear |
| `src/features/persons/components/PersonModal.tsx` | Crear |

### FASE 6 — Frontend: Refactorizar Features

| Archivo | Acción |
|---------|--------|
| `src/features/students/components/StudentModal.tsx` | Modificar |
| `src/features/students/components/StudentViewModal.tsx` | Modificar |
| `src/features/students/components/StudentTable.tsx` | Modificar |
| `src/features/students/hooks/useStudents.tsx` | Modificar |
| `src/features/students/services/studentsService.tsx` | Modificar |
| `src/features/students/constants/validation.ts` | Modificar |
| `src/features/tutors/components/TutorModal.tsx` | Modificar |
| `src/features/tutors/components/TutorViewModal.tsx` | Modificar |
| `src/features/tutors/hooks/useTutors.tsx` | Modificar |
| `src/features/tutors/services/tutorsService.tsx` | Modificar |
| `src/features/users/components/UserModal.tsx` | Modificar |
| `src/features/users/hooks/useUsers.tsx` | Modificar |
| `src/features/institutions/components/ManagerModal.tsx` | Modificar |
| `src/features/institutions/hooks/useInstitutionalResponsibles.tsx` | Modificar |

### FASE 7 — Pruebas

| Archivo | Acción |
|---------|--------|
| `src/features/persons/components/__tests__/PersonFormFields.test.tsx` | Crear |
| `src/features/persons/components/__tests__/PersonTable.test.tsx` | Crear |
| `src/features/persons/services/__tests__/personService.test.tsx` | Crear |
| Tests existentes en students, tutors, users | Revisar/actualizar |

---

## 7. Resumen de Impacto

| Capa | Crear | Modificar |
|------|-------|-----------|
| **BD (migrations)** | 4 | 1 |
| **Backend** | 4 | 5 |
| **Frontend types** | 1 | 6 |
| **Frontend feature persons** | 7 | 0 |
| **Frontend refactor** | 0 | 14 |
| **Tests** | 3 | ~5 |
| **Total** | **~19** | **~31** |

---

## 8. Riesgos y Mitigaciones

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Datos contradictorios entre tablas para mismo CI | Alto | Jerarquía de prioridad + tabla de auditoría `t_person_merge_log` |
| Regresión en endpoints existentes | Alto | Pruebas manuales de cada CRUD después de refactorización |
| Queries existentes usan columnas viejas | Medio | Mantener columnas duplicadas en Fase 4 (drop opcional posterior) |
| Tiempo de migración en BD grande | Medio | Migración en transacción, con rollback posible |
| Confusión sobre qué capa contiene datos personales | Bajo | Documentación clara + naming consistente (`personService.*` vs `studentService.*`) |
| RLS deshabilitado en 49 tablas (incluyendo las 4 de personas) | Alto | No bloqueante para esta migración. Se recomienda habilitar RLS con políticas después de la migración. Ver `supabase_get_advisors`. |

---

## 9. Estrategia de Implementación

```
Fase 1 ─► BD: migrations 001-003
  │
  ▼
Fase 2 ─► Backend: person.service + persons controller/routes
  │
  ▼
Fase 3 ─► Backend: refactor controladores existentes
  │
  ▼
Fase 4 ─► Frontend: person.ts type + extensiones en Student, Tutor, User, Responsible
  │
  ▼
Fase 5 ─► Frontend: feature persons/ (componentes compartidos)
  │
  ▼
Fase 6 ─► Frontend: refactorizar modales, hooks, servicios existentes
  │
  ▼
Fase 7 ─► Pruebas + validación + BD migration 004 (drop opcional)
```

**Cada fase es independiente y funcional por sí misma** — se puede hacer deploy después de cada fase sin romper el sistema.

---

## 10. Registro de Implementación

### Sesión 1 — 2026-05-23

**Objetivo**: Validar schema real contra Supabase, corregir plan, aplicar migraciones 001-003.

#### Correcciones sobre el plan original

| Aspecto | Plan original | Realidad (Supabase live) |
|---------|--------------|-------------------------|
| Columnas en `t_persons` | `FIRST_NAME` (UPPER) | `first_name` (lowercase) — Postgres unquoted fold |
| CI format | `CI VARCHAR(10)` | Sin prefijo `V-` en algunos registros (ej: `29847715` vs `V-29847715`) |
| GENDER en `t_students` | `CHAR(10)` con `'M'` / `'F'` | Padding con espacios: `"M         "`, `"F         "` |
| `t_user.SECOND_NAME` | Existe según plan | **No existe** en BD real — Users solo tiene `NAME` y `SURNAME` |
| `t_institution_manager` | Tiene `CARGO` como columna | El cargo se migró a tabla pivote `t_institution_manager_institution` |
| CI overlaps | Se asumían pocos conflictos | **2 overlaps reales**: `V-15678901` (Carmen≠Carlos) y `29847715` vs `V-29847715` (data quality) |

#### Migraciones aplicadas (Supabase via MCP)

| Migración | Archivo | Resultado |
|-----------|---------|-----------|
| `001_create_persons` | `backend/src/migrations/001_create_persons.sql` | Tabla `t_persons` creada con columnas lowercase |
| `002_migrate_persons_data` | `backend/src/migrations/002_migrate_persons_data.sql` | **64 persons migradas**: 41 students + 14 tutors + 6 users + 5 managers − 2 duplicates |
| `003_add_person_fks` | `backend/src/migrations/003_add_person_fks.sql` | `person_id` FK agregada a las 4 tablas hijas, 0 nulls |

#### Conflictos detectados

| CI | Tablas en conflicto | Resolución |
|----|--------------------|------------|
| `V-15678901` | `t_tutors` (Carmen Rosa Paredes Luna) vs `t_institution_manager` (Carlos Andrés Mendoza Rojas) | Se priorizó tutor (jerarquía), WARNING en `t_person_merge_log` |
| `29847715` vs `V-29847715` | `t_user` (sin prefijo) vs otras tablas (con prefijo) | Tratados como CIs diferentes (data quality pre-existente) |

#### Backend creado

| Archivo | Propósito |
|---------|-----------|
| `backend/src/services/person.service.ts` | CRUD compartido + validaciones CI/email + splitCi/joinCi + manejo de errores |
| `backend/src/controllers/persons.controller.ts` | 9 endpoints para `/api/persons` |
| `backend/src/routes/persons.routes.ts` | Rutas registradas en `app.ts` con permisos `persons:view/create/edit` |

#### Frontend creado

| Archivo | Propósito |
|---------|-----------|
| `src/features/types/person.ts` | `Persona` interface + `PersonaDTO` + `mapPersonaFromDTO` mapper |
| `src/features/persons/services/personService.tsx` | Servicio frontend via `createCrudService` |
| `src/features/persons/hooks/usePersons.tsx` | Hook CRUD con estados loading/error |
| `src/features/persons/components/PersonFormFields.tsx` | Formulario reutilizable con validación CI/email |

#### Backend refactorizado

| Archivo | Cambio |
|---------|--------|
| `backend/src/controllers/students.controller.ts` | `createStudent`/`updateStudent`/`toggleStatus` ahora delegan a `personService` |
| `backend/src/controllers/tutors.controller.ts` | `createTutor`/`updateTutor`/`toggleStatus` ahora delegan a `personService` |

---

### Sesión 2 — 2026-05-23

**Objetivo**: Refactorizar users + institutional-responsibles, actualizar frontend types, arreglar build.

#### Backend refactorizado

| Archivo | Cambio |
|---------|--------|
| `backend/src/services/users.service.ts` | `createUser`: crea/actualiza persona en `t_persons` con fallback CI existente; `updateUser`: busca `PERSON_ID` y actualiza persona; agrega `personId` en `getUsers` response |
| `backend/src/controllers/institutional-responsibles.controller.ts` | `createInstitutionalResponsible`: crea persona con `personService` + setea `PERSON_ID`; `updateInstitutionalResponsible`: busca `PERSON_ID` y actualiza persona; `toggleStatus`: actualiza persona |

#### Frontend — tipos actualizados

| Archivo | Cambio |
|---------|--------|
| `src/features/students/types/index.tsx` | Agregado `personId?: string` |
| `src/features/tutors/types/index.tsx` | Agregado `personId?: string` |
| `src/features/users/types/index.ts` | Agregado `personId?: number` |
| `src/features/institutions/types/index.tsx` | Agregado `personId?: string` |
| `src/features/users/services/userService.ts` | `UserDTO` + `mapFromApi` incluyen `personId` |
| `src/features/persons/components/PersonFormFields.tsx` | Corregido: labels como elementos separados (patrón del proyecto), selects usan `Controller` + `control` |

#### Estado del build

`npx tsc --noEmit` → **0 errores**. Errores pre-existentes en `TrackingTable`, `ListsConfiguration`, `TablePreviewModal` no relacionados.

#### Pendiente para futuras sesiones

- Migración 004 (drop de columnas duplicadas en tablas hijas) — opcional
- Refactor de modales existentes para usar `PersonFormFields` — requiere cambios mayores en forms de 1000+ líneas con schemas y validaciones muy específicas
- Tests unitarios para `person.service`, `PersonFormFields`, etc.
- Página de administración de personas (`PersonTable` + `PersonModal`)
