# Propuesta: Sistema de Autenticación y Permisos Modular (RBAC)

> **Fecha**: 22/05/2026
> **Autor**: Análisis arquitectónico del sistema actual
> **Propósito**: Migrar de roles hardcoded a un sistema de permisos configurable por roles

---

## 1. Situación Actual — Cómo funciona hoy

### 1.1 Roles fijos en el código

Hoy el sistema tiene **4 roles hardcoded** definidos en `backend/src/middlewares/auth.middleware.ts`:

```
ADMIN      = 1  → Acceso total
ASISTENTE  = 2  → Solo lectura
TUTOR      = 3  → Panel de tutor
ESTUDIANTE = 4  → Panel de estudiante
```

### 1.2 Cómo se verifica el acceso

Existen **DOS sistemas de autorización completamente distintos** que conviven:

#### Sistema A: `authorizeRole()` (hardcoded — 21 endpoints)

```typescript
// Verifica que user.role === 1 (ADMIN)
router.put('/', authenticateToken, authorizeRole([ROLES.ADMIN]), ...)

// Verifica que user.role === 3 (TUTOR) — toda la ruta
router.use(authorizeRole([ROLES.TUTOR]));
```

Usado en: landing-config, auth (logs), backups, documents, tutor-dashboard, student-dashboard, admin-requests.

#### Sistema B: `requirePermission()` (basado en DB — 38 endpoints)

```typescript
// Verifica que el rol del usuario tenga el permiso 'students:view' en DB
router.get('/', authenticateToken, requirePermission('students:view'), getStudents)
```

Usado en: students, institutions, users, backups (algunos).

### 1.3 Flujo de autenticación (login)

```
Usuario → login → JWT en cookie (auth_token)
                    ↓
           Middleware authenticateToken
                    ↓
           Lee cookie → verify JWT → req.user = { userId, userCi, role }
                    ↓
           authorizeRole() o requirePermission() según la ruta
```

### 1.4 Cómo se obtiene el rol

```typescript
// Backend — login/auth.service.ts
const role = user.t_user_roles?.[0]?.ID_ROLES;  // Siempre el primer rol

// Frontend — AuthContext
const user = { id, userCi, name, role: number };  // Un solo número
```

### 1.5 Cómo se muestra/oculta UI en frontend

**Sidebar** (`AppSidebar.tsx`): cada item del menú tiene `roles?: number[]`:

```typescript
const navItems = [
  { name: 'Panel de Tutor', roles: [3] },        // Solo tutores
  { name: 'Gestión', roles: [0, 1, 2] },          // Admin/Asistente
  { name: 'Configuración', roles: [0, 1] },       // Solo Admin
];
```

**ProtectedRoute** en las rutas:

```tsx
<Route path="/tutor" element={
  <ProtectedRoute allowedRoles={[3]}>  // Solo rol 3
    <TutorDashboard />
  </ProtectedRoute>
} />
```

**Componentes**: algunos chequean `user.role === X` directamente para mostrar/ocultar botones.

---

## 2. Problemas del sistema actual

### 🔴 Problema 1: Dualidad de sistemas de permisos

| Sistema | Base | Estado |
|---------|------|--------|
| `authorizeRole` | Hardcoded en código | ❌ No configurable |
| `requirePermission` | Tablas `t_permissions` + `t_roles_permissions` | ✅ Configurable en DB |

Ambos conviven, NO están sincronizados, y crean confusión: ¿cuándo usar uno y cuándo el otro?

### 🔴 Problema 2: Roles imposibles de modificar sin deploy

Si mañana queremos:
- Que un **Asistente** pueda gestionar inscripciones (hoy solo lectura)
- Crear un rol **Coordinador de Pasantías** con permisos intermedios
- Que un **Tutor** pueda ver reportes pero no exportarlos

**No se puede sin modificar código, esperar deploy, y recompilar.**

