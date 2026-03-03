# Documentación de API

> API del Backend de UNEFA Dashboard — Versión 1.0.0

## URL Base

| Entorno | URL |
|---------|-----|
| Desarrollo | `http://localhost:3000` |
| Producción | Configurar según deployment |

## Autenticación

La API utiliza autenticación JWT mediante cookies HTTP-only. El token se gestiona automáticamente en las respuestas de login.

### Endpoints Públicos

| Endpoint | Descripción |
|----------|-------------|
| `/api/auth/login` | Inicio de sesión |
| `/api/auth/logout` | Cierre de sesión |
| `/api/auth/refresh` | Renovación de token |
| `/api/auth/me` | Datos del usuario actual |
| `/api/health` | Verificación de estado |
| `/api/db-status` | Estado de la base de datos |

### Permisos por Rol

El sistema implementa control de acceso basado en permisos:

| Permiso | Descripción |
|---------|-------------|
| `users:view` | Ver usuarios |
| `users:create` | Crear usuarios |
| `users:edit` | Editar usuarios |
| `users:delete` | Eliminar usuarios |
| `students:view` | Ver estudiantes |
| `students:create` | Crear estudiantes |
| `students:edit` | Editar estudiantes |
| `students:delete` | Eliminar estudiantes |
| `tutors:view` | Ver tutores |
| `tutors:create` | Crear tutores |
| `tutors:edit` | Editar tutores |
| `institutions:view` | Ver instituciones |
| `institutions:create` | Crear instituciones |
| `enrollments:view` | Ver inscripciones |
| `enrollments:create` | Crear inscripciones |

---

## Endpoints Detallados

### Autenticación

#### POST /api/auth/login

Inicia sesión con credenciales.

**Body:**

```json
{
  "email": "admin@unefa.edu.ve",
  "password": "admin123"
}
```

**Respuesta exitosa (200):**

```json
{
  "user": {
    "id": 1,
    "email": "admin@unefa.edu.ve",
    "name": "Administrador",
    "role": "admin"
  },
  "userId": "1"
}
```

**Errores:**

| Código | Descripción |
|--------|-------------|
| 401 | Credenciales inválidas |
| 400 | Solicitud mal formateada |

---

#### POST /api/auth/logout

Cierra la sesión actual.

**Respuesta exitosa (200):**

```json
{
  "message": "Sesión cerrada correctamente"
}
```

---

#### GET /api/auth/me

Obtiene los datos del usuario autenticado.

**Requiere:** JWT válido en cookie

**Respuesta exitosa (200):**

```json
{
  "id": 1,
  "email": "admin@unefa.edu.ve",
  "name": "Administrador",
  "surname": "Principal",
  "role": "admin",
  "permissions": ["users:view", "users:create", "users:edit", "users:delete"]
}
```

---

#### POST /api/auth/change-password

Cambia la contraseña del usuario.

**Body:**

```json
{
  "currentPassword": "contraseña_actual",
  "newPassword": "nueva_contraseña"
}
```

**Respuesta exitosa (200):**

```json
{
  "message": "Contraseña actualizada correctamente"
}
```

---

#### POST /api/auth/reset-password

Restablece contraseña mediante token.

**Body:**

```json
{
  "token": "token_received_email",
  "newPassword": "nueva_contraseña"
}
```

---

### Estudiantes

#### GET /api/students

Lista estudiantes con paginación y filtros.

**Parámetros de query:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `page` | number | Página actual (default: 1) |
| `limit` | number | Elementos por página (default: 10) |
| `search` | string | Término de búsqueda |
| `careerId` | number | Filtrar por carrera |
| `status` | number | Filtrar por estado (1=activo, 0=inactivo) |

**Respuesta exitosa (200):**

```json
{
  "data": [
    {
      "studentId": 1,
      "firstName": "Juan",
      "lastName": "Pérez",
      "identificationNumber": "12345678",
      "careerName": "Ingeniería de Sistemas",
      "semester": 5,
      "section": "A",
      "status": 1
    }
  ],
  "page": 1,
  "limit": 10,
  "total": 50,
  "totalPages": 5
}
```

