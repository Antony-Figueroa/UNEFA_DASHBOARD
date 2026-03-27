# Guía de Interfaz: Login y Autenticación

## 1. Descripción General

La pantalla de **Login** es el **punto de entrada** al sistema UNEFA Dashboard. Es la primera interfaz que ve cualquier usuario (Administrador, Asistente, Tutor o Estudiante) al acceder a la aplicación.

### Propósito

- Autenticar usuarios mediante cédula de identidad y contraseña
- Gestionar sesiones seguras con cookies HttpOnly
- Proteger el acceso a las funcionalidades del sistema

### Rutas del Módulo

| Ruta | Componente | Descripción |
|------|------------|-------------|
| `/signin` | `SignIn.tsx` | Pantalla principal de login |
| `/password-recovery` | `PasswordRecovery.tsx` | Recuperación de contraseña |
| `/first-login` | `FirstLogin.tsx` | Configuración obligatoria de cuenta |

### Roles que Acceden

| Rol | Acceso |
|-----|--------|
| Todos los usuarios | ✅ Sí |

---

## 2. Flujo de Usuario - Login

### Diagrama de Flujo

```
  ┌─────────────────────────────────────────────────────────────────┐
  │                        PANTALLA LOGIN                           │
  └─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │  Usuario ingresa CI     │
                    │  (Formato V-00.000.000) │
                    └─────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │  Usuario ingresa        │
                    │  contraseña             │
                    └─────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │  Click "Iniciar Sesión" │
                    └─────────────────────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              ▼                   ▼                   ▼
        ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
        │  Login      │     │  Login      │     │  Login      │
        │  Exitoso    │     │  Requiere   │     │  Fallido    │
        │             │     │  Cambio     │     │             │
        │             │     │  Contraseña │     │             │
        └─────────────┘     └─────────────┘     └─────────────┘
              │                   │                   │
              ▼                   ▼                   ▼
        ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
        │ Redirigir   │     │ Redirigir   │     │ Mostrar     │
        │ /dashboard  │     │ /first-login│     │ Toast Error │
        └─────────────┘     └─────────────┘     └─────────────┘
```

### Pasos del Flujo

1. **Usuario entra a la app** → Se muestra pantalla de Login
2. **Usuario ingresa Cédula** → Formato automático V-00.000.000
3. **Usuario ingresa Contraseña** → Puede ver/ocultar
4. **Click en "Iniciar Sesión"** → Loading state
5. **Validación exitosa** → Redirige según rol
6. **Validación fallida** → Muestra error con intentos restantes

---

## 3. Componentes Visuales - Login

### Estructura del Formulario

```
┌──────────────────────────────────────────────┐
│  [← Volver al inicio]                        │
│                                              │
│  BIENVENIDO                                  │
│  Ingresa tu cédula y contraseña para         │
│  acceder al Sistema de Gestión de Prácticas  │
│  Profesionales.                              │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  Cédula de Identidad                   │  │
│  │  V00.000.000                           │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  Contraseña                    [👁]    │  │
│  │  ************                          │  │
│  └────────────────────────────────────────┘  │
│                                              │
│         ¿Olvidó su contraseña?               │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │        INICIAR SESIÓN                  │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ─────────────────────────────────────────   │
│  Conexión Segura  •  Datos Protegidos        │
└──────────────────────────────────────────────┘
```

### Elementos UI

| Elemento | Tipo | Descripción |
|----------|------|-------------|
| Link "Volver al inicio" | Link | Navega a página principal pública |
| Título "Bienvenido" | Heading | Mensaje de bienvenida |
| Descripción | Text | Explicación del sistema |
| Input Cédula | Text input | Campo con formato automático |
| Input Contraseña | Password input | Con toggle mostrar/ocultar |
| Link "¿Olvidó su contraseña?" | Link | Navega a recuperación |
| Botón "Iniciar Sesión" | Button | Submit del formulario |
| Indicadores de seguridad | Badges | Conexión segura, datos protegidos |

---

## 4. Formulario - Login

### 4.1 Campo: Cédula de Identidad

