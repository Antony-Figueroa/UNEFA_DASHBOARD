# Guía de Interfaz: Configuración

## 1. Descripción General

El módulo de **Configuración** permite administrar los aspectos globales del sistema. Incluye múltiples secciones para gestionar usuarios, listas del sistema, auditorías, roles, mantenimiento, respaldos y la landing page pública.

### Submódulos

| # | Submódulo | Ruta | Descripción |
|---|-----------|------|-------------|
| 10a | Usuarios | `/configure/users` | Gestión de usuarios del sistema |
| 10b | Listas | `/configure/lists` | Listas dinámicas del sistema |
| 10c | Auditoría | `/configure/auditoria` | Registro de actividades |
| 10d | Roles y Permisos | `/configure/roles` | Administración de roles |
| 10e | Mantenimiento | `/configure/maintenance` | Opciones de mantenimiento |
| 10f | Respaldos | `/configure/backups` | Gestión de respaldos BD |
| 10g | Landing Page | `/configure/landing` | Configuración pública |

### Roles que Acceden

| Rol | Acceso |
|-----|--------|
| Administrador (role: 1) | ✅ Sí |
| Asistente (role: 2) | Parcial |
| Tutor (role: 3) | ❌ No |
| Estudiante (role: 4) | ❌ No |

---

## 2. Estructura del Sidebar

### Menú de Configuración

```
Configuración
├── Usuarios (/configure/users)
├── Listas (/configure/lists)
├── Auditoría (/configure/auditoria)
├── Roles y Permisos (/configure/roles)
├── Mantenimiento (/configure/maintenance)
├── Respaldos (/configure/backups)
└── Landing Page (/configure/landing)
```

---

## 3. Submódulo: Usuarios

### 3.1 Descripción

Permite administrar los usuarios del sistema, sus roles y estados de acceso.

### 3.2 Ruta

```
/configure/users
```

### 3.3 Estructura Visual

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  GESTIÓN DE USUARIOS                                                          │
│                                                                                 │
│  [Activos] [Inactivos]                                                        │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  #  | Cédula   | Nombre        | Email         | Rol     | Estado     │   │
│  │  ─────────────────────────────────────────────────────────────────────│   │
│  │  1  | V12345678| Juan Pérez    | juan@...      | ADMIN   | [Activo]   │   │
│  │  2  | V87654321| María López    | maria@...     | ASISTENTE| [Activo]  │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 3.4 Columnas

| Columna | Descripción |
|---------|-------------|
| Cédula | Identificación del usuario |
| Nombre | Nombre completo |
| Email | Correo electrónico |
| Rol | Rol asignado |
| Estado | Activo/Inactivo |

### 3.5 Acciones

| Acción | Descripción |
|--------|-------------|
| Crear Usuario | Agregar nuevo usuario |
| Editar | Modificar datos |
| Activar/Desactivar | Cambiar estado |
| Eliminar | Eliminar permanentemente |

---

## 4. Submódulo: Listas

### 4.1 Descripción

Administra las listas dinámicas del sistema que se usan en formularios y selectores.

### 4.2 Ruta

```
/configure/lists
```

### 4.3 Listas del Sistema

| Lista | Descripción |
|-------|-------------|
| Sexo | Opciones de sexo |
| Estado Civil | Estados civiles |
| Régimen | Turnos de estudio |
| Tipo de Estudiante | Civil/Militar |
| Nacionalidad | Países |
| Prefijos | Prefijos telefónicos |
| Tipo de Práctica | Tipos de práctica profesional |
| Estado de Solicitud | Estados de solicitudes |
| Periocidad | Frecuencias |

### 4.4 Estructura

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  CONFIGURACIÓN DE LISTAS                                                      │
│                                                                                 │
│  ┌─────────────────────┐ ┌───────────────────────────────────────────────┐    │
│  │ LISTAS               │ │ VALORES DE LA LISTA                          │    │
│  │ ───────────────────  │ │                                               │    │
│  │ □ Sexo              │ │  ┌────────────────────┐ ┌────────────────┐  │    │
│  │ □ Estado Civil     │ │  │ Masculino      [✏️]│ │ [✕]           │  │    │
│  │ □ Régimen          │ │  │ Feminino       [✏️]│ │ [✕]           │  │    │
│  │ □ Tipo Estudiante  │ │  │ Otro           [✏️]│ │ [✕]           │  │    │
│  │ ...                 │ │  └────────────────────┘ └────────────────┘  │    │
│  │                     │ │                                               │    │
│  │ [+ Nueva Lista]     │ │                            [+ Agregar Valor] │    │
│  └─────────────────────┘ └───────────────────────────────────────────────┘    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 4.5 Listas Protegidas

Algunas listas no pueden ser eliminadas:
- Sexo
- Estado Civil
- Régimen
- Tipo de Estudiante

---

## 5. Submódulo: Auditoría

### 5.1 Descripción

Muestra el registro de todas las actividades realizadas en el sistema.

### 5.2 Ruta

```
/configure/auditoria
```