---

#### POST /api/students

Crea un nuevo estudiante.

**Body:**

```json
{
  "firstName": "Juan",
  "lastName": "Pérez",
  "identificationNumber": "12345678",
  "email": "juan.perez@estudiante.unefa.edu.ve",
  "phone": "04141234567",
  "careerId": 1,
  "semester": 5,
  "section": "A",
  "regime": "regular",
  "studentType": "civil",
  "gender": "M",
  "birthDate": "1998-05-15",
  "civilStatus": "soltero",
  "address": "Carrera 5, Casa 12"
}
```

**Respuesta exitosa (201):**

```json
{
  "studentId": 1,
  "firstName": "Juan",
  "lastName": "Pérez",
  "identificationNumber": "12345678",
  "status": 1,
  "registrationDate": "2026-03-03"
}
```

---

#### PUT /api/students/:id

Actualiza un estudiante existente.

**Body:**

```json
{
  "firstName": "Juan Carlos",
  "semester": 6,
  "section": "B"
}
```

---

#### DELETE /api/students/:id

Elimina (soft delete) un estudiante.

**Respuesta exitosa (204):** Sin contenido

---

#### PATCH /api/students/:id/status

Cambia el estado de un estudiante.

**Body:**

```json
{
  "status": 0
}
```

---

#### GET /api/students/export

Exporta estudiantes a Excel.

**Parámetros de query:** Mismos que GET /api/students

**Respuesta:** Archivo Excel (.xlsx)

---

### Tutores

#### GET /api/tutors

Lista tutores con paginación.

**Parámetros de query:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `page` | number | Página actual |
| `limit` | number | Elementos por página |
| `search` | string | Búsqueda por nombre o cédula |

---

#### POST /api/tutors

Crea un nuevo tutor.

**Body:**

```json
{
  "firstName": "María",
  "lastName": "González",
  "identificationNumber": "87654321",
  "email": "maria.gonzalez@unefa.edu.ve",
  "phone": "04161234567",
  "careerId": 1,
  "academicRank": "Titular",
  "maximumHours": 20
}
```

---

### Instituciones

#### GET /api/institutions

Lista instituciones receptoras.

**Body:**

```json
{
  "name": "Hospital Central",
  "rif": "J-12345678-9",
  "address": "Av. Principal, Ciudad",
  "phone": "02121234567",
  "email": "contacto@hospital.com",
  "type": "hospitalaria",
  "state": "Caracas",
  "city": "Libertador"
}
```

---

### Carreras

#### GET /api/careers

Lista todas las carreras.

**Respuesta exitosa (200):**

```json
{
  "data": [
    {
      "careerId": 1,
      "careerName": "Ingeniería de Sistemas",
      "careerCode": "SIS",
      "duration": 10,
      "type": "larga",
      "status": 1
    }
  ]
}
```

---

#### POST /api/careers

Crea una carrera.

**Body:**

```json
{
  "careerName": "Ingeniería de Sistemas",
  "careerCode": "SIS",
  "duration": 10,
  "type": "larga",
  "description": "Carrera de Ingeniería de Sistemas"
}
```

---

### Períodos

#### GET /api/periodos

Lista períodos académicos.

---

#### GET /api/periodos/active

Obtiene el período académico activo actual.

**Respuesta exitosa (200):**

```json
{
  "periodId": 1,
  "periodName": "Período 2026-1",
  "startDate": "2026-01-15",
  "endDate": "2026-07-15",
  "status": "active"
}
```

---

#### POST /api/periodos

Crea un período académico.

**Body:**

```json
{
  "periodName": "Período 2026-2",
  "startDate": "2026-08-15",
  "endDate": "2026-12-15",
  "status": "planned"
}
```

---

### Pre-inscripciones

#### GET /api/pre-enrollments

Lista pre-inscripciones.

---

#### POST /api/pre-enrollments