| Propiedad | Valor |
|-----------|-------|
| **ID** | `userCi` |
| **Tipo** | `text` |
| **Label** | Cédula de Identidad |
| **Placeholder** | V00.000.000 |
| **Required** | ✅ Sí |
| **Max Length** | 12 caracteres |
| **Autocomplete** | `username` |

#### Formato Automático

El sistema aplica formato automático venezolano:
- **Entrada**: `V12345678` o `12345678`
- **Visual**: `V-12.345.678`

#### Validaciones

| Validación | Regla | Mensaje de Error |
|------------|-------|------------------|
| Required | Campo obligatorio | (nativo HTML) |
| Caracteres permitidos | Solo V, E y números | Se filtran automáticamente |
| Longitud máx. | 8 dígitos + prefijo | Se trunca automáticamente |
| Envío | Se limpia antes de enviar | Solo números + prefijo |

#### Funciones de Formateo

```typescript
// src/utils/inputFormat.ts
export const formatCedulaDisplay = (value: string): string => {
  // Convierte a mayúsculas
  // Extrae prefijo (V/E)
  // Limita a 8 dígitos
  // Formatea: V-00.000.000
};

export const cleanCedula = (value: string): string => {
  // Elimina puntos y guiones
  // Mantiene solo V/E + números
  // Limpio para API: V12345678
};

export const CEDULA_MAX_LENGTH = 12;
export const CEDULA_MAX_DIGITS = 8;
```

---

### 4.2 Campo: Contraseña

| Propiedad | Valor |
|-----------|-------|
| **ID** | `password` |
| **Tipo** | `password` (con toggle) |
| **Label** | Contraseña |
| **Placeholder** | Ingresa tu contraseña |
| **Required** | ✅ Sí |
| **Autocomplete** | `current-password` |

#### Toggle Mostrar/Ocultar

- **Icono por defecto**: Ojo cerrado (`EyeClosedIcon`)
- **Icono al hacer click**: Ojo abierto (`EyeIcon`)
- **Accesibilidad**: `aria-label` dinámico

#### Estados

| Estado | Apariencia |
|--------|------------|
| Default | Contraseña oculta con toggle |
| Focused | Border brand con ring |
| Typed | Muestra caracteres ingresados |
| Error | Border rojo (viene del servidor) |

---

### 4.3 Botón: Iniciar Sesión

| Propiedad | Valor |
|-----------|-------|
| **Tipo** | `submit` |
| **Texto default** | Iniciar Sesión |
| **Texto loading** | Verificando... |
| **Disabled** | `loading \|\| !userCi \|\| !password` |

#### Estados

| Estado | Apariencia |
|--------|------------|
| Default | Brand color, texto blanco |
| Hover | Color ligeramente más oscuro |
| Disabled | Gris, cursor not-allowed |
| Loading | Spinner + "Verificando..." |

---

## 5. Envío de Datos - Login

### 5.1 Endpoint

```
POST /api/auth/login
```

### 5.2 Headers

```typescript
{
  "Content-Type": "application/json"
}
```

### 5.3 Payload (Request Body)

```typescript
{
  "userCi": "V12345678",    // Cédula limpia (sin formato)
  "password": "********"    // Contraseña del usuario
}
```

### 5.4 Respuestas del Servidor

#### ✅ Éxito - Login Normal

```typescript
{
  "message": "Login exitoso",
  "user": {
    "id": 1,
    "userCi": "V12345678",
    "name": "Juan",
    "surname": "Pérez",
    "email": "juan@unefa.edu.ve",
    "role": 1
  }
}
```

#### ⚠️ Éxito - Requiere Cambio de Contraseña

```typescript
{
  "requirePasswordChange": true,
  "userId": 1,
  "message": "Debe cambiar su contraseña"
}
```

#### ❌ Error - Credenciales Inválidas

```typescript
{
  "message": "Las credenciales ingresadas no son válidas. Por favor, verifique su número de cédula."
}
```

#### ❌ Error - Usuario No Encontrado

```typescript
{
  "message": "Las credenciales ingresadas no son válidas. Por favor, verifique su número de cédula."
}
```

#### ❌ Error - Cuenta Bloqueada (Intentos)

```typescript
{
  "message": "Cuenta bloqueada por demasiados intentos fallidos. Intente de nuevo en 1 día."
}
```