### 🔴 Problema 3: El UI de roles (`/configure/roles`) está desconectado de la DB

La página de "Roles y Permisos" usa **permisos hardcoded** en `roles.controller.ts`:

```typescript
const DEFAULT_PERMISSIONS = [  // ❌ Esto debería venir de t_permissions
  'users.view', 'users.create', ...
];
const ASISTENTE_PERMISSIONS = ['students.view', ...];  // ❌ Hardcoded
```

Mientras que el middleware `requirePermission` consulta `t_roles_permissions`. **La UI muestra una cosa, el backend verifica otra.**

### 🔴 Problema 4: El frontend no usa permisos, solo números

- No existe un `usePermissions()` hook
- No hay `<RequirePermission perm="...">` para ocultar/mostrar UI
- Cualquier ocultamiento de UI requiere cambiar código y redeployar

### 🔴 Problema 5: Rol "Super Admin" (0) existe solo en frontend

```typescript
// Frontend
roleLabels: { 0: "Super Admin", 1: "Administrador", ... }

// Backend — NUNCA se crea el rol 0 en DB
ROLES = { ADMIN: 1, ASISTENTE: 2, TUTOR: 3, ESTUDIANTE: 4 }
```

### 🔴 Problema 6: Multi-rol existe en DB pero no se usa

La tabla `t_user_roles` soporta varios roles por usuario, pero el código siempre toma `[0]` — el primero.

---

## 3. Solución Propuesta — RBAC Configurable

### ¿Qué es RBAC?

**Role-Based Access Control** — un sistema donde:
1. Se definen **roles** (ej: "Coordinador", "Tutor", "Admin")
2. Se definen **permisos** (ej: "students:view", "tracking:manage")
3. Se asignan permisos a roles
4. Se asignan roles a usuarios
5. El sistema verifica permisos, no roles

### Arquitectura propuesta

```
USUARIOS                    ROLES                    PERMISOS
┌──────────┐              ┌──────────┐              ┌──────────┐
│ t_user   │──muchos-a──→│ t_user   │              │ t_perm.  │
│          │   muchos    │ _roles   │              │          │
│ USER_ID  │←───────────│ ID_USER  │              │ PERM. ID │
└──────────┘   puente    │ ID_ROLES │──muchos-a──→│ NAME     │
                         └──────────┘   muchos    │ MODULE   │
                              │                   │ DESCRIP. │
                              │                   └──────────┘
                              │                        ↑
                              │  t_roles_permissions    │
                              └─────────────────────────┘
                                   (tabla puente)

GRUPOS (opcional)
┌──────────┐    ┌──────────────┐
│ t_user_   │──→│ t_group_     │
│ groups    │    │ users        │
└──────────┘    └──────────────┘
```

### Cómo funciona el nuevo flujo

```
Login → Backend setea JWT con { userId, userCi, roles: [3] }
                                   ↓
Frontend guarda en AuthContext     ↓
                                   ↓
usePermissions() hook → GET /api/permissions/my
                        → cachea permisos: ['students:view', 'tracking:manage', ...]
                                   ↓
Componentes usan:
  - <RequirePermission perm="students:edit">...</RequirePermission>
  - hasPermission('tracking:manage') ? <BotonVisitas /> : null
                                   ↓
Backend usa SOLO requirePermission() (NUNCA más authorizeRole)
```

### Cambios clave respecto al sistema actual

| Aspecto | Hoy | Propuesto |
|---------|-----|-----------|
| Crear roles | No se puede sin código | Desde UI `/configure/roles` |
| Modificar permisos de un rol | No se puede sin código | Desde UI (checkboxes) |
| Verificar en backend | `authorizeRole` + `requirePermission` | Solo `requirePermission` |
| Verificar en frontend | `user.role === X` | `hasPermission('X')` |
| Multi-rol | No soportado | Sí, un usuario puede tener varios roles |
| Grupos de usuarios | No existe | Opcional, permisos heredados |