Crea una pre-inscripción.

**Body:**

```json
{
  "studentId": 1,
  "periodId": 1,
  "institutionId": 1,
  "internshipTypeId": 1,
  "proposedStartDate": "2026-08-01"
}
```

---

### Inscripciones

#### GET /api/enrollments

Lista inscripciones con paginación.

---

#### POST /api/enrollments

Crea una inscripción正式.

**Body:**

```json
{
  "studentId": 1,
  "periodId": 1,
  "institutionId": 1,
  "tutorId": 1,
  "internshipTypeId": 1,
  "startDate": "2026-08-01",
  "endDate": "2026-12-15",
  "hoursRequired": 480,
  "initialLetterDate": "2026-07-20"
}
```

---

### Seguimiento

#### GET /api/tracking

Lista seguimientos de pasantías.

**Parámetros de query:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `studentId` | number | Filtrar por estudiante |
| `tutorId` | number | Filtrar por tutor |
| `periodId` | number | Filtrar por período |

---

#### POST /api/tracking

Registra una visita de seguimiento.

**Body:**

```json
{
  "studentId": 1,
  "visitDate": "2026-09-15",
  "visitType": "presencial",
  "hoursVisited": 4,
  "observations": "El estudiante muestra buen progreso",
  "tutorId": 1
}
```

---

### Evaluaciones

#### GET /api/evaluations

Lista evaluaciones.

**Tipos de evaluación:**

- Institucional (40%)
- Académico (30%)
- Comité (30%)

---

#### POST /api/evaluations

Crea una evaluación.

**Body:**

```json
{
  "studentId": 1,
  "periodId": 1,
  "evaluationType": "institucional",
  "score": 18,
  "maxScore": 20,
  "comments": "Excelente desempeño",
  "evaluatorId": 1
}
```

---

### Dashboard

#### GET /api/dashboard/stats

Estadísticas generales del sistema.

**Respuesta exitosa (200):**

```json
{
  "totalStudents": 150,
  "activeInternships": 45,
  "completedInternships": 80,
  "pendingEvaluations": 12,
  "activeTutors": 8,
  "partnerInstitutions": 25
}
```

---

#### GET /api/dashboard/chart-data

Datos para gráficos del dashboard.

**Respuesta exitosa (200):**

```json
{
  "enrollmentsByMonth": [
    { "month": "Enero", "count": 10 },
    { "month": "Febrero", "count": 15 }
  ],
  "studentsByCareer": [
    { "career": "Sistemas", "count": 50 },
    { "career": "Enfermería", "count": 30 }
  ],
  "internshipStatus": [
    { "status": "En proceso", "count": 45 },
    { "status": "Completadas", "count": 80 }
  ]
}
```

---

### Dashboard Tutor

#### GET /api/tutor/students

Lista estudiantes asignados al tutor autenticado.

---

#### GET /api/tutor/tracking

Lista seguimientos realizados por el tutor.

---

#### GET /api/tutor/stats

Estadísticas del tutor.

---

### Dashboard Estudiante

#### GET /api/student/info

Información del estudiante autenticado.

---

#### GET /api/student/practice

Datos de la práctica profesional activa.

**Respuesta exitosa (200):**

```json
{
  "practiceId": 1,
  "institution": "Hospital Central",
  "tutor": "Dra. María González",
  "startDate": "2026-08-01",
  "endDate": "2026-12-15",
  "hoursRequired": 480,
  "hoursCompleted": 120,
  "status": "en_proceso"
}
```

---

### Notificaciones

#### GET /api/notifications/stream

Endpoint SSE para notificaciones en tiempo real.

**Encabezados requeridos:**

```
Accept: text/event-stream
Cache-Control: no-cache
```

---

### Documentos

#### POST /api/documents

Sube un documento (carta, informe, constancia).

**Content-Type:** multipart/form-data

**Campos:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `file` | File | Archivo a subir |
| `studentId` | number | ID del estudiante |
| `documentType` | string | Tipo de documento |
| `description` | string | Descripción opcional |

