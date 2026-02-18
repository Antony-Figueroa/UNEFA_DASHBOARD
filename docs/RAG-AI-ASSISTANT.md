# Documentacion del Sistema RAG - Asistente de IA UNEFA

## Indice

1. [Que es y como funciona](#1-que-es-y-como-funciona)
2. [Arquitectura general](#2-arquitectura-general)
3. [Flujo completo de un mensaje](#3-flujo-completo-de-un-mensaje)
4. [Componentes del sistema](#4-componentes-del-sistema)
5. [Deteccion de intencion (Intent Detection)](#5-deteccion-de-intencion)
6. [Consultas a la base de datos (RAG)](#6-consultas-a-la-base-de-datos)
7. [Modelo de IA y System Prompt](#7-modelo-de-ia-y-system-prompt)
8. [Persistencia de sesiones](#8-persistencia-de-sesiones)
9. [API Endpoints](#9-api-endpoints)
10. [Estructura de archivos](#10-estructura-de-archivos)
11. [Seguridad](#11-seguridad)
12. [Configuracion](#12-configuracion)
13. [Como agregar nuevas intenciones](#13-como-agregar-nuevas-intenciones)

---

## 1. Que es y como funciona

El Asistente de IA de UNEFA es un chatbot integrado al dashboard que responde preguntas sobre datos academicos del sistema. Utiliza una arquitectura **RAG (Retrieval-Augmented Generation)** que funciona asi:

1. El usuario hace una pregunta (ej: "Cuantos estudiantes activos hay?")
2. El backend **detecta la intencion** del mensaje (quiere datos de estudiantes)
3. El backend **consulta la base de datos** y obtiene los datos reales
4. Los datos se **inyectan en el prompt** como contexto
5. Se envia todo al modelo de IA (Gemini) que genera la respuesta
6. La respuesta llega en **streaming** (texto en tiempo real)

**Diferencia con el sistema anterior:**
- **Antes**: El frontend cargaba TODOS los datos del dashboard en el prompt y llamaba a Google AI directamente (API key expuesta, datos estaticos, modelo de 1B parametros)
- **Ahora**: El backend detecta que datos necesita, consulta solo lo relevante, y la API key esta segura en el servidor

---

## 2. Arquitectura general

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│                                                              │
│  useAIChat (hook) ──> BackendChatService ──> fetch SSE       │
│       │                                         │            │
│       │                                    streaming text    │
│       ▼                                         │            │
│  ChatHistoryService ──> API /ai/sessions        │            │
│                                                  ▼            │
│  ChatWindow ◄── MessageList ◄── MessageBubble (render)       │
└──────────────────────────┬──────────────────────────────────┘
                           │ POST /api/ai/chat
                           │ (con cookie de auth)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                               │
│                                                              │
│  ai.routes.ts ──> ai.controller.ts                           │
│                        │                                     │
│                        ├── 1. Detectar intencion              │
│                        │   (intent-detection.service.ts)      │
│                        │                                     │
│                        ├── 2. Consultar BD si hay intencion   │
│                        │   (ai.service.ts ──> Supabase)       │
│                        │                                     │
│                        ├── 3. Construir system prompt + datos │
│                        │                                     │
│                        └── 4. Enviar a Gemini (streaming)     │
│                            (google-ai.service.ts)             │
│                                    │                         │
│                               SSE chunks                     │
│                                    ▼                         │
│                            res.write() ──> Frontend           │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     BASE DE DATOS                            │
│                     (Supabase/PostgreSQL)                     │
│                                                              │
│  8 tablas permitidas:                                        │
│  t_students, t_career, t_internships_period, t_institution,  │
│  t_tutors, t_institution_manager, t_professional_practices,  │
│  t_user                                                      │
│                                                              │
│  Tabla de sesiones: t_chat_sessions                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Flujo completo de un mensaje

Ejemplo: El usuario escribe **"Cuantos estudiantes activos hay?"**

### Paso 1 - Frontend envia el mensaje
```
useAIChat.sendMessage("Cuantos estudiantes activos hay?")
  └── BackendChatService.streamChatFromBackend()
       └── POST /api/ai/chat
            Body: { messages: [{ role: "user", content: "Cuantos estudiantes activos hay?" }] }
            Credentials: cookie auth_token
```

### Paso 2 - Backend recibe y detecta intencion
```
ai.controller.ts: chatWithAI()
  └── detectIntent("Cuantos estudiantes activos hay?")
       └── Coincide con regex: /cu[aá]ntos?\s+estudiantes?\s+(activos?|hay)/i
       └── Resultado: { entity: "students", action: "count", filters: { STATUS: 1 } }
```

### Paso 3 - Backend consulta la BD (RAG)
```
fetchContextForIntent({ entity: "students", action: "count", filters: { STATUS: 1 } })
  └── aiService.executeQuery({ entity: "students", select: ["*"], filters: { STATUS: 1 }, limit: 10 })
       └── Supabase: SELECT * FROM t_students WHERE STATUS = 1 LIMIT 10
       └── Resultado: { data: [...14 estudiantes...], meta: { total: 14 } }
```

### Paso 4 - Backend construye el prompt
```
System Prompt = BASE_SYSTEM_PROMPT
  + CONTEXTO DEL USUARIO (nombre, rol, fecha)
  + DATOS DEL SISTEMA:
    [DATOS REALES DE LA BD - STUDENTS]
    Total encontrados: 14
    Registros devueltos: 10
    Datos: [{ STUDENT_ID: 1, FIRST_NAME: "Juan", ... }, ...]
```

### Paso 5 - Backend envia a Gemini con streaming
```
google-ai.service.ts: streamChat()
  └── Gemini recibe: system prompt con datos + historial de mensajes
  └── Genera respuesta: "Actualmente hay 14 estudiantes activos en el sistema."
  └── Envia por chunks via SSE
```

### Paso 6 - Frontend recibe streaming
```
BackendChatService lee SSE:
  data: {"text": "Actualmente"}
  data: {"text": " hay 14"}
  data: {"text": " estudiantes activos"}
  data: {"text": " en el sistema."}
  data: [DONE]

useStreamResponse acumula el texto y lo renderiza en tiempo real
```

### Paso 7 - Se guarda la sesion
```
ChatHistoryService.saveSession()
  └── PUT /api/ai/sessions/:id
       └── Guarda mensajes en t_chat_sessions (JSONB)
```

---

## 4. Componentes del sistema

### Backend (4 servicios principales)

| Servicio | Archivo | Responsabilidad |
|----------|---------|-----------------|
| **Google AI** | `google-ai.service.ts` | Comunicacion con Gemini (streaming y no-streaming) |
| **Intent Detection** | `intent-detection.service.ts` | Detectar que quiere el usuario y ejecutar query a BD |
| **AI Query** | `ai.service.ts` | Ejecutar consultas seguras a la BD con cache |
| **Chat Sessions** | `chat-sessions.service.ts` | CRUD de sesiones de chat en PostgreSQL |

### Frontend (3 archivos principales)

| Archivo | Responsabilidad |
|---------|-----------------|
| `useAIChat.ts` | Hook principal: maneja estado, envia mensajes, gestiona sesiones |
| `BackendChatService.ts` | Hace fetch SSE al backend y parsea los chunks |
| `ChatHistoryService.ts` | CRUD de sesiones via API del backend |

---

## 5. Deteccion de intencion

El archivo `intent-detection.service.ts` usa **patrones regex** para clasificar el mensaje del usuario.

### Como funciona

```typescript
detectIntent("cuantos estudiantes activos hay?")
// Resultado: { entity: "students", action: "count", filters: { STATUS: 1 } }

detectIntent("hola")
// Resultado: { entity: null, action: "none" }
// (no se consulta la BD, Gemini responde solo con el saludo)
```

### Intenciones soportadas

| Intencion | Entidad | Accion | Ejemplos de mensajes |
|-----------|---------|--------|---------------------|
| Estudiantes activos | `students` | `count` | "cuantos estudiantes activos hay", "total de estudiantes" |
| Listar estudiantes | `students` | `list` | "lista de estudiantes", "mostrar estudiantes" |
| Ultimo estudiante | `students` | `detail` | "ultimo estudiante registrado" |
| Carreras | `careers` | `list` | "que carreras hay", "lista de carreras" |
| Periodo actual | `periods` | `detail` | "periodo actual", "periodo en curso" |
| Listar periodos | `periods` | `list` | "resumen de periodos", "historial de periodos" |
| Tutores | `tutors` | `list` | "lista de tutores", "cuantos tutores hay" |
| Instituciones | `institutions` | `list` | "instituciones registradas", "cuantas empresas hay" |
| Pasantias | `internships` | `list` | "pasantias activas", "cuantas pasantias" |
| Inscripciones | `students` | `summary` | "como van las inscripciones", "progreso de inscripciones" |
| Procesos activos | `periods` | `status` | "que procesos estan activos hoy" |
| Usuarios | `users` | `list` | "lista de usuarios", "cuantos usuarios hay" |

### Si no coincide ninguna intencion

Cuando el mensaje no coincide con ningun patron (saludos, preguntas generales, etc.), el sistema:
1. No consulta la BD
2. Envia solo el system prompt base a Gemini
3. Gemini responde con su conocimiento general + las reglas del prompt

---

## 6. Consultas a la base de datos

El servicio `ai.service.ts` ejecuta las consultas de forma segura.

### Tablas permitidas (whitelist)

| Alias | Tabla real |
|-------|-----------|
| `students` | `t_students` |
| `careers` | `t_career` |
| `periods` | `t_internships_period` |
| `institutions` | `t_institution` |
| `tutors` | `t_tutors` |
| `managers` | `t_institution_manager` |
| `internships` | `t_professional_practices` |
| `users` | `t_user` |

### Operadores de filtro soportados

`eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `like`, `ilike`, `in`

### Cache

Las consultas se cachean por **5 minutos** usando el `cacheManager` del backend. La clave de cache es el JSON serializado de la query.

### Auditoria

Cada consulta se registra en consola con:
- Timestamp
- ID del solicitante
- Entidad consultada
- Query completa
- Status (SUCCESS, ERROR, CACHE_HIT)

---

## 7. Modelo de IA y System Prompt

### Modelo

| Propiedad | Valor |
|-----------|-------|
| Proveedor | Google Generative AI |
| Modelo | `gemini-1.5-flash` (configurable via `.env`) |
| Max tokens | 4096 |
| Temperatura | 0.7 |
| Context window | 1,000,000 tokens |

### Estructura del System Prompt

El prompt se construye dinamicamente en `buildSystemPrompt()`:

```
1. BASE_SYSTEM_PROMPT (fijo)
   - Reglas de idioma (solo espanol)
   - Identidad del asistente
   - Reglas de respuesta
   - Prohibiciones

2. CONTEXTO DEL USUARIO (dinamico)
   - Nombre del usuario logueado
   - Rol (Administrador/Asistente)
   - Fecha actual

3. DATOS DEL SISTEMA - RAG (dinamico, solo si se detecto intencion)
   - Datos reales de la BD en formato JSON
   - Total de registros encontrados
   - Instruccion de usar estos datos para responder
```

### Cuando NO se inyectan datos

- Saludos: "hola", "buenos dias"
- Agradecimientos: "gracias"
- Preguntas generales que no coinciden con ninguna intencion
- En estos casos, Gemini recibe solo el prompt base y responde de forma minima

---

## 8. Persistencia de sesiones

### Tabla `t_chat_sessions`

```sql
CREATE TABLE "t_chat_sessions" (
  "SESSION_ID" UUID DEFAULT gen_random_uuid(),  -- ID unico
  "USER_ID"    INTEGER NOT NULL,                 -- FK a t_user
  "TITLE"      VARCHAR(100) DEFAULT 'Nueva conversacion',
  "MESSAGES"   JSONB DEFAULT '[]',               -- Array de mensajes
  "CREATED_AT" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "UPDATED_AT" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "STATUS"     SMALLINT DEFAULT 1                -- 1=activa, 0=eliminada
);
```

### Formato de mensajes (JSONB)

```json
[
  {
    "id": "1737158400000",
    "role": "user",
    "content": "Cuantos estudiantes activos hay?",
    "timestamp": "2026-02-17T15:00:00.000Z"
  },
  {
    "id": "1737158401000",
    "role": "assistant",
    "content": "Actualmente hay 14 estudiantes activos en el sistema.",
    "timestamp": "2026-02-17T15:00:01.000Z"
  }
]
```

### Comportamiento del upsert

Cuando el frontend guarda una sesion:
1. El backend verifica si el `SESSION_ID` existe en la BD
2. Si **no existe**, crea una nueva fila (INSERT)
3. Si **existe**, actualiza titulo y mensajes (UPDATE)

Esto evita el error de "session not found" cuando la sesion se crea localmente pero aun no se ha persistido.

### Soft delete

Las sesiones no se eliminan fisicamente. Se marcan con `STATUS = 0`.

---

## 9. API Endpoints

Todos bajo `/api/ai/` y requieren autenticacion (cookie `auth_token`).

### Chat

| Metodo | Endpoint | Descripcion | Rate Limit |
|--------|----------|-------------|------------|
| `POST` | `/api/ai/chat` | Enviar mensaje y recibir respuesta en streaming (SSE) | 30 req/min |

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "Cuantos estudiantes hay?" }
  ]
}
```

**Response (SSE):**
```
data: {"text": "Actualmente"}
data: {"text": " hay 14 estudiantes"}
data: {"text": " activos."}
data: [DONE]
```

### Sesiones

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| `GET` | `/api/ai/sessions` | Listar sesiones del usuario |
| `POST` | `/api/ai/sessions` | Crear nueva sesion |
| `PUT` | `/api/ai/sessions/:id` | Actualizar sesion (upsert) |
| `DELETE` | `/api/ai/sessions/:id` | Eliminar sesion (soft delete) |

### Query directa (uso interno)

| Metodo | Endpoint | Descripcion | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/ai/query` | Consulta directa a BD | Token AI (rol 99) |

---

## 10. Estructura de archivos

```
backend/src/
├── controllers/
│   └── ai.controller.ts          # Handlers: chatWithAI, CRUD sesiones, executeAIQuery
├── routes/
│   └── ai.routes.ts              # Definicion de rutas /api/ai/*
├── services/
│   ├── google-ai.service.ts      # SDK de Google Generative AI (streaming)
│   ├── intent-detection.service.ts # Deteccion de intencion + fetch de contexto
│   ├── ai.service.ts             # Queries seguras a la BD con cache
│   └── chat-sessions.service.ts  # CRUD de sesiones en PostgreSQL
└── middlewares/
    ├── auth.middleware.ts         # Autenticacion por cookie (usuarios normales)
    └── ai-auth.middleware.ts     # Autenticacion por Bearer token (rol AI 99)

src/features/ai-assistant/
├── hooks/
│   ├── useAIChat.ts              # Hook principal del chat
│   └── useStreamResponse.ts      # Acumulador de texto streaming
├── services/
│   ├── BackendChatService.ts     # Fetch SSE al backend
│   └── ChatHistoryService.ts     # CRUD sesiones via API
├── components/
│   ├── ChatWindow.tsx            # Contenedor principal
│   ├── ChatHeader.tsx            # Header con acciones
│   ├── ChatInput.tsx             # Input con auto-resize
│   ├── MessageBubble.tsx         # Burbuja de mensaje (Markdown)
│   ├── MessageList.tsx           # Lista de mensajes
│   ├── ChatHistorySidebar.tsx    # Sidebar de historial
│   ├── AISuggestions.tsx         # Botones de sugerencias rapidas
│   └── TypingIndicator.tsx       # Indicador de carga
└── types/
    └── index.ts                  # Interfaces TypeScript

DB-chat-sessions.sql              # Script SQL para crear la tabla de sesiones
```

---

## 11. Seguridad

| Aspecto | Implementacion |
|---------|---------------|
| **API Key** | Solo en el backend (`GOOGLE_AI_KEY` en `.env`), nunca expuesta al frontend |
| **Autenticacion** | Cookie `auth_token` validada por `authenticateToken` middleware |
| **Tablas permitidas** | Whitelist de 8 tablas en `ALLOWED_ENTITIES` |
| **Rate limiting** | 30 req/min para chat, 60 req/min para queries directas |
| **Aislamiento de sesiones** | Cada query a sesiones filtra por `USER_ID` del token |
| **Soft delete** | Las sesiones se desactivan, no se eliminan |
| **Auditoria** | Cada consulta RAG se registra con timestamp y requester |

---

## 12. Configuracion

### Variables de entorno del backend (`backend/.env`)

```bash
# Requeridas para el chat de IA
GOOGLE_AI_KEY=tu_api_key_de_google_ai
GOOGLE_AI_MODEL=gemini-1.5-flash    # Modelo a usar

# Ya existentes (necesarias para que funcione la BD)
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### Variables de entorno del frontend (`.env`)

```bash
VITE_API_URL=http://localhost:3000/api   # URL del backend
# VITE_GOOGLE_AI_KEY ya NO se necesita (la IA se maneja desde el backend)
```

---

## 13. Como agregar nuevas intenciones

Para que el asistente reconozca nuevas preguntas y consulte datos relevantes:

### Paso 1 - Agregar patrones en `intent-detection.service.ts`

```typescript
// En el array INTENT_PATTERNS, agregar un nuevo objeto:
{
  patterns: [
    /mi_nuevo_patron_regex/i,
    /otro_patron_alternativo/i,
  ],
  entity: 'students',       // Debe ser una key de ALLOWED_ENTITIES
  action: 'list',           // count | list | detail | summary | status
  filters: { STATUS: 1 },   // Filtros opcionales para la query
  limit: 20,                // Limite de registros
},
```

### Paso 2 - Si necesitas una nueva tabla

1. Agregar la tabla al objeto `ALLOWED_ENTITIES` en `ai.service.ts`:
```typescript
const ALLOWED_ENTITIES = {
  // ... existentes ...
  miNuevaEntidad: 't_mi_tabla',
};
```

2. Agregar el alias al schema Zod:
```typescript
entity: z.enum([...existentes, 'miNuevaEntidad'])
```

### Paso 3 - Probar

1. Reiniciar el backend
2. Escribir en el chat el mensaje que deberia activar la nueva intencion
3. Verificar en la consola del backend que aparezca: `[RAG] Intent detected: list on miNuevaEntidad`