#### ❌ Error - Cuenta Bloqueada Temporal

```typescript
{
  "message": "Cuenta bloqueada temporalmente por seguridad. Intente de nuevo en X minutos."
}
```

#### ❌ Error - Contraseña Incorrecta (con intentos restantes)

```typescript
{
  "message": "Credenciales inválidas",
  "attemptsRemaining": 3  // < 3 muestra warning
}
```

#### ❌ Error - Conexión

```typescript
{
  "message": "No se pudo conectar con el servidor. Verifique que el servidor esté activo e inténtelo nuevamente."
}
```

---

## 6. Comportamiento del Frontend

### 6.1 Validaciones en Cliente

```typescript
// El botón está disabled hasta que ambos campos tengan contenido
disabled={loading || !userCi || !password}
```

### 6.2 Manejo de Errores

#### Intentos Restantes

| Intentos Restantes | Tipo de Toast | Título |
|--------------------|---------------|--------|
| > 2 | Error | Error de Acceso |
| ≤ 2 | Warning | Aviso de Seguridad |
| 0 | Error | Cuenta Bloqueada |

#### Errores de Red

| Condición | Título | Mensaje |
|-----------|--------|---------|
| `ERR_NETWORK` | Error de Conexión | No se pudo conectar con el servidor... |
| Sin respuesta | Error de Conexión | No se pudo conectar con el servidor... |

### 6.3 Redirecciones

| Condición | Ruta Destino |
|-----------|--------------|
| Login exitoso | `/dashboard` |
| Requiere cambio contraseña | `/first-login` (con `state: { userId }`) |
| Login desde otra página | Guardado en `location.state.message` |

### 6.4 Sesión Expirada

Si la sesión expiró, al intentar acceder a una ruta protegida:
1. Se guarda en `sessionStorage`: `auth_redirect_reason = 'expired'`
2. Se redirige a `/signin`
3. Se muestra toast: "Su sesión ha finalizado por seguridad..."

---

## 7. Seguridad

### 7.1 Protección en Backend

| Mecanismo | Descripción |
|-----------|-------------|
| **Rate Limiting** | 10 intentos por minuto por IP |
| **Cookie HttpOnly** | Token almacenado sin acceso JavaScript |
| **Intentos Fallidos** | Máximo 5 (configurable), luego bloqueo |
| **Bloqueo Temporal** | 1 día por defecto tras exceder intentos |
| **Auditoría** | Se registra cada intento (éxito/fallo) |

### 7.2 Cookie de Sesión

```typescript
res.cookie('auth_token', token, {
  httpOnly: true,           // No accesible via JS
  secure: true,            // Solo HTTPS en producción
  sameSite: 'none' in prod, // Cross-site en prod, lax en dev
  maxAge: 60 * 60 * 1000, // 1 hora (configurable)
  path: '/'
});
```

### 7.3 Auditoría

Cada intento de login genera un registro en la tabla de auditoría:
- Usuario (si existe)
- CI
- Acción: `LOGIN_SUCCESS`, `LOGIN_FAILED`, `ACCOUNT_LOCKED`
- IP del cliente
- User-Agent

---

## 8. Credenciales de Prueba

Tras ejecutar las migraciones de BD:

| Rol | Cédula | Contraseña |
|-----|--------|------------|
| Administrador | admin@unefa.edu.ve | admin123 |
| Asistente | asistente@unefa.edu.ve | asis123 |
| Tutor | tutor@unefa.edu.ve | tutor123 |
| Estudiante | estudiante@test.com | estu123 |

> **Nota**: En la base de datos, las contraseñas están hasheadas con bcrypt. Las contraseñas reales pueden variar. Consulta `DB-postgres.sql` para ver las claves exactas.

---

## 9. Flujo: Recuperación de Contraseña

### 9.1 Descripción

Cuando un usuario olvida su contraseña, puede recuperarla de dos maneras:

1. **Por Correo Electrónico** - Recibe un enlace al email registrado
2. **Por Preguntas de Seguridad** - Responde 3 preguntas configuradas previamente

### 9.2 Ruta

```
/password-recovery
```

