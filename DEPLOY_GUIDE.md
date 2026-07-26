# UNEFA Dashboard — Guía Rápida Fork & Deploy a Producción

> Tiempo estimado: **10 minutos** | Requisitos: Cuenta GitHub, Vercel, Render, Supabase

---

## 1. Fork del Repositorio

```bash
# Opción A: GitHub CLI (recomendado)
gh repo fork ServerAdmin/UNEFA_DASHBOARD --clone --remote-name origin
cd UNEFA_DASHBOARD

# Opción B: Web UI
# 1. Ir a github.com/ServerAdmin/UNEFA_DASHBOARD
# 2. Click "Fork" → tu cuenta/organización
# 3. Clonar tu fork:
git clone https://github.com/TU_USUARIO/UNEFA_DASHBOARD.git
cd UNEFA_DASHBOARD
```

---

## 2. Crear Proyecto en Supabase (Base de Datos)

1. Ir a [supabase.com](https://supabase.com) → New Project
2. Organización → Nombre: `unefa-dashboard` → Región cercana
3. **Guardar credenciales:**
   - Project URL: `https://xxx.supabase.co`
   - `anon` / `public` key (para frontend)
   - `service_role` key (para backend — **no exponer en frontend**)

4. **Ejecutar migración:**
   - SQL Editor → New Query
   - Copiar contenido de `supabase/migrations/20260712135919_baseline.sql`
   - Run

---

## 3. Variables de Entorno

### Frontend (`.env` en raíz)
```env
# API Backend (Render)
VITE_API_URL=https://TU_BACKEND.onrender.com

# Supabase (usar anon key)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Backend (`backend/.env`)
```env
NODE_ENV=production
PORT=3000

# Supabase (usar service_role key)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Auth
JWT_SECRET=genera-uno-con-openssl-rand-base64-32
# openssl rand -base64 32

# CORS / Frontend URL
FRONTEND_URL=https://TU_FRONTEND.vercel.app
ALLOWED_ORIGINS=https://TU_FRONTEND.vercel.app

# Email (Resend)
RESEND_API_KEY=re_...

# IA (opcional)
GEMINI_API_KEY=...
GROQ_API_KEY=...
```

> **Generar JWT_SECRET:** `openssl rand -base64 32` (o `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`)

---

## 4. Deploy Backend → Render

### Opción A: Web Service (Recomendado)

1. [dashboard.render.com](https://dashboard.render.com) → New → **Web Service**
2. Connect GitHub → Seleccionar tu fork
3. Configuración:
   ```
   Name: unefa-backend
   Region: Oregon (US West) o Frankfurt (EU)
   Branch: main
   Runtime: Node
   Build Command: cd backend && npm install && npm run build
   Start Command: cd backend && npm run start
   Plan: Starter ($7/mes) — Free tiene cold starts
   ```
4. **Environment Variables** → Add from `backend/.env` (copiar/pegar cada uno)
5. **Create Web Service** → Esperar deploy (2-3 min)
6. Copiar URL: `https://unefa-backend-xxxx.onrender.com`

### Opción B: Docker (Si prefieres control total)

```bash
# En Render: New → Web Service → "Docker" tab
# Dockerfile ya existe en backend/Dockerfile
# Build Command: (vacío)
# Start Command: (vacío)
```

---

## 5. Deploy Frontend → Vercel

1. [vercel.com/new](https://vercel.com/new) → Import Git Repository
2. Seleccionar tu fork
3. Configuración (auto-detecta Vite):
   ```
   Framework Preset: Vite
   Root Directory: ./
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```
4. **Environment Variables** → Add from `.env`:
   - `VITE_API_URL` = URL de Render (paso 4)
   - `VITE_SUPABASE_URL` = URL Supabase
   - `VITE_SUPABASE_ANON_KEY` = anon key Supabase
5. **Deploy** → Esperar (1-2 min)
6. Copiar URL: `https://unefa-dashboard-xxxx.vercel.app`

---

## 6. Conectar Frontend ↔ Backend

1. **En Render (Backend):** Agregar/Actualizar env var:
   ```
   FRONTEND_URL=https://TU_FRONTEND.vercel.app
   ALLOWED_ORIGINS=https://TU_FRONTEND.vercel.app
   ```
   → Redeploy (auto)

2. **En Vercel (Frontend):** Verificar `VITE_API_URL` apunta a Render URL

---

## 7. Verificación Post-Deploy

```bash
# Health check backend
curl https://TU_BACKEND.onrender.com/health
# Esperado: {"status":"ok","timestamp":"..."}

# Health check frontend
curl -I https://TU_FRONTEND.vercel.app
# Esperado: 200 OK

# Probar login real en navegador
# Abrir https://TU_FRONTEND.vercel.app
```

---

## 8. Dominio Personalizado (Opcional)

### Vercel (Frontend)
1. Project → Settings → Domains → Add
2. `app.tudominio.com` → Configurar DNS (CNAME a `cname.vercel-dns.com`)

### Render (Backend)
1. Service → Settings → Custom Domains → Add
2. `api.tudominio.com` → Configurar DNS (CNAME a `xxx.onrender.com`)

3. **Actualizar env vars:**
   - Backend: `FRONTEND_URL=https://app.tudominio.com`
   - Frontend: `VITE_API_URL=https://api.tudominio.com`

---

## 9. Comandos Útiles

```bash
# Ver logs backend (Render)
# Dashboard → Logs → Live tail

# Ver logs frontend (Vercel)
# Dashboard → Functions → View logs

# Rebuild manual
# Render: Manual Deploy → Deploy latest commit
# Vercel: git push origin main (auto-deploy)

# Ver migraciones BD
# Supabase → Database → Migrations
```

---

## 10. Troubleshooting Rápido

| Problema | Solución |
|----------|----------|
| CORS error | Verificar `ALLOWED_ORIGINS` en backend coincide EXACTO con frontend URL |
| 401 Unauthorized | `JWT_SECRET` igual en ambos? Cookies `SameSite=None; Secure` en producción |
| Supabase connection failed | `SUPABASE_SERVICE_ROLE_KEY` en backend (no anon), IP allowlist en Supabase |
| Build fails | `npm run build` localmente primero; revisar Node version (18+) |
| Cold starts (Render Free) | Upgrade a Starter $7/mes o usar cron job ping cada 10 min |

---

## Checklist Final ✅

- [ ] Fork clonado
- [ ] Supabase proyecto creado + migración ejecutada
- [ ] `.env` frontend creado con 3 variables
- [ ] `backend/.env` creado con 7+ variables
- [ ] Render Web Service deployado + URL copiada
- [ ] Vercel project deployado + URL copiada
- [ ] `FRONTEND_URL` y `ALLOWED_ORIGINS` actualizados en Render
- [ ] `VITE_API_URL` actualizado en Vercel
- [ ] Health checks pasan
- [ ] Login funciona en navegador
- [ ] (Opcional) Dominios personalizados configurados

---

## Archivos Clave del Proyecto

```
UNEFA_DASHBOARD/
├── .env                    # ← Crear (frontend)
├── backend/
│   ├── .env                # ← Crear (backend)
│   ├── package.json
│   └── src/
├── supabase/
│   └── migrations/
│       └── 20260712135919_baseline.sql  # ← Ejecutar en Supabase
├── package.json
├── vite.config.ts
├── vercel.json
├── Dockerfile              # (backend)
├── docker-compose.yml
└── DEPLOY_GUIDE.md         # ← Este archivo
```

---

**¡Listo!** Tu UNEFA Dashboard está en producción. 🚀

> Para actualizaciones: `git push origin main` → Vercel y Render auto-deployean.