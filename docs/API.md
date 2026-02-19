# API Documentation

> UNEFA Dashboard Backend API - Versión 1.0.0

## Base URL

- **Desarrollo**: `http://localhost:3000`
- **Producción**: Configurar según deployment

## Autenticación

La mayoría de endpoints requieren autenticación JWT via cookie `auth_token`.

| Endpoint | Autenticación |
|----------|---------------|
| `/api/auth/*` | Público |
| `/api/health` | Público |
| `/api/db-status` | Público |
| Todos los demás | Requiere JWT |

---

## Endpoints

### 🔐 Autenticación (`/api/auth`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/login` | Iniciar sesión |
| POST | `/logout` | Cerrar sesión |
| POST | `/refresh` | Renovar token |
| POST | `/first-login` | Primer inicio de sesión |
| POST | `/password-recovery` | Solicitar recuperación |
| POST | `/reset-password` | Restablecer contraseña |
| GET | `/me` | Obtener usuario actual |
| POST | `/security-questions` | Guardar preguntas de seguridad |

### 👥 Usuarios (`/api/users`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Listar usuarios (paginado) |
| GET | `/:id` | Obtener usuario por ID |
| POST | `/` | Crear usuario |
| PUT | `/:id` | Actualizar usuario |
| DELETE | `/:id` | Eliminar usuario (soft delete) |
| POST | `/security-questions` | Guardar preguntas de seguridad |

### 🎓 Estudiantes (`/api/students`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Listar estudiantes (paginado) |
| GET | `/:id` | Obtener estudiante por CI |
| POST | `/` | Crear estudiante |
| PUT | `/:id` | Actualizar estudiante |
| DELETE | `/:id` | Eliminar estudiante (soft delete) |
| GET | `/:id/practices` | Prácticas del estudiante |

### 👨‍🏫 Tutores (`/api/tutors`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Listar tutores (paginado) |
| GET | `/:ci` | Obtener tutor por CI |
| POST | `/` | Crear tutor |
| PUT | `/:ci` | Actualizar tutor |
| DELETE | `/:ci` | Eliminar tutor (soft delete) |

### 🏢 Instituciones (`/api/institutions`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Listar instituciones (paginado) |
| GET | `/:id` | Obtener institución por ID |
| POST | `/` | Crear institución |
| PUT | `/:id` | Actualizar institución |
| DELETE | `/:id` | Eliminar institución (soft delete) |

### 📚 Carreras (`/api/careers`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Listar carreras |
| GET | `/:id` | Obtener carrera por ID |
| POST | `/` | Crear carrera |
| PUT | `/:id` | Actualizar carrera |
| DELETE | `/:id` | Eliminar carrera (soft delete) |

### 📅 Períodos (`/api/periodos`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Listar períodos |
| GET | `/active` | Período activo actual |
| GET | `/:id` | Obtener período por ID |
| POST | `/` | Crear período |
| PUT | `/:id` | Actualizar período |
| DELETE | `/:id` | Eliminar período (soft delete) |
| GET | `/deleted` | Períodos eliminados |
| POST | `/restore/:id` | Restaurar período |

### 📋 Tipos de Pasantía (`/api/internship-types`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Listar tipos de pasantía |
| GET | `/:id` | Obtener tipo por ID |
| POST | `/` | Crear tipo |
| PUT | `/:id` | Actualizar tipo |
| DELETE | `/:id` | Eliminar tipo |

### 📝 Pre-Inscripciones (`/api/pre-enrollments`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Listar pre-inscripciones |
| POST | `/` | Crear pre-inscripción |
| PUT | `/:id` | Actualizar pre-inscripción |
| DELETE | `/:id` | Eliminar pre-inscripción |

### 📑 Inscripciones (`/api/enrollments`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Listar inscripciones (paginado) |
| GET | `/:id` | Obtener inscripción por ID |
| POST | `/` | Crear inscripción |
| PUT | `/:id` | Actualizar inscripción |
| DELETE | `/:id` | Eliminar inscripción |

### 📍 Seguimiento (`/api/tracking`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Listar seguimientos |
| GET | `/stats` | Estadísticas de seguimiento |
| GET | `/:id` | Obtener seguimiento por ID |
| POST | `/` | Crear seguimiento |
| PUT | `/:id` | Actualizar seguimiento |
| DELETE | `/:id` | Eliminar seguimiento |