**Tipos de documento:**

- carta_presentacion
- informe_final
- constancia
- evaluacion

---

### Bitácora

#### GET /api/activity-logs

Lista registros de bitácora de actividades.

---

#### POST /api/activity-log

Registra actividad diaria.

**Body:**

```json
{
  "studentId": 1,
  "activityDate": "2026-09-15",
  "activityType": "diaria",
  "hours": 8,
  "description": "Desarrollo de módulo de inventario",
  "supervisorObservation": "Buen desempeño"
}
```

---

### Solicitudes

#### GET /api/student/requests

Lista solicitudes del estudiante.

---

#### POST /api/student/requests

Crea una solicitud.

**Body:**

```json
{
  "requestType": "cambio_institucion",
  "description": "Solicito cambio por razones de ubicación",
  "priority": "normal"
}
```

---

### Tema de Usuario

#### GET /api/user/theme

Obtiene el tema de color del usuario.

---

#### PUT /api/user/theme

Actualiza el tema de color.

**Body:**

```json
{
  "brandColor": "blue"
}
```

**Colores disponibles:** blue, green, purple, orange, red, pink, teal, indigo

---

### Backups

#### POST /api/backups

Crea un backup de la base de datos.

---

#### GET /api/backups/:id/download

Descarga un backup existente.

---

### Listas de Configuración

#### GET /api/lists

Lista todas las listas de configuración.

---

#### GET /api/lists/name/:name

Obtiene valores de una lista por nombre.

**Ejemplo:** `/api/lists/name/estados`

---

## Códigos de Respuesta HTTP

| Código | Descripción |
|--------|-------------|
| 200 | OK - Solicitud exitosa |
| 201 | Created - Recurso creado |
| 204 | No Content - Respuesta sin contenido |
| 400 | Bad Request - Solicitud inválida |
| 401 | Unauthorized - No autenticado |
| 403 | Forbidden - Sin permisos |
| 404 | Not Found - Recurso no encontrado |
| 409 | Conflict - Conflicto de datos |
| 422 | Unprocessable Entity - Validación fallida |
| 429 | Too Many Requests - Rate limit excedido |
| 500 | Internal Server Error - Error interno |
| 503 | Service Unavailable - Servicio no disponible |

---

## Formato de Errores

```json
{
  "message": "Mensaje de error para el usuario",
  "error": "Detalle técnico del error",
  "code": "ERROR_CODE",
  "details": "Información adicional"
}
```

### Códigos de Error Comunes

| Código | Descripción |
|--------|-------------|
| INVALID_CREDENTIALS | Credenciales incorrectas |
| TOKEN_EXPIRED | Token de sesión vencido |
| DUPLICATE_ENTRY | Registro duplicado |
| RECORD_NOT_FOUND | Registro no encontrado |
| VALIDATION_ERROR | Error de validación |
| PERMISSION_DENIED | Permisos insuficientes |
| DATABASE_ERROR | Error de base de datos |

---

## Paginación

### Parámetros

| Parámetro | Default | Máximo | Descripción |
|-----------|---------|--------|-------------|
| `page` | 1 | 100 | Número de página |
| `limit` | 10 | 100 | Elementos por página |

### Respuesta

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

## Rate Limiting

Los endpoints sensibles aplican rate limiting:

| Endpoint | Límite |
|----------|--------|
| `/api/auth/login` | 10/minuto |
| `/api/auth/*` | 60/minuto |
| `/api/ai/chat` | 20/minuto |

**Respuesta cuando se excede (429):**

```json
{
  "message": "Demasiadas solicitudes. Intente más tarde.",
  "retryAfter": 60
}
```

---

## Versionado

La API actualmente no usa versionado explícito. Se recomienda usar el prefijo `/api/v1/` para futuras versiones.

---

## Webhooks (Futuro)

Planeado para futuras versiones:

- `internship.completed`
- `evaluation.submitted`
- `document.uploaded`