### 9.3 Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────────┐
│                  PANTALLA RECUPERAR CONTRASEÑA                  │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                    ┌───────────────────────────────┐
                    │  Seleccionar método:          │
                    │  [Por Correo] [Por Preguntas] │
                    └───────────────────────────────┘
                                  │
              ┌───────────────────┴───────────────────┐
              ▼                                       ▼
    ┌─────────────────────┐               ┌─────────────────────┐
    │    POR CORREO       │               │   POR PREGUNTAS     │
    └─────────────────────┘               └─────────────────────┘
              │                                       │
              ▼                                       ▼
    ┌─────────────────────┐               ┌─────────────────────┐
    │ Ingresa Cédula      │               │ Ingresa Cédula      │
    └─────────────────────┘               └─────────────────────┘
              │                                       │
              ▼                                       ▼
    ┌─────────────────────┐               ┌─────────────────────┐
    │ Enviar enlace       │               │ Obtener preguntas   │
    │ [Enviar enlace]     │               │ [Continuar]         │
    └─────────────────────┘               └─────────────────────┘
              │                                       │
              ▼                                       ▼
    ┌─────────────────────┐               ┌─────────────────────┐
    │ ✅ Success Message  │              │ Responder 3 preg.    │
    │ "Se envió enlace"   │               │ + Nueva contraseña  │
    └─────────────────────┘               └─────────────────────┘
                                                    │
                                                    ▼
                                          ┌─────────────────────┐
                                          │ ✅ Restablecer      │
                                          │ Contraseña          │
                                          └─────────────────────┘
                                                    │
                                                    ▼
                                          ┌─────────────────────┐
                                          │ Redirigir /signin   │
                                          └─────────────────────┘
```

---

### 9.4 Método: Por Correo

#### Campo: Cédula

| Propiedad | Valor |
|-----------|-------|
| **ID** | `userCi` |
| **Tipo** | `text` |
| **Placeholder** | V00.000.000 |
| **Required** | ✅ Sí |

#### UI

```
┌──────────────────────────────────────────────┐
│  [← Volver al inicio de sesión]              │
│                                              │
│  RECUPERAR CONTRASEÑA                        │
│  Ingresa tu cédula para recibir un enlace    │
│  de recuperación en tu correo registrado.    │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  Cédula de Identidad                   │  │
│  │  V00.000.000                           │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  Se enviará un enlace de recuperación al     │
│  correo registrado.                          │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │     ENVIAR ENLACE AL CORREO            │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

#### Endpoint

```
POST /api/auth/request-recovery
```

#### Payload

```typescript
{
  "userCi": "V12345678"
}
```

#### Respuesta Éxito

```typescript
{
  "success": true,
  "message": "Instrucciones enviadas al correo electrónico registrado."
}
```

---

### 9.5 Método: Por Preguntas de Seguridad

#### Paso 1: Ingresar Cédula

Igual que el método por correo.

#### Paso 2: Responder Preguntas + Nueva Contraseña

##### Campos del Formulario

| Campo | Tipo | Required | Validaciones |
|-------|------|----------|--------------|
| Pregunta 1 | text | ✅ Sí | Texto libre |
| Pregunta 2 | text | ✅ Sí | Texto libre |
| Pregunta 3 | text | ✅ Sí | Texto libre |
| Nueva Contraseña | password | ✅ Sí | Mín 12 caracteres, mayúscula, minúscula, número, carácter especial |
| Confirmar Contraseña | password | ✅ Sí | Debe coincidir |

##### UI del Formulario

```
┌──────────────────────────────────────────────┐
│  Responde las 3 preguntas de seguridad para  │
│  continuar.                                  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  1. ¿Nombre de tu primera mascota?     │  │
│  │  ___________________________________   │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  2. ¿Ciudad donde naciste?             │  │
│  │  ___________________________________   │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  3. ¿Marca de tu primer carro?         │  │
│  │  ___________________________________   │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  Nueva Contraseña            [👁]      │  │
│  │  **************                        │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  Requisitos de seguridad:                    │
│  ✓ 12+ caracteres  ✓ Mayúsculas             │
│  ✗ Minúsculas       ✗ Un número             │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  Confirmar Contraseña                  │  │
│  │  **************                        │  │
│  └────────────────────────────────────────┘  │
│                                              │
│       [Atrás]              [Restablecer]     │
└──────────────────────────────────────────────┘
```

