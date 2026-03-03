# UNEFA Dashboard — Sistema de Gestión de Prácticas Profesionales

[![Version](https://img.shields.io/badge/version-2.2.0-blue.svg)](https://github.com/Antony-Figueroa/UNEFA_DASHBOARD)
[![React](https://img.shields.io/badge/React-19.0.0-61dafb.svg?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-3178c6.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.1.0-646cff.svg?logo=vite)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE.md)

Sistema de gestión académica integral para universidades, enfocado en la administración de prácticas profesionales. Gestiona estudiantes, tutores, instituciones receptoras, evaluaciones y documentación académica con soporte multi-rol.

---

## Requisitos Previos

| Requisito | Versión Mínima | Notas |
|-----------|----------------|-------|
| Node.js | >= 18.x | Runtime de JavaScript |
| npm | >= 9.x | Gestor de paquetes |
| PostgreSQL | 15+ | Base de datos (via Supabase) |
| Docker | >= 20.x | Opcional, para contenedores |
| Git | 2.x | Control de versiones |

### Cuenta de Supabase Requerida

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Obtener credenciales del panel de configuración
3. Ejecutar migraciones desde `DB-postgres.sql`

---

## Instalación

### Clonar el Repositorio

```bash
git clone https://github.com/Antony-Figueroa/UNEFA_DASHBOARD.git
cd UNEFA_DASHBOARD
```

### Instalar Dependencias

```bash
# Frontend
npm install

# Backend
cd backend && npm install
```

### Configurar Variables de Entorno

```bash
# Frontend - copiar y editar
cp .env.example .env

# Backend - copiar y editar
cp backend/.env.example backend/.env
```

#### Variables de Entorno

**Frontend (`.env`)**:

| Variable | Descripción | Ejemplo | Obligatoria |
|----------|-------------|---------|-------------|
| `VITE_API_URL` | URL del backend | `http://localhost:3000/api` | Sí |
| `VITE_SUPABASE_URL` | URL del proyecto Supabase | `https://xxx.supabase.co` | Sí |
| `VITE_SUPABASE_ANON_KEY` | Clave pública de Supabase | `eyJxxx...` | Sí |
| `VITE_GOOGLE_AI_KEY` | API key de Gemini (asistente IA) | `AIzaSy...` | No |
| `VITE_OPENROUTER_KEY` | API key de OpenRouter (fallback) | `sk-or-...` | No |

**Backend (`backend/.env`)**:

| Variable | Descripción | Ejemplo | Obligatoria |
|----------|-------------|---------|-------------|
| `PORT` | Puerto del servidor | `3000` | Sí |
| `NODE_ENV` | Entorno | `development` | Sí |
| `SUPABASE_URL` | URL de Supabase | `https://xxx.supabase.co` | Sí |
| `SUPABASE_ANON_KEY` | Clave pública | `eyJxxx...` | Sí |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio (admin) | `eyJxxx...` | Sí |
| `SUPABASE_JWT_SECRET` | Secreto para validar JWT | `your-jwt-secret` | Sí |

### Ejecutar Migraciones de Base de Datos

1. Abrir panel de Supabase SQL Editor
2. Copiar contenido de `DB-postgres.sql`
3. Ejecutar script

### Iniciar Aplicación

```bash
# Desarrollo - Terminal 1 (Frontend)
npm run dev
# Accesible en: http://localhost:5173

# Desarrollo - Terminal 2 (Backend)
cd backend && npm run dev
# Accesible en: http://localhost:3000

# Producción con Docker
docker-compose up --build
```

---

## Uso Rápido

### Credenciales de Prueba (tras migrate)

| Rol | Usuario | Contraseña |
|-----|---------|------------|
| Administrador | admin@unefa.edu.ve | admin123 |
| Asistente | asistente@unefa.edu.ve | asis123 |
| Tutor | tutor@unefa.edu.ve | tutor123 |
| Estudiante | estudiante@test.com | estu123 |

### Flujo Básico

1. **Login**: Acceder con credenciales
2. **Dashboard**: Ver estadísticas según rol
3. **Gestión**: Navegar a módulos (Estudiantes, Tutores, Carreras, etc.)
4. **Pasantías**: Crear pre-inscripción → Inscripción → Seguimiento → Evaluación

---

## Estructura del Proyecto

```
UNEFA_DASHBOARD/
├── src/                          # Frontend React 19
│   ├── api/                      # Cliente HTTP centralizado
│   │   ├── apiClient.ts          # Axios con interceptores
│   │   └── crudServiceFactory.ts # Factory para servicios CRUD
│   ├── components/               # Componentes reutilizables
│   │   ├── ui/                   # Componentes atómicos (Button, Input, Modal)
│   │   ├── form/                 # Componentes de formulario
│   │   ├── common/               # Componentes compartidos
│   │   └── UserProfile/          # Tarjetas de perfil
│   ├── features/                 # Módulos por funcionalidad
│   │   ├── auth/                 # Autenticación y sesiones
│   │   ├── students/             # Gestión de estudiantes
│   │   ├── tutors/                # Tutores académicos
│   │   ├── institutions/         # Instituciones receptoras
│   │   ├── careers/              # Carreras universitarias
│   │   ├── periods/              # Períodos académicos
│   │   ├── enrollment/            # Inscripciones
│   │   ├── pre-enrollment/        # Pre-inscripciones
│   │   ├── tracking/              # Seguimiento de pasantías
│   │   ├── evaluations/           # Evaluaciones (3 tipos ponderados)
│   │   ├── activity-logs/         # Bitácora de actividades
│   │   ├── documents/             # Gestión de documentos
│   │   ├── notifications/         # Notificaciones SSE
│   │   ├── dashboard/             # Dashboard admin
│   │   ├── tutor/                 # Dashboard tutor
│   │   ├── student/              # Dashboard estudiante
│   │   ├── users/                # Gestión de usuarios
│   │   ├── theme/                # Personalización de colores
│   │   ├── lists/                # Listas de configuración
│   │   └── backups/              # Respaldos de BD
│   ├── context/                   # Contextos globales
│   │   ├── AuthContext.tsx        # Autenticación
│   │   ├── ThemeContext.tsx       # Tema de color
│   │   └── ToastContext.tsx       # Notificaciones toast
│   ├── hooks/                     # Hooks compartidos
│   │   ├── useModal.tsx           # Control de modales
│   │   ├── useDebounce.ts         # Debounce para búsquedas
│   │   ├── useSessionTimeout.ts   # Timeout de sesión
│   │   └── useCrud.ts             # Hook CRUD genérico
│   ├── pages/                     # Páginas con rutas
│   ├── routes/                    # Definición de rutas (lazy loading)
│   ├── theme/                     # Sistema de colores CSS
│   ├── utils/                     # Utilidades
│   │   ├── date.ts                # Fechas
│   │   ├── maskData.ts            # Enmascaramiento de datos
│   │   └── excel.ts               # Exportación Excel
│   ├── types/                     # Tipos TypeScript globales
│   └── styles/                    # Estilos globales
│
├── backend/                       # Backend Express + TypeScript
│   └── src/
│       ├── controllers/           # Lógica de negocio (20+)
│       │   ├── auth.controller.ts
│       │   ├── students.controller.ts
│       │   ├── tutors.controller.ts
│       │   └── ...
│       ├── routes/                 # Definición de endpoints
│       │   ├── auth.routes.ts
│       │   ├── students.routes.ts
│       │   └── ...
│       ├── middlewares/            # Middlewares Express
│       │   ├── auth.middleware.ts  # JWT + permisos
│       │   └── rate-limit.middleware.ts
│       ├── services/               # Servicios externos
│       │   ├── auth.service.ts
│       │   ├── email.service.ts
│       │   └── ai.service.ts
│       ├── lib/                    # Utilidades
│       │   ├── supabase.ts         # Cliente Supabase
│       │   ├── cache-manager.ts    # Caché en memoria
│       │   └── db-manager.ts       # Abstracción DB
│       ├── utils/                  # Utilidades
│       └── migrations/             # Migraciones SQL
│
├── docs/                          # Documentación adicional
├── docker-compose.yml             # Configuración Docker
├── package.json                   # Dependencias frontend
└── README.md                      # Este archivo
```

---

## Ejecutar Tests

```bash
# Todos los tests
npm test

# Tests con watch
npm test -- --watch

# Coverage
npm test -- --coverage

# Backend - Tests de entorno
cd backend && npm run test:env
```

---

## Linting y TypeScript

```bash
# Lint
npm run lint

# TypeScript check
npx tsc --noEmit
```

---

## Contribución

### Workflow

1. Fork del repositorio
2. Crear rama feature: `git checkout -b feature/NombreFeature`
3. Realizar cambios con commits convencionales
4. Push: `git push origin feature/NombreFeature`
5. Abrir Pull Request

### Conventional Commits

```
feat: nueva funcionalidad
fix: corrección de bug
docs: documentación
style: formato (sin cambio lógica)
refactor: refactorización
test: tests
chore: mantenimiento
```

### Estándares de Código

- TypeScript strict mode activo
- Sin `any` — usar tipos explícitos
- Nomenclatura: PascalCase (componentes), camelCase (funciones)
- Componentes con JSDoc en funciones públicas
- Preferir hooks sobre clases

---

## Seguridad

- JWT con cookies HttpOnly
- Helmet headers
- Bcrypt para contraseñas
- Validación Zod en backend
- Row Level Security (Supabase)
- Rate limiting en endpoints sensibles

---

## Licencia

MIT — ver [LICENSE.md](LICENSE.md)

---

## Recursos Adicionales

| Documento | Descripción |
|-----------|-------------|
| [AGENTS.md](AGENTS.md) | Guía para desarrolladores y agentes IA |
| [docs/API.md](docs/API.md) | Referencia completa de endpoints |
| [technical-specs.md](technical-specs.md) | Sistema de colores y UI |
| [ux-standards.md](ux-standards.md) | Estándares UX y accesibilidad |
| [DOCKER_GUIDE.md](DOCKER_GUIDE.md) | Guía Docker completa |
| [CHANGELOG.md](CHANGELOG.md) | Historial de versiones |

---

**Autores**: Antony Figueroa — [GitHub](https://github.com/Antony-Figueroa)

** estrella si el proyecto resulta útil