### 5.3 Estructura

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  REGISTRO DE AUDITORÍA                                                        │
│                                                                                 │
│  [🔍 Buscar por usuario/acción]  [Filtrar por fecha]                         │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  Fecha       | Usuario      | Acción           | Módulo    | Detalle    │   │
│  │  ─────────────────────────────────────────────────────────────────────│   │
│  │  15/03/2026 | Juan Pérez   │ CREAR           | Estudiantes| Creó...   │   │
│  │  15/03/2026 | María López   │ ACTUALIZAR      | Periodos  | Editó...   │   │
│  │  14/03/2026 | Sistema       │ LOGIN           | Auth      | Login...   │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 5.4 Tipos de Acción

| Acción | Descripción |
|--------|-------------|
| CREAR | Registro creado |
| ACTUALIZAR | Registro modificado |
| ELIMINAR | Registro eliminado |
| LOGIN | Inicio de sesión |
| LOGOUT | Cierre de sesión |
| EXPORT | Exportación de datos |

---

## 6. Submódulo: Roles y Permisos

### 6.1 Descripción

Administra los roles de usuario y sus permisos de acceso.

### 6.2 Ruta

```
/configure/roles
```

### 6.3 Estructura

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  ROLES Y PERMISOS                                                            │
│                                                                                 │
│  ┌─────────────────────┐ ┌───────────────────────────────────────────────┐    │
│  │ ROLES               │ │ PERMISOS DEL ROL                              │    │
│  │ ───────────────────  │ │                                               │    │
│  │ □ ADMIN            │ │  Módulo: Estudiantes                          │    │
│  │ □ ASISTENTE        │ │  ☑ Ver    ☑ Crear    ☑ Editar   ☑ Eliminar │    │
│  │ □ TUTOR            │ │                                               │    │
│  │ □ ESTUDIANTE       │ │  Módulo: Periodos                             │    │
│  │                    │ │  ☑ Ver    ☑ Crear    ☑ Editar   ☐ Eliminar  │    │
│  │                    │ │                                               │    │
│  │ [+ Crear Rol]     │ │                                               │    │
│  └─────────────────────┘ └───────────────────────────────────────────────┘    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 6.4 Permisos por Módulo

| Permiso | Descripción |
|---------|-------------|
| Ver | Acceso de lectura |
| Crear | Crear registros |
| Editar | Modificar registros |
| Eliminar | Eliminar registros |

### 6.5 Roles del Sistema

| Rol | Descripción |
|-----|-------------|
| ADMIN | Acceso completo |
| ASISTENTE | Acceso administrativo |
| TUTOR | Supervisión de prácticas |
| ESTUDIANTE | Acceso limitado |

---

## 7. Submódulo: Mantenimiento

### 7.1 Descripción

Opciones de mantenimiento del sistema.

### 7.2 Ruta

```
/configure/maintenance
```

### 7.3 Opciones

| Opción | Descripción |
|--------|-------------|
| Limpiar caché | Eliminar datos temporales |
| Reindexar búsqueda | Optimizar búsquedas |
| Verificar integridad | Comprobar consistencia de datos |
| Estadísticas | Recalcular métricas |

---

## 8. Submódulo: Respaldos

### 8.1 Descripción

Permite crear, restaurar y gestionar respaldos de la base de datos.

### 8.2 Ruta

```
/configure/backups
```

### 8.3 Estructura

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  GESTIÓN DE RESPALDOS                                                        │
│                                                                                 │
│  [+ Crear Respaldo]                                                          │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  Nombre           | Fecha        | Tamaño   | Formato | Acciones     │   │
│  │  ─────────────────────────────────────────────────────────────────────│   │
│  │  backup_20260315  | 15/03/2026   | 45.2 MB  | SQL     | [📥] [♻️]   │   │
│  │  backup_20260314  | 14/03/2026   | 44.8 MB  | SQL     │ [📥] [♻️]   │   │
│  │  backup_20260313  | 13/03/2026   | 44.5 MB  | JSON    │ [📥] [♻️]   │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 8.4 Acciones

| Acción | Icono | Descripción |
|--------|-------|-------------|
| Descargar | 📥 | Descargar archivo de respaldo |
| Restaurar | ♻️ | Restaurar desde respaldo |
| Eliminar | 🗑️ | Eliminar respaldo |

### 8.5 Modal de Creación

```
┌─────────────────────────────────────────────────────┐
│  CREAR RESPALDO                                     │
│                                                     │
│  Nombre (opcional):                                 │
│  ┌─────────────────────────────────────────────┐   │
│  │ backup_20260315                              │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Formato:                                          │
│  ○ SQL (recomendado)                              │
│  ○ JSON                                            │
│                                                     │
│  [Cancelar]              [Crear Respaldo]         │
└─────────────────────────────────────────────────────┘
```

### 8.6 Formatos

| Formato | Ventajas |
|---------|----------|
| SQL | Restaurable directamente, más grande |
| JSON | Legible, más pequeño |

---

## 9. Submódulo: Landing Page

### 9.1 Descripción

Configura el contenido de la página pública de inicio del sistema.

### 9.2 Ruta

```
/configure/landing
```