##### Validación de Contraseña

```
Requisitos:
- ✅ Mínimo 12 caracteres
- ✅ Al menos una mayúscula (A-Z)
- ✅ Al menos una minúscula (a-z)
- ✅ Al menos un número (0-9)
- ✅ Al menos un carácter especial (!@#$%^&*...)
```

##### UI de Fortaleza de Contraseña

```
┌─────────────────────────────────────┐
│ Requisitos de seguridad:            │
│ ┌─────────────┬──────────────────┐  │
│ │ ✓           │ 12+ caracteres   │  │
│ │ ✓           │ Mayúsculas       │  │
│ │ ✗           │ Minúsculas       │  │
│ │ ✗           │ Un número        │  │
│ └─────────────┴──────────────────┘  │
└─────────────────────────────────────┘
```

#### Endpoints

**Obtener preguntas:**
```
GET /api/auth/recovery-questions/{userCi}
```

**Respuesta:**
```typescript
{
  "success": true,
  "questions": [
    { "id": 1, "description": "¿Nombre de tu primera mascota?" },
    { "id": 2, "description": "¿Ciudad donde naciste?" },
    { "id": 3, "description": "¿Marca de tu primer carro?" }
  ],
  "email": "j***@unefa.edu.ve"
}
```

**Restablecer:**
```
POST /api/auth/verify-answers-reset
```

**Payload:**
```typescript
{
  "userCi": "V12345678",
  "answers": [
    { "questionId": 1, "answer": "Firulais" },
    { "questionId": 2, "answer": "Caracas" },
    { "questionId": 3, "answer": "Toyota" }
  ],
  "newPassword": "NuevaContraseña123!"
}
```

**Respuesta:**
```typescript
{
  "success": true,
  "message": "Su contraseña ha sido actualizada correctamente."
}
```

---

### 9.6 Método: Por Enlace de Correo (Token)

Si el usuario recibe el enlace por correo y hace clic, llega con un token en la URL:

```
/password-recovery?token=abc123xyz
```

#### UI en Este Caso

```
┌──────────────────────────────────────────────┐
│  Nueva Contraseña                            │
│  Crea una nueva contraseña segura            │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ Nueva Contraseña                       │  │
│  │ **************              [👁]       │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ Confirmar Contraseña                   │  │
│  │ **************                         │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  [        CAMBIAR CONTRASEÑA              ]  │
└──────────────────────────────────────────────┘
```

#### Endpoint

```
POST /api/auth/reset-with-token
```

**Payload:**
```typescript
{
  "token": "abc123xyz",
  "newPassword": "NuevaContraseña123!"
}
```

**Respuesta:**
```typescript
{
  "success": true,
  "message": "Su contraseña ha sido actualizada correctamente."
}
```

---

## 10. Flujo: First Login (Cambio Obligatorio)

### 10.1 Descripción

Cuando un usuario inicia sesión por primera vez (o el administrador resetea su contraseña), el servidor retorna `requirePasswordChange: true`. El usuario DEBE configurar su cuenta antes de acceder al sistema.

### 10.2 Ruta

```
/first-login
```

**Recibido desde:** `/signin` con `state: { userId: number }`

### 10.3 Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────────┐
│                    FIRST LOGIN / CONFIGURACIÓN                 │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │ Paso 1: Datos Personales│
                    │  ┌───────────────────┐  │
                    │  │ Primer Nombre *   │  │
                    │  │ Segundo Nombre    │  │
                    │  │ Primer Apellido * │  │
                    │  │ Segundo Apellido  │  │
                    │  │ Teléfono *        │  │
                    │  │ Email *           │  │
                    │  └───────────────────┘  │
                    │        [Siguiente →]    │
                    └─────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │  Paso 2: Seguridad      │
                    │  ┌───────────────────┐  │
                    │  │ Nueva Contraseña *│  │
                    │  │ Confirmar *       │  │
                    │  └───────────────────┘  │
                    │        [Siguiente →]    │
                    └─────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │  Paso 3: Preguntas      │
                    │  ┌───────────────────┐  │
                    │  │ Pregunta 1 *      │  │
                    │  │ Pregunta 2 *      │  │
                    │  │ Pregunta 3 *      │  │
                    │  └───────────────────┘  │
                    │                         │
                    │  □ Acepto Términos *    │
                    │                         │
                    │  [← Atrás] [Finalizar]  │
                    └─────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │ ✅ Cuenta Configurada  │
                    │   Redirigir a /signin   │
                    └─────────────────────────┘