---

## 4. Cambios en la Base de Datos

### 4.1 Tablas existentes — NO se modifican (solo se agregan columnas)

#### `t_permissions` — AGREGAR columna MODULE

```sql
-- Hoy: sin módulo
PERMISSIONS_ID, NAME(VARCHAR(30)), DESCRIPTION, STATUS, ...

-- Propuesto:
PERMISSIONS_ID, NAME(VARCHAR(100)), MODULE(VARCHAR(50)), DESCRIPTION, STATUS, ...
```

**¿Por qué?** Sin `MODULE` no podemos agrupar permisos en la UI. Ej: agrupar "students:view", "students:create", "students:edit" bajo el módulo "Estudiantes".

```sql
ALTER TABLE t_permissions 
  ADD COLUMN "MODULE" VARCHAR(50) NOT NULL DEFAULT 'General';

ALTER TABLE t_permissions 
  ALTER COLUMN "NAME" TYPE VARCHAR(100);
```

#### `t_roles` — AGREGAR columna IS_SYSTEM

```sql
ALTER TABLE t_roles 
  ADD COLUMN "IS_SYSTEM" BOOLEAN NOT NULL DEFAULT false;
```

**¿Por qué?** Para proteger roles del sistema (Admin, Tutor, Estudiante) de ser eliminados accidentalmente desde la UI.

### 4.2 Seed data — permisos iniciales

Hoy `t_permissions` y `t_roles_permissions` pueden estar vacías (depende de si se ejecutaron migraciones). Hay que asegurar que existan los permisos base:

```sql
INSERT INTO t_permissions (NAME, MODULE, DESCRIPTION, STATUS, ...) VALUES
-- Usuarios
('users:view',       'Usuarios',     'Ver listado de usuarios', 1, ...),
('users:create',     'Usuarios',     'Crear nuevos usuarios', 1, ...),
('users:edit',       'Usuarios',     'Editar usuarios existentes', 1, ...),
('users:delete',     'Usuarios',     'Eliminar usuarios', 1, ...),
-- Estudiantes
('students:view',    'Estudiantes',  'Ver listado de estudiantes', 1, ...),
('students:create',  'Estudiantes',  'Registrar estudiantes', 1, ...),
('students:edit',    'Estudiantes',  'Editar datos de estudiantes', 1, ...),
('students:delete',  'Estudiantes',  'Eliminar estudiantes', 1, ...),
-- Inscripciones
('enrollments:view',   'Inscripciones', 'Ver inscripciones', 1, ...),
('enrollments:manage', 'Inscripciones', 'Gestionar inscripciones', 1, ...),
-- Seguimiento
('tracking:view',    'Seguimiento',  'Ver seguimientos', 1, ...),
('tracking:manage',  'Seguimiento',  'Registrar visitas y seguimiento', 1, ...),
-- Reportes
('reports:view',     'Reportes',     'Ver reportes', 1, ...),
('reports:export',   'Reportes',     'Exportar reportes', 1, ...),
-- Configuración
('config:access',    'Configuración','Acceder a configuración del sistema', 1, ...),
-- Dashboard
('dashboard:view',   'Dashboard',    'Ver dashboard principal', 1, ...),
-- Tutor
('tutor:panel',      'Tutor',        'Acceder al panel de tutor', 1, ...),
('tutor:grades',     'Tutor',        'Gestionar notas', 1, ...),
-- Estudiante
('student:panel',    'Estudiante',   'Acceder al panel de estudiante', 1, ...),
('student:requests', 'Estudiante',   'Gestionar solicitudes', 1, ...),
('student:documents','Estudiante',   'Gestionar documentos', 1, ...);
```

### 4.3 Seed data — asignación de permisos a roles

