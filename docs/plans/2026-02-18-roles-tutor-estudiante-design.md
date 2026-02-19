# Diseño: Roles Tutor y Estudiante

**Fecha:** 2026-02-18  
**Estado:** Aprobado  
**Versión:** 1.0

---

## 1. Resumen

Crear dos nuevos roles de usuario en el sistema:
- **TUTOR**: Gestiona seguimiento, notas y reportes de estudiantes asignados
- **ESTUDIANTE**: Visualiza su información y envía solicitudes a coordinación

---

## 2. Arquitectura de Roles

| ID | Rol | Descripción |
|----|-----|-------------|
| 1 | ADMIN | Acceso total al sistema |
| 2 | ASISTENTE | Gestión operativa (sin configuración) |
| 3 | TUTOR | Seguimiento, notas y reportes de sus estudiantes |
| 4 | ESTUDIANTE | Ver su info y enviar solicitudes |

### Vinculación con tablas existentes

- `t_tutors.USER_ID` → `t_user.USER_ID`
- `t_students.USER_ID` → `t_user.USER_ID`

**Opción alternativa guardada para futuro:** Detectar rol automáticamente comparando CI con tablas `t_tutors`/`t_students` sin crear usuario en `t_user`.

---

## 3. Base de Datos

### 3.1 Modificaciones a tablas existentes

```sql
-- Agregar USER_ID a t_tutors
ALTER TABLE "t_tutors" ADD COLUMN "USER_ID" INTEGER REFERENCES "t_user"("USER_ID");

-- Agregar USER_ID a t_students
ALTER TABLE "t_students" ADD COLUMN "USER_ID" INTEGER REFERENCES "t_user"("USER_ID");

-- Agregar TUTOR_ID a t_enrollment para asignación
ALTER TABLE "t_enrollment" ADD COLUMN "TUTOR_ID" INTEGER REFERENCES "t_tutors"("TUTOR_ID");
```

### 3.2 Nuevas tablas

```sql
-- Tipos de solicitudes (configurables por admin)
CREATE TABLE "t_request_types" (
  "REQUEST_TYPE_ID" SERIAL PRIMARY KEY,
  "NAME" VARCHAR(100) NOT NULL,
  "DESCRIPTION" TEXT,
  "IS_ACTIVE" SMALLINT DEFAULT 1,
  "CREATED_AT" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Solicitudes de estudiantes
CREATE TABLE "t_student_requests" (
  "REQUEST_ID" SERIAL PRIMARY KEY,
  "STUDENT_ID" INTEGER NOT NULL REFERENCES "t_students"("STUDENTS_ID"),
  "REQUEST_TYPE_ID" INTEGER NOT NULL REFERENCES "t_request_types"("REQUEST_TYPE_ID"),
  "SUBJECT" VARCHAR(255) NOT NULL,
  "DESCRIPTION" TEXT NOT NULL,
  "STATUS" VARCHAR(20) DEFAULT 'pending',
  "RESPONSE" TEXT,
  "PROCESSED_BY" INTEGER REFERENCES "t_user"("USER_ID"),
  "PROCESSED_AT" TIMESTAMP,
  "CREATED_AT" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Datos iniciales para tipos de solicitud
INSERT INTO "t_request_types" ("NAME", "DESCRIPTION", "IS_ACTIVE") VALUES
('Cambio de empresa', 'Solicitar cambio de empresa donde realiza la pasantía', 1),
('Extensión de pasantía', 'Solicitar extensión del período de pasantía', 1),
('Reportar problema', 'Reportar incidencias durante la pasantía', 1),
('Solicitud de documentos', 'Solicitar constancias o certificados', 1),
('Otro', 'Otro tipo de solicitud', 1);
```

### 3.3 Configuración del sistema