```

### 10.4 Paso 1: Datos Personales

#### Campos

| Campo | Tipo | Required | Validaciones |
|-------|------|----------|--------------|
| Primer Nombre | text | ✅ Sí | Solo letras, espacios, apostrophes |
| Segundo Nombre | text | ❌ No | Solo letras, espacios, apostrophes |
| Primer Apellido | text | ✅ Sí | Solo letras, espacios, apostrophes |
| Segundo Apellido | text | ❌ No | Solo letras, espacios, apostrophes |
| Prefijo Teléfono | select | ✅ Sí | 0412, 0414, 0416, 0424, 0426, 0212, etc. |
| Número Teléfono | text | ✅ Sí | Exactamente 7 dígitos |
| Correo Electrónico | email | ✅ Sí | Formato email válido |

#### UI del Paso 1

```
┌─────────────────────────────────────────────────────┐
│  ○─────────○─────────○  (Stepper visual)            │
│  Datos    Seguridad  Preguntas                      │
│  Personales                                         │
│                                                     │
│  INFORMACIÓN PERSONAL                               │
│  Ingrese sus datos personales                       │
│                                                     │
│  ┌──────────────────┐ ┌──────────────────┐          │
│  │ Primer Nombre *  │ │ Segundo Nombre   │          │
│  │ ________________ │ │ ________________ │          │
│  └──────────────────┘ └──────────────────┘          │
│                                                     │
│  ┌──────────────────┐ ┌──────────────────┐          │
│  │ Primer Apellido *│ │ Segundo Apellido │          │
│  │ ________________ │ │ ________________ │          │
│  └──────────────────┘ └──────────────────┘          │
│                                                     │
│  Teléfono *                                         │
│  ┌─────────┐ ┌──────────────────┐                   │
│  │  0412  ▼│ │  ______________  │                   │
│  └─────────┘ └──────────────────┘                   │
│                                                     │
│  Correo Electrónico *                               │
│  ┌──────────────────────────────────────────┐       │
│  │  _______________________________________  │      │
│  └──────────────────────────────────────────┘       │
│                                                     │
│                              [Siguiente →]          │
└─────────────────────────────────────────────────────┘
```

#### Validaciones en Cliente

```typescript
// firstLoginValidation.ts
firstName: z.string()
  .min(1, "El primer nombre es obligatorio")
  .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s']+$/, "Solo letras, espacios y apóstrofes"),

phoneNumber: z.string()
  .length(7, "El número debe tener exactamente 7 dígitos")
  .regex(/^\d+$/, "Solo se admiten números"),

email: z.string()
  .email("Email inválido")
  .min(1, "El email es obligatorio"),
