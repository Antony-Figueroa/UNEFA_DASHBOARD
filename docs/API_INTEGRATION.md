# Documentación de Integración de API Supabase

Este documento detalla la estructura de la base de datos y la implementación de la API para el sistema TailAdmin.

## 1. Estructura de Tablas

### t_career (Carreras)
- **CAREER_ID**: int4 (PK, Auto-increment)
- **CAREER_NAME**: varchar(255)
- **CAREER_CODE**: int4
- **MINIMUM_GRADE**: float4
- **CAREER_ABBREVIATION**: varchar(20)
- **STATUS**: int2 (1: Activo, 0: Inactivo)
- **Relaciones**: Relación 1:N con `t_students`.

### t_students (Estudiantes)
- **STUDENTS_ID**: int4 (PK, Auto-increment)
- **STUDENTS_CI**: varchar(20) (Único)
- **NAME**: varchar(100)
- **SURNAME**: varchar(100)
- **EMAIL**: varchar(100)
- **CAREER_ID**: int4 (FK -> t_career)
- **STATUS**: int2
- **Relaciones**: FK hacia `t_career`.

### t_tutors (Tutores)
- **TUTOR_ID**: int4 (PK, Auto-increment)
- **TUTOR_CI**: varchar(20)
- **NAME**: varchar(100)
- **SURNAME**: varchar(100)
- **STATUS**: int2

### t_institution (Instituciones)
- **INSTITUTION_ID**: int4 (PK, Auto-increment)
- **INSTITUTION_NAME**: varchar(255)
- **STATUS**: int2

### t_institutional_responsible (Responsables)
- **RESPONSIBLE_ID**: int4 (PK, Auto-increment)
- **NAME**: varchar(100)
- **SURNAME**: varchar(100)
- **INSTITUTION_ID**: int4 (FK -> t_institution)
- **STATUS**: int2

---

## 2. Optimizaciones y Rendimiento

### Índices Recomendados
Para mejorar el rendimiento de las consultas, se deben crear los siguientes índices en Supabase:
- `idx_students_ci` en `t_students(STUDENTS_CI)`
- `idx_students_career` en `t_students(CAREER_ID)`
- `idx_tutors_ci` en `t_tutors(TUTOR_CI)`
- `idx_responsible_institution` en `t_institutional_responsible(INSTITUTION_ID)`

### Sistema de Caché
La API implementa un sistema de caché en memoria (`SimpleCache`) con un TTL por defecto de 5 minutos para las operaciones de lectura (GET). El caché se invalida automáticamente en operaciones de escritura (POST, PUT, DELETE, PATCH).

---

## 3. Seguridad y Autenticación

### Autenticación con Supabase Auth
El sistema utiliza **Supabase Auth** para la gestión de usuarios. Se han implementado las siguientes funcionalidades en el frontend:
- **Sign In**: Autenticación segura con email y contraseña.
- **Sign Up**: Registro de nuevos usuarios con metadatos adicionales (nombre, apellido).
- **Protección de Rutas**: Integración con el sistema de autenticación de Supabase.

### Seguridad de Credenciales
- **Backend**: Utiliza la `SERVICE_ROLE_KEY` para operaciones administrativas que requieren bypass de RLS (Row Level Security). Esta clave **NUNCA** se expone al cliente.
- **Frontend**: Utiliza la `ANON_KEY` para interactuar con Supabase de forma segura bajo las políticas de RLS.
- **Conexiones**: Todas las conexiones se realizan a través de **HTTPS** para garantizar el cifrado en tránsito.

### Validación de Datos (Zod)
Cada endpoint de escritura utiliza esquemas de **Zod** para validar la integridad de los datos antes de interactuar con la base de datos. Los esquemas se encuentran en `api/schemas.ts`.

### RBAC y Permisos de Tabla
Se recomienda configurar las siguientes políticas de RLS en Supabase para cada tabla:
1. **Lectura**: Permitida para usuarios autenticados.
2. **Escritura (Insert/Update/Delete)**: Restringida a usuarios con rol `ADMIN` o mediante la API de backend segura.

---

## 4. Ejemplos de Uso de la API

### Estudiantes (CRUD)
- **GET** `/api/students`: Obtiene todos los estudiantes (usa caché).
- **POST** `/api/students`: Crea un nuevo estudiante (valida con `studentSchema`).
- **PUT** `/api/students/:id`: Actualiza un estudiante existente.
- **PATCH** `/api/students/:id/status`: Cambia el estado (activo/inactivo).

### Ejemplo de Petición (Fetch)
```javascript
const response = await fetch('/api/students', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-user-role': 'ADMIN'
  },
  body: JSON.stringify({
    STUDENTS_CI: '12345678',
    NAME: 'Juan',
    SURNAME: 'Perez',
    GENDER: 'M',
    BIRTHDATE: '2000-01-01',
    EMAIL: 'juan@example.com',
    CAREER_ID: 1,
    // ... otros campos requeridos
  })
});
```