```sql
-- Claves de configuración en t_config
INSERT INTO "t_config" ("KEY", "VALUE", "DESCRIPTION") VALUES
-- Creación de cuentas
('auto_create_user_on_tutor', 'true', 'Crear usuario automáticamente al registrar tutor'),
('auto_create_user_on_student', 'false', 'Crear usuario automáticamente al registrar estudiante'),
('allow_manual_link_user', 'true', 'Permitir vincular usuario existente a tutor/estudiante'),

-- Permisos del tutor
('tutor_can_view_all_students', 'false', 'Tutor puede ver todos los estudiantes'),
('tutor_can_edit_grades', 'true', 'Tutor puede cargar/editar notas'),
('tutor_can_generate_reports', 'true', 'Tutor puede generar reportes'),

-- Permisos del estudiante
('student_can_upload_docs', 'false', 'Estudiante puede subir documentos'),
('student_can_edit_profile', 'true', 'Estudiante puede editar datos de contacto');
```

---

## 4. Dashboard del Tutor

### Rutas

| Ruta | Página | Descripción |
|------|--------|-------------|
| `/tutor` | Dashboard | Resumen de estudiantes asignados |
| `/tutor/students` | Mis Estudiantes | Listado con filtros |
| `/tutor/tracking` | Seguimiento | Registrar/editar visitas |
| `/tutor/grades` | Notas | Cargar ponderación final |
| `/tutor/reports` | Reportes | Generar reportes |

### Permisos (configurables)

- Ver solo estudiantes asignados (o todos según config)
- Cargar/editar notas
- Generar reportes

### Componentes

Reutilizar: ComponentCard, Table, Badge, Modal, ActionButtons, etc.

---

## 5. Dashboard del Estudiante

### Rutas

| Ruta | Página | Descripción |
|------|--------|-------------|
| `/student` | Dashboard | Estado de pasantía y progreso |
| `/student/profile` | Mi Perfil | Datos personales |
| `/student/internship` | Mi Pasantía | Detalles de pasantía |
| `/student/requests` | Mis Solicitudes | Historial y nuevas |
| `/student/documents` | Documentos | Certificados generados |

### Permisos (configurables)

- Ver su información únicamente
- Enviar solicitudes a coordinación
- Editar datos de contacto (según config)
- Subir documentos (según config, por defecto NO)

---

## 6. Bandeja de Solicitudes (Admin/Asistente)

### Ruta: `/admin/requests`

### Flujo de estados

```
Pendiente → En Revisión → Aprobada
                    ↘ Rechazada
```

### Funcionalidades

- Filtrar por estado, tipo, fecha
- Ver detalles de solicitud
- Cambiar estado con respuesta
- Historial de solicitudes por estudiante

### Notificaciones

- Nueva solicitud → notificar admin
- Cambio de estado → notificar estudiante

---

## 7. Implementación

### Fase 1 - Tutor (implementar primero)

1. Migraciones DB: `t_tutors.USER_ID`, `t_enrollment.TUTOR_ID`
2. Crear rol TUTOR (ID=3)
3. Servicio de configuración para permisos
4. Middleware de rutas por rol
5. Dashboard y páginas del tutor
6. Funcionalidad de asignación tutor-estudiante

### Fase 2 - Estudiante

1. Migraciones DB: `t_students.USER_ID`, tablas de solicitudes
2. Crear rol ESTUDIANTE (ID=4)
3. Dashboard y páginas del estudiante
4. Sistema de solicitudes
5. Bandeja de solicitudes para admin

---

## 8. Notas para Futuro

- **Opción alternativa de autenticación**: Detectar rol por CI sin tabla `t_user`
- **Permisos configurables**: Ampliables según necesidades institucionales
- **Tipos de solicitud**: Configurables desde panel de administración
- **Flujo de solicitudes**: Posible agregar asignación a admin específico

---

## 9. Decisiones Tomadas

| Decisión | Opción Elegida | Alternativa |
|----------|----------------|-------------|
| Vinculación tutor | USER_ID en t_tutors | Detectar por CI |
| Vinculación estudiante | USER_ID en t_students | Autenticación directa |
| Creación de cuentas | Híbrido configurable | Solo admin |
| Permisos tutor | Seguimiento + notas + reportes | Solo seguimiento |
| Permisos estudiante | Visualización + solicitudes | + documentos (configurable) |
| Tipos de solicitud | Configurables | Predefinidos |
| Flujo solicitudes | Estados con notificaciones | Bandeja simple |
