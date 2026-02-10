# Project Context & Agent Guide

## 1. Project Overview
**Proyecto-Unefa** is an academic management dashboard/SaaS for a university.
- **Type**: Full-stack Web Application (Admin Dashboard).
- **Core Value**: Robust, scalable architecture for managing academic periods, careers, students, and more.
- **Language**: Global Spanish (es).

## 2. Tech Stack

### Frontend (`/`)
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS v4 + Semantic CSS Variables
- **State/Logic**: React Hooks (Custom), Context API (Global)
- **Routing**: React Router 7
- **Forms**: React Hook Form + Zod
- **Data**: Axios (API Client)
- **UI Libs**: ApexCharts, FullCalendar, Framer Motion, React Hot Toast, React Icons
- **PDF**: @react-pdf/renderer

### Backend (`/backend`)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Auth**: JWT + Bcryptjs
- **Database Client**: Supabase JS (PostgreSQL)
- **Security**: Helmet, CORS

### Infrastructure
- **Database**: Supabase (PostgreSQL)
- **Containerization**: Docker + Docker Compose
- **Deployment**: Vercel (Frontend compatible), Node.js (Backend)

## 3. Architecture

### Pattern: Feature-Based & Layered
The system uses a strict unidirectional data flow:
1.  **UI Components** trigger events.
2.  **Pages** orchestrate features.
3.  **Hooks** (`features/*/hooks`) manage state and business logic.
4.  **Services** (`features/*/services` or `api/`) handle API communication.
5.  **Backend Routes** (`backend/src/routes`) receive requests.
6.  **Controllers** (`backend/src/controllers`) execute business logic.
7.  **DB Layer** interacts with Supabase.

### Directory Structure Key
- `src/features/`: Self-contained modules (components, hooks, services, types) for each domain (e.g., `periods`, `careers`).
- `src/api/`: Centralized Axios instance.
- `src/layout/`: Main layout shell (Sidebar, Header).
- `backend/src/`: Server source code.

## 4. Key Workflows

### Development
- **Run All**: `docker-compose up --build`
- **Frontend Only**: `npm run dev` (Port 5173)
- **Backend Only**: `cd backend && npm run dev` (Port 3000)

### Docker Security
- `.env` files are mounted as **Read-Only** in containers.
- Integrity checks (`setup-docker.sh`) run before startup.

## 5. Development Standards (Strict)

### UX/UI (`docs/ux-standards.md`)
- **Colors**: Use semantic variables (e.g., `--color-text-primary`, `--color-btn-primary-bg`). Do NOT hardcode hex values.
- **Contrast**: WCAG AA (4.5:1) minimum.
- **Consistency**: Follow the component definitions for Buttons, Inputs, Alerts.

### Code Style
- **TypeScript**: Strict typing required. Avoid `any`.
- **Naming**: camelCase for functions/vars, PascalCase for components/classes.
- **Hooks**: Encapsulate logic in custom hooks.
- **Error Handling**: Standardized responses and toast notifications.

## 6. Important Files
- `docs/technical-specs.md`: Detailed color and UI specs.
- `docs/DOCKER_GUIDE.md`: Docker setup and troubleshooting.
- `DB-postgres.sql`: Database schema reference.

## 7. Agent Behavior Rules
- **Verify before fixing**: Use `systematic-debugging` skill.
- **Plan before coding**: Use `brainstorming` or `api-design-principles` skills where applicable.
- **Performance**: Follow `vercel-react-best-practices`.
- **Aesthetics**: Apply `frontend-design` principles (Intentional, Polished, Accessible).