### 🎓 Culminación (`/api/culmination`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Listar culminaciones |
| POST | `/` | Registrar culminación |
| PUT | `/:id` | Actualizar culminación |

### ⭐ Evaluaciones (`/api/evaluations`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Listar evaluaciones |
| GET | `/:id` | Obtener evaluación por ID |
| POST | `/` | Crear evaluación |
| PUT | `/:id` | Actualizar evaluación |

### 📊 Dashboard (`/api/dashboard`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/stats` | Estadísticas generales |
| GET | `/chart-data` | Datos para gráficos |

### 👨‍🏫 Dashboard Tutor (`/api/tutor`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/students` | Estudiantes asignados |
| GET | `/tracking` | Seguimientos del tutor |
| GET | `/stats` | Estadísticas del tutor |

### 👨‍🎓 Dashboard Estudiante (`/api/student`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/info` | Información del estudiante |
| GET | `/practice` | Práctica actual |
| GET | `/requests` | Solicitudes del estudiante |

### ⚙️ Configuración (`/api/config`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Obtener configuración |
| PUT | `/` | Actualizar configuración |
| GET | `/health` | Estado del sistema |
| POST | `/clear-logs` | Limpiar logs antiguos |
| POST | `/sync` | Sincronizar datos |

### 📋 Listas (`/api/lists`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Listar todas las listas |
| GET | `/:id` | Obtener lista por ID |
| GET | `/name/:name` | Obtener lista por nombre |
| POST | `/` | Crear lista |
| PUT | `/:id` | Actualizar lista |
| DELETE | `/:id` | Eliminar lista |
| POST | `/values` | Crear valor de lista |
| PUT | `/values/:id` | Actualizar valor |
| DELETE | `/values/:id` | Eliminar valor |

### 🎨 Tema de Usuario (`/api/user/theme`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Obtener tema del usuario |
| PUT | `/` | Actualizar tema |

**Payload para PUT:**
```json
{
  "brandColor": "blue" | "green" | "purple" | "orange" | "red" | "pink" | "teal" | "indigo"
}
```

### 💾 Backups (`/api/backups`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Listar backups |
| POST | `/` | Crear backup |
| GET | `/:id/download` | Descargar backup |
| DELETE | `/:id` | Eliminar backup |

### 📢 Notificaciones (`/api/notifications`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Listar notificaciones |
| POST | `/:id/read` | Marcar como leída |
| POST | `/read-all` | Marcar todas como leídas |
| GET | `/stream` | SSE para notificaciones en tiempo real |

### 📖 Manuales (`/api/manuals`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Listar manuales |
| GET | `/:id` | Obtener manual |
| POST | `/` | Crear manual |
| DELETE | `/:id` | Eliminar manual |

### 🤖 Asistente IA (`/api/ai`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/chat` | Enviar mensaje al asistente |
| GET | `/history` | Historial de conversaciones |

### 📊 Reportes (`/api/reports`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/students` | Reporte de estudiantes |
| GET | `/enrollments` | Reporte de inscripciones |
| GET | `/evaluations` | Reporte de evaluaciones |
| GET | `/export/:type` | Exportar reporte |

---

## Códigos de Estado

| Código | Descripción |
|--------|-------------|
| 200 | Éxito |
| 201 | Creado |
| 204 | Sin contenido (éxito sin body) |
| 400 | Solicitud inválida |
| 401 | No autenticado |
| 403 | No autorizado |
| 404 | No encontrado |
| 409 | Conflicto (ej: registro duplicado) |
| 500 | Error interno del servidor |

---

## Paginación

Los endpoints que soportan paginación aceptan los siguientes parámetros:

| Parámetro | Default | Descripción |
|-----------|---------|-------------|
| `page` | 1 | Número de página |
| `limit` | 10 | Elementos por página |

**Respuesta:**
```json
{
  "data": [...],
  "page": 1,
  "limit": 10,
  "total": 100,
  "totalPages": 10
}
```

---

## Errores

Formato de respuesta de error:

```json
{
  "error": "Mensaje de error",
  "message": "Descripción detallada",
  "code": "ERROR_CODE"
}
```

---

## Rate Limiting

No implementado actualmente. Considerar agregar en producción.

---

## Versionado

Actualmente sin versionado explícito. Considerar `/api/v1/` para futuras versiones.