```

---

### 10.5 Paso 2: Seguridad

#### Campos

| Campo | Tipo | Required | Validaciones |
|-------|------|----------|--------------|
| Nueva Contraseña | password | ✅ Sí | Ver tabla abajo |
| Confirmar Contraseña | password | ✅ Sí | Debe coincidir con nueva |

#### UI del Paso 2

```
┌─────────────────────────────────────────────────────┐
│  ○─────────○─────────○  (Stepper visual)           │
│  Datos    Seguridad  Preguntas                      │
│            Seguridad                                │
│                                                     │
│  SEGURIDAD                                         │
│  Cree una contraseña segura                        │
│                                                     │
│  Nueva Contraseña *                                │
│  ┌────────────────────────────────────────┐  [👁]  │
│  │  **********************************     │       │
│  └────────────────────────────────────────┘        │
│                                                     │
│  Fortaleza: Media 60%                              │
│  [████████████░░░░░░░░░░░░░░░░░░░░░░░]           │
│  ┌─────────────┬──────────────────┐               │
│  │ ✓           │ 12+ caracteres   │               │
│  │ ✓           │ Una mayúscula   │               │
│  │ ✗           │ Una minúscula    │               │
│  │ ✓           │ Un número        │               │
│  │ ✓           │ Carácter especial│               │
│  └─────────────┴──────────────────┘               │
│                                                     │
│  Confirmar Contraseña *                            │
│  ┌────────────────────────────────────────┐        │
│  │  **********************************     │        │
│  └────────────────────────────────────────┘        │
│  ✓ Las contraseñas coinciden                      │
│                                                     │
│  [Atrás]              [Siguiente →]               │
└─────────────────────────────────────────────────────┘
```

#### Validación de Contraseña

```
REQUISITOS OBLIGATORIOS:
├── Mínimo 12 caracteres
├── Al menos una mayúscula (A-Z)
├── Al menos una minúscula (a-z)
├── Al menos un número (0-9)
├── Al menos un carácter especial (!@#$%^&*...)
└── Debe coincidir con confirmación
```

#### Expresiones Regulares

```typescript
const passwordRegex = {
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  number: /[0-9]/,
  special: /[!@#$%^&*()_+~`|}{[\]:;?><,./\-=]/
};
```

---

### 10.6 Paso 3: Preguntas de Seguridad

#### Descripción

El usuario debe configurar 3 preguntas de seguridad. Tiene 2 opciones por pregunta:

1. **Seleccionar pregunta preset** - De una lista predefinida
2. **Crear pregunta personalizada** - Escribiendo su propia pregunta

#### UI del Paso 3

```
┌─────────────────────────────────────────────────────┐
│  ○─────────○─────────○  (Stepper visual)           │
│  Datos    Seguridad  Preguntas                      │
│                      PREGUNTAS DE SEGURIDAD       │
│  Configure 3 preguntas para recuperar su cuenta   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ Pregunta 1                    [Custom: ☐]  │   │
│  │ ┌─────────────────────────────┐            │   │
│  │ │ Seleccione una pregunta  ▼  │            │   │
│  │ └─────────────────────────────┘            │   │
│  │ Tu respuesta                              │   │
│  │ ______________________________________    │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ Pregunta 2                    [Custom: ☐]  │   │
│  │ ┌─────────────────────────────┐            │   │
│  │ │ Seleccione una pregunta  ▼  │            │   │
│  │ └─────────────────────────────┘            │   │
│  │ Tu respuesta                              │   │
│  │ ______________________________________    │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ Pregunta 3                    [Custom: ☐]  │   │
│  │ ┌─────────────────────────────┐            │   │
│  │ │ Seleccione una pregunta  ▼  │            │   │
│  │ └─────────────────────────────┘            │   │
│  │ Tu respuesta                              │   │
│  │ ______________________________________    │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ☑ Acepto los Términos y Condiciones *            │
│  He leído y acepto los Términos y...              │
│                                                     │
│  [Atrás]              [Finalizar Configuración]    │
└─────────────────────────────────────────────────────┘
```

#### Campos por Pregunta

| Campo | Tipo | Required | Notas |
|-------|------|----------|-------|
| Pregunta (preset) | select | Condicional | Si no es custom |
| Pregunta (custom) | text | Condicional | Si es custom |
| Respuesta | text | ✅ Sí | Texto libre |
| ¿Crear pregunta personalizada? | checkbox | ❌ No | Toggle para usar custom |

#### Opciones de Preguntas Preset

Obtenidas del endpoint:
```
GET /api/auth/preset-questions
```

#### Validaciones

```typescript
securityQuestions: z.array(
  z.object({
    questionId: z.union([z.number(), z.string()]).optional(),
    customQuestion: z.string().optional(),
    answer: z.string().min(1, "La respuesta es obligatoria"),
    isCustom: z.boolean().optional()
  }).refine(data => {
    // Si es custom: requiere customQuestion
    // Si no es custom: requiere questionId
  }, {
    message: "Seleccione una pregunta o cree una personalizada"
  })
).length(3, "Debe completar las 3 preguntas de seguridad")
```

---

### 10.7 Términos y Condiciones

#### Checkbox Requerido

```
☑ Acepto los Términos y Condiciones *

He leído y acepto los Términos y Condiciones del Sistema 
y la política de privacidad.
```

**Validación:** Debe estar marcado para poder enviar.

---

### 10.8 Envío de Datos

#### Endpoint

```
POST /api/auth/change-password
```

#### Payload

```typescript
{
  "userId": 1,
  "newPassword": "NuevaContraseña123!",
  "securityQuestions": [
    { "questionId": 1, "answer": "FIRULAYS" },
    { "questionId": 2, "answer": "CARACAS" },
    { "questionId": 3, "answer": "TOYOTA" }
  ],
  "profileData": {
    "name": "JUAN",
    "secondName": "PEDRO",
    "surname": "PÉREZ",
    "secondSurname": "GARCÍA",
    "phoneNumber": "04121234567",
    "email": "JUAN@UNefa.edu.ve"
  }
}
```

#### Respuesta

```typescript
{
  "success": true,
  "message": "Configuración completada exitosamente"
}
```

---

### 10.9 Comportamiento del Frontend

#### Navegación entre Pasos

- **Stepper visual** con 3 pasos
- Click en paso anterior para volver
- Validación antes de avanzar (solo campos del paso actual)

#### Validación por Paso

```typescript
// Paso 1 → Validar
await trigger(["firstName", "lastName", "phonePrefix", "phoneNumber", "email"]);

// Paso 2 → Validar
await trigger(["newPassword", "confirmPassword"]);

// Paso 3 → Validar
await trigger(["securityQuestions"]);
```

#### Estados del Botón Submit

| Estado | Condición | Texto |
|--------|-----------|-------|
| Default | `!loading && isValid && acceptTerms` | Finalizar Configuración |
| Disabled | `!isValid || !acceptTerms` | Finalizar Configuración |
| Loading | `loading` | Guardando... |

---

## 11. Archivos Relacionados

### Frontend

| Archivo | Descripción |
|---------|-------------|
| `src/pages/AuthPages/SignIn.tsx` | Página de Login |
| `src/components/auth/SignInForm.tsx` | Componente del formulario |
| `src/pages/AuthPages/PasswordRecovery.tsx` | Recuperación de contraseña |
| `src/pages/AuthPages/FirstLogin.tsx` | Configuración de primera vez |
| `src/features/auth/services/authService.ts` | Servicio API |
| `src/features/auth/constants/firstLoginValidation.ts` | Validaciones Zod |
| `src/utils/inputFormat.ts` | Utilidades de formato |
| `src/context/auth/AuthContext.tsx` | Contexto de autenticación |
| `src/context/toast/ToastContext.tsx` | Sistema de notificaciones |

### Backend

| Archivo | Descripción |
|---------|-------------|
| `backend/src/routes/auth.routes.ts` | Definición de rutas |
| `backend/src/controllers/auth.controller.ts` | Controlador de login |
| `backend/src/services/auth.service.ts` | Lógica de autenticación |
| `backend/src/middlewares/rate-limit.middleware.ts` | Rate limiting |

---

## 12. Casos Edge

| Caso | Comportamiento |
|------|----------------|
| First Login sin userId en state | Redirige a /signin |
| Sesión expira mientras escribe | Toast "Sesión expirada", redirige |
| Red lenta | Loading state visible |
| Contraseña no cumple requisitos | Botón disabled, muestra errores |
| Preguntas de seguridad duplicadas | Se filtran en el dropdown |
| Token de recuperación expirado | Error del servidor |
| Usuario ingresa letras en CI | Se filtran automáticamente |
| Usuario pega texto con espacios | Se limpian automáticamente |
| Servidor caido | Toast de error de conexión |

---

## 13. Próximos Pasos del Flujo

Tras un login exitoso:

| Rol | Redirige a |
|-----|------------|
| Administrador (role: 1) | `/dashboard` |
| Asistente (role: 2) | `/dashboard` |
| Tutor (role: 3) | `/tutor/dashboard` |
| Estudiante (role: 4) | `/student/dashboard` |
