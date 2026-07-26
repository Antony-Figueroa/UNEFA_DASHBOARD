# UNEFA Dashboard — Sistema de Gestión de Prácticas Profesionales

> **Plataforma académica completa** para universidades: gestión de estudiantes, tutores, instituciones receptoras, evaluaciones, documentación y reportes. Multi-rol (admin, tutor, estudiante), offline-first con Electron + PGlite, deploy en Vercel + Render + Supabase.

[![Version](https://img.shields.io/badge/version-2.2.0-blue)](https://github.com/Antony-Figueroa/UNEFA_DASHBOARD)
[![React 19](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?logo=typescript)](https://typescriptlang.org)
[![Vite 6](https://img.shields.io/badge/Vite-6-646cff?logo=vite)](https://vitejs.dev)
[![License MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE.md)

---

## ⚡ Inicio Rápido

```bash
# 1. Clonar e instalar
git clone https://github.com/TU_USUARIO/UNEFA_DASHBOARD.git
cd UNEFA_DASHBOARD
npm install && cd backend && npm install && cd ..

# 2. Configurar entorno (ver .env.example)
cp .env.example .env
cp backend/.env.example backend/.env

# 3. Ejecutar migración en Supabase (SQL Editor → pegar DB-postgres.sql)

# 4. Desarrollo
npm run dev          # Frontend: http://localhost:5173
cd backend && npm run dev   # Backend: http://localhost:3000
```

---

## 🏗 Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| **Frontend** | React 19 + Vite 6 + TypeScript strict |
| **Estilos** | Tailwind CSS v4 + CSS Variables (8 paletas de marca) |
| **Estado/Forms** | React Hook Form + Zod 4 |
| **Routing** | React Router 7 (lazy loading, 40+ rutas) |
| **Charts** | ApexCharts + react-apexcharts |
| **Calendario** | FullCalendar |
| **Mapas** | MapLibre GL |
| **Desktop** | Electron 42 + PGlite (PostgreSQL WASM) |
| **Backend** | Express.js + TypeScript + Supabase (PostgreSQL) |
| **Auth** | JWT + bcrypt + cookies HttpOnly |
| **IA** | Gemini (principal) + Groq (fallback) |
| **Deploy** | Vercel (frontend) + Render (backend) + Supabase (DB) |

---

## 📁 Estructura del Proyecto

```
UNEFA_DASHBOARD/
├── src/                          # Frontend
│   ├── api/                      # Axios client + factories
│   ├── components/               # UI compartida (ui/, form/, common/, charts/)
│   ├── context/                  # 6 contextos globales (Auth, Theme, Sidebar, etc.)
│   ├── features/                 # 41 módulos autónomos (CRUD + hooks + services)
│   ├── hooks/                    # 16 hooks compartidos
│   ├── layout/                   # AppLayout, Sidebar, Header
│   ├── pages/                    # 33 páginas (lazy loaded)
│   ├── routes/                   # Definición de rutas
│   ├── theme/                    # Sistema de colores de marca
│   └── utils/                    # Utilidades (fecha, excel, validaciones)
│
├── backend/                      # Backend Express
│   └── src/
│       ├── controllers/          # 49 controladores
│       ├── routes/               # 51 archivos de rutas
│       ├── middlewares/          # Auth, validation, rate-limit
│       ├── services/             # 43 servicios (email, IA, sync, SSE)
│       ├── lib/                  # DB adapters (Supabase + PGlite), cache
│       └── migrations/           # 22 migraciones SQL
│
├── supabase/                     # Config + migración baseline
├── electron/                     # App desktop
├── docs/                         # Documentación técnica
└── docker-compose.yml            # Stack completo
```

---

## 🔐 Credenciales de Prueba (tras migrar)

| Rol | Email | Contraseña |
|-----|-------|------------|
| Administrador | admin@unefa.edu.ve | admin123 |
| Asistente | asistente@unefa.edu.ve | asis123 |
| Tutor | tutor@unefa.edu.ve | tutor123 |
| Estudiante | estudiante@test.com | estu123 |

---

## 🚀 Deploy a Producción (10 min)

### 1. Fork + Variables de Entorno
```bash
gh repo fork Antony-Figueroa/UNEFA_DASHBOARD --clone
cd UNEFA_DASHBOARD
```

Crear `.env` (frontend) y `backend/.env` con:

**Frontend**
```env
VITE_API_URL=https://tu-backend.onrender.com
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

**Backend**
```env
NODE_ENV=production
PORT=3000
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # Service role, NO anon
JWT_SECRET=$(openssl rand -base64 32)
FRONTEND_URL=https://tu-frontend.vercel.app
ALLOWED_ORIGINS=https://tu-frontend.vercel.app
RESEND_API_KEY=re_...
```

### 2. Base de Datos → Supabase
1. Nuevo proyecto en [supabase.com](https://supabase.com)
2. SQL Editor → pegar `supabase/migrations/20260712135919_baseline.sql` → Run

### 3. Backend → Render
- New Web Service → Connect repo
- Build: `cd backend && npm install && npm run build`
- Start: `cd backend && npm run start`
- Pegar variables de `backend/.env`

### 4. Frontend → Vercel
- Import Project → Framework: Vite
- Build: `npm run build` · Output: `dist`
- Pegar variables de `.env`

### 5. Conectar CORS
- Render: `FRONTEND_URL` + `ALLOWED_ORIGINS` = URL de Vercel
- Redeploy backend

---

## 📦 Scripts Principales

```bash
# Desarrollo
npm run dev              # Frontend (5173)
cd backend && npm run dev # Backend (3000)

# Build producción
npm run build            # Frontend → dist/
cd backend && npm run build

# Tests
npm test                 # Vitest + React Testing Library
npm run test:coverage

# Lint / Typecheck
npm run lint
npx tsc --noEmit

# Docker (stack completo)
docker-compose up --build
```

---

## 📚 Documentación Clave

| Archivo | Propósito |
|---------|-----------|
| [AGENTS.md](AGENTS.md) | Guía completa para devs y agentes IA |
| [DEPLOY_GUIDE.md](DEPLOY_GUIDE.md) | Deploy paso a paso con capturas |
| [technical-specs.md](technical-specs.md) | Sistema de colores y especificaciones UI |
| [ux-standards.md](ux-standards.md) | Estándares UX y accesibilidad (WCAG AA/AAA) |
| [DOCKER_GUIDE.md](DOCKER_GUIDE.md) | Docker troubleshooting |
| [docs/API.md](docs/API.md) | Referencia de endpoints |
| [docs/ARQUITECTURA_DEL_SISTEMA.md](docs/ARQUITECTURA_DEL_SISTEMA.md) | Arquitectura completa |

---

## 🤝 Contribución

```bash
# 1. Fork → feature branch
git checkout -b feature/nombre-corto

# 2. Cambios + commits convencionales
git commit -m "feat: agregar validación de cédula en formulario estudiante"

# 3. Push + PR
git push origin feature/nombre-corto
```

**Convenciones:**
- TypeScript strict — sin `any`
- Componentes: `PascalCase.tsx` · Hooks: `useCamelCase.ts`
- CSS Variables semánticas — nada de hex hardcodeado
- Tests para lógica no trivial

---

## 🔒 Seguridad

- JWT en cookies `HttpOnly; Secure; SameSite=Lax`
- Helmet (CSP estricto) + CORS dinámico
- Bcrypt 12 rounds
- Row Level Security en Supabase
- Rate limiting en endpoints sensibles
- Validación Zod en backend

---

## 📄 Licencia

MIT — [LICENSE.md](LICENSE.md)

---

## ✨ Créditos

Desarrollado por **Antony Figueroa** — [GitHub](https://github.com/Antony-Figueroa)

> ⭐ Si el proyecto te resulta útil, una estrella ayuda a que más gente lo encuentre.