### 9.3 Secciones Configurables

| Sección | Descripción |
|---------|-------------|
| Banner principal | Imagen y texto de portada |
| Información | Datos de contacto |
| Requisitos | Requisitos para prácticas |
| Контактная информация | Datos de la institución |

### 9.4 Estructura

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  CONFIGURACIÓN LANDING PAGE                                                   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  BANNER PRINCIPAL                                                      │   │
│  │  ─────────────────────────────────────────────────────────────────   │   │
│  │  Título:  Prácticas Profesionales UNEFA                               │   │
│  │  Subtítulo: Formando profesionales de excellence                      │   │
│  │  Imagen: [Seleccionar imagen]                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  INFORMACIÓN DE CONTACTO                                             │   │
│  │  ─────────────────────────────────────────────────────────────────   │   │
│  │  Email: coord-practicas@unefa.edu.ve                                │   │
│  │  Teléfono: 0212-1234567                                             │   │
│  │  Dirección: Av. Universidad, Caracas                                │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  [Vista Previa]                        [Guardar Cambios]                     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. Tipos de Datos

### 10.1 User

```typescript
interface User {
  id: number;
  userCi: string;
  name: string;
  surname: string;
  email: string;
  role: 'ADMIN' | 'ASISTENTE' | 'TUTOR' | 'ESTUDIANTE';
  status: boolean;
  createdAt: string;
}
```

### 10.2 List

```typescript
interface List {
  id: number;
  name: string;
  description: string;
  values: ListValue[];
  isProtected: boolean;
  status: boolean;
}

interface ListValue {
  id: number;
  value: string;
  order: number;
  status: boolean;
}
```

### 10.3 Role

```typescript
interface Role {
  id: number;
  name: string;
  description: string;
  permissions: Permission[];
  status: 'active' | 'inactive';
}
```

### 10.4 BackupRecord

```typescript
interface BackupRecord {
  id: number;
  name: string;
  filename: string;
  size: number;
  format: 'sql' | 'json';
  createdAt: string;
  createdBy: string;
}
```

---

## 11. Obtención de Datos

### 11.1 Endpoints

| Método | Endpoint | Submódulo |
|--------|----------|-----------|
| GET | `/api/users` | Usuarios |
| POST | `/api/users` | Usuarios |
| PUT | `/api/users/:id` | Usuarios |
| DELETE | `/api/users/:id` | Usuarios |
| GET | `/api/lists` | Listas |
| POST | `/api/lists` | Listas |
| GET | `/api/audit` | Auditoría |
| GET | `/api/roles` | Roles |
| POST | `/api/roles` | Roles |
| GET | `/api/backups` | Respaldos |
| POST | `/api/backups` | Respaldos |
| POST | `/api/backups/:id/restore` | Respaldos |

---

## 12. Casos Edge

| Caso | Comportamiento |
|------|----------------|
| Lista protegida | No permite eliminar |
| Rol en uso | Warning al eliminar |
| Usuario con sesiones | No permite eliminar |
| Respaldo grande | Timeout posible |
| Auditoría sin datos | Muestra mensaje vacío |

---

## 13. Archivos Relacionados

### Frontend

| Archivo | Descripción |
|---------|-------------|
| `src/pages/Config/UserManagementPage.tsx` | Usuarios |
| `src/pages/Config/ListsConfiguration.tsx` | Listas |
| `src/pages/Config/RolesPermissions.tsx` | Roles |
| `src/pages/Config/Backups.tsx` | Respaldos |
| `src/pages/Config/LandingConfigPage.tsx` | Landing Page |
| `src/features/users/*` | Módulo usuarios |
| `src/features/lists/*` | Módulo listas |
| `src/features/roles/*` | Módulo roles |

### Backend

| Archivo | Descripción |
|---------|-------------|
| `backend/src/routes/users.routes.ts` | Usuarios |
| `backend/src/routes/lists.routes.ts` | Listas |
| `backend/src/routes/roles.routes.ts` | Roles |
| `backend/src/routes/backups.routes.ts` | Respaldos |
| `backend/src/routes/audit.routes.ts` | Auditoría |

---

## 14. Módulos Completados del Sidebar

Con esta sección completamos los módulos del sidebar:

| # | Módulo | Estado |
|---|--------|--------|
| 01 | Login | ✅ |
| 02 | Dashboard Admin | ✅ |
| 03 | Dashboard Tutor | ✅ |
| 04 | Dashboard Estudiante | ✅ |
| 05a | Gestión Períodos | ✅ |
| 05b | Gestión Carreras | ✅ |
| 06a | Registros Estudiantes | ✅ |
| 06b | Registros Tutores | ✅ |
| 06c | Registros Instituciones | ✅ |
| 07a | PP Pre-Inscripción | ✅ |
| 07b | PP Inscripción | ✅ |
| 07c | PP Seguimiento | ✅ |
| 07d | PP Evaluaciones | ✅ |
| 07e | PP Culminación | ✅ |
| 08 | Solicitudes | ✅ |
| 09 | Reportes | ✅ |
| 10 | Configuración | ✅ |