```sql
-- ADMIN (rol 1) → todos los permisos
INSERT INTO t_roles_permissions (ROLES_ID, PERMISSIONS_ID)
SELECT 1, PERMISSIONS_ID FROM t_permissions WHERE STATUS = 1;

-- ASISTENTE (rol 2) → permisos de solo lectura
INSERT INTO t_roles_permissions (ROLES_ID, PERMISSIONS_ID)
SELECT 2, PERMISSIONS_ID FROM t_permissions 
WHERE NAME IN ('students:view', 'enrollments:view', 'tracking:view', 
               'reports:view', 'dashboard:view');

-- TUTOR (rol 3) → permisos de tutor
INSERT INTO t_roles_permissions (ROLES_ID, PERMISSIONS_ID)
SELECT 3, PERMISSIONS_ID FROM t_permissions 
WHERE NAME IN ('tutor:panel', 'tutor:grades', 'tracking:view', 'tracking:manage',
               'reports:view', 'dashboard:view', 'students:view');

-- ESTUDIANTE (rol 4) → permisos de estudiante
INSERT INTO t_roles_permissions (ROLES_ID, PERMISSIONS_ID)
SELECT 4, PERMISSIONS_ID FROM t_permissions 
WHERE NAME IN ('student:panel', 'student:requests', 'student:documents');
```

### 4.4 Seed data — crear roles faltantes en `t_roles`

```sql
-- Asegurar que los 4 roles base existan
INSERT INTO t_roles (ID_ROLS, NAME, DESCRIPTION, STATUS, IS_SYSTEM, ...) VALUES
(1, 'ADMIN', 'Administrador con acceso total al sistema', 1, true, ...),
(2, 'ASISTENTE', 'Asistente con permisos limitados', 1, true, ...),
(3, 'TUTOR', 'Tutor académico', 1, true, ...),
(4, 'ESTUDIANTE', 'Estudiante', 1, true, ...)
ON CONFLICT (ID_ROLS) DO NOTHING;
```

### 4.5 Tablas nuevas — Grupos de usuarios (OPCIONAL — Fase D)

Solo si se decide implementar grupos:

```sql
CREATE TABLE t_user_groups (
  GROUP_ID SERIAL PRIMARY KEY,
  NAME VARCHAR(100) NOT NULL,
  DESCRIPTION TEXT,
  STATUS SMALLINT DEFAULT 1,
  CREATED_AT TIMESTAMP DEFAULT NOW()
);

CREATE TABLE t_group_users (
  GROUP_ID INTEGER REFERENCES t_user_groups(GROUP_ID),
  USER_ID INTEGER REFERENCES t_user(USER_ID),
  PRIMARY KEY (GROUP_ID, USER_ID)
);

CREATE TABLE t_group_roles (
  GROUP_ID INTEGER REFERENCES t_user_groups(GROUP_ID),
  ROLE_ID INTEGER REFERENCES t_roles(ID_ROLS),
  PRIMARY KEY (GROUP_ID, ROLE_ID)
);
```

---

## 5. Resumen de cambios

### Base de datos — mínimo indispensable

| Tabla | Cambio | Tipo |
|-------|--------|------|
| `t_permissions` | Agregar columna `MODULE` | ALTER TABLE |
| `t_permissions` | Ampliar `NAME` de VARCHAR(30) a VARCHAR(100) | ALTER TABLE |
| `t_roles` | Agregar columna `IS_SYSTEM` | ALTER TABLE |
| Seed data | Insertar permisos base | INSERT |
| Seed data | Insertar asignaciones rol→permiso | INSERT |
| Seed data | Asegurar roles 1-4 en `t_roles` | UPSERT |

**Total: 3 ALTER TABLE + inserts. Ningún cambio destructivo.**

### Backend

| Cambio | Esfuerzo |
|--------|----------|
| Reemplazar `authorizeRole` por `requirePermission` en 21 endpoints | ~2-3 sesiones |
| Unificar `roles.controller.ts` con `permissionService.ts` | ~1 sesión |
| Agregar CRUD de roles (crear/editar/eliminar) | ~1 sesión |
| Agregar CRUD de permisos | ~1 sesión |

### Frontend

| Cambio | Esfuerzo |
|--------|----------|
| Crear hook `usePermissions()` | ~1 sesión |
| Crear componente `<RequirePermission>` | ~1 sesión |
| Reemplazar `user.role === X` en componentes | ~1-2 sesiones |
| Conectar UI de roles a la DB real | ~1 sesión |
| Agregar gestión de roles y permisos en UI | ~2 sesiones |

---

## 6. Plan de implementación por fases

### Fase A — Unificar backend (fundación)

1. Agregar columnas `MODULE` e `IS_SYSTEM` a la DB
2. Seedear permisos base y asignaciones en `ensureRolesSeeded()`
3. Reemplazar `roles.controller.ts` hardcoded con queries a `t_roles`/`t_permissions`
4. Migrar los 21 endpoints de `authorizeRole` a `requirePermission`
5. Eliminar `restrictAsistente` (ya no tiene sentido)

### Fase B — Frontend permission engine

1. Hook `usePermissions()` — fetchea `/api/permissions/my` al login
2. Componente `<RequirePermission perm="...">` — oculta/muestra UI
3. `<ProtectedByPermission>` — wrapper para rutas
4. Sidebar actualizado para filtrar por permisos

### Fase C — Admin UI para gestión

1. Página "Roles" funcional con CRUD real contra DB
2. Página "Permisos" con agrupación por módulo
3. Asignación masiva rol→permisos con checkboxes
4. Asignación de roles a usuarios en página de usuarios

### Fase D — Grupos (opcional)

1. Tablas de grupos
2. CRUD de grupos
3. Permisos heredados: usuario = rol + grupos

---

## 7. Preguntas para el equipo

Antes de proceder, habría que definir:

1. **¿Vamos con multi-rol desde el vamos o mantenemos 1 rol por usuario?**
   - La DB lo soporta, pero implica cambios en login y AuthContext

2. **¿Grupos de usuarios ahora o después?**
   - Agrega complejidad, se puede postergar a Fase D

3. **¿Los roles actuales (TUTOR=3, ESTUDIANTE=4) siguen siendo "especiales" con paneles dedicados?**
   - Los permisos pueden controlar acceso a rutas, pero el layout/sidebar para tutor y estudiante seguiría siendo distinto

4. **¿Queremos migración retroactiva?**
   - Los usuarios existentes en `t_user_roles` ya tienen roles asignados; se migran solos

---

## 8. Viability Score

| Factor | Evaluación |
|--------|-----------|
| La DB ya tiene las tablas necesarias | ✅ 100% listo |
| Backend middleware `requirePermission` ya funciona | ✅ 80% listo |
| Frontend `permissionService.ts` ya existe | ✅ Listo, solo hay que usarlo |
| No hay cambios destructivos en DB | ✅ Todos ALTER TABLE son aditivos |
| Compatibilidad hacia atrás | ✅ Usuarios existentes no se pierden |
| Esfuerzo total estimado | 🟡 6-10 sesiones de trabajo |
| Complejidad conceptual | 🟡 Mayor que roles hardcoded |

---

## Conclusión

**Es viable y recomendable.** El proyecto ya tiene el 60% de la infraestructura montada (tablas, servicio de permisos, middleware). Lo que falta es principalmente:

1. **Unificar** los dos sistemas actuales en uno solo basado en DB
2. **Conectar** el frontend a los permisos (hoy solo revisa números)
3. **Construir** la UI de gestión de roles y permisos

El esfuerzo es moderado (6-10 sesiones repartidas en fases) y no hay breaking changes en la DB.

Lo más importante: una vez implementado, **cualquier cambio de permisos se hace desde la UI sin tocar código ni redeployar**. Para un sistema que va a crecer y tener más módulos, esto es clave.
