import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import careersRoutes from './routes/careers.routes.js';
import internshipTypesRoutes from './routes/internship-types.routes.js';
import periodsRoutes from './routes/periods.routes.js';
import enrollmentsRoutes from './routes/enrollments.routes.js';
import preEnrollmentsRoutes from './routes/pre-enrollments.routes.js';
import studentsRoutes from './routes/students.routes.js';
import tutorsRoutes from './routes/tutors.routes.js';
import trackingRoutes from './routes/tracking.routes.js';
import institutionsRoutes from './routes/institutions.routes.js';
import institutionalResponsiblesRoutes from './routes/institutional-responsibles.routes.js';
import listsRoutes from './routes/lists.routes.js';
import publicRoutes from './routes/public.routes.js';
import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import aiRoutes from './routes/ai.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import configRoutes from './routes/config.routes.js';
import culminationRoutes from './routes/culmination.routes.js';
import manualsRoutes from './routes/manuals.routes.js';
import rolesRoutes from './routes/roles.routes.js';
import tutorDashboardRoutes from './routes/tutor-dashboard.routes.js';
import studentDashboardRoutes from './routes/student-dashboard.routes.js';
import adminRequestsRoutes from './routes/admin-requests.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import evaluationRoutes from './routes/evaluation.routes.js';
import practicesRoutes from './routes/practices.routes.js';
import backupRoutes from './routes/backup.routes.js';
import userThemeRoutes from './routes/user-theme.routes.js';
import activityLogsRoutes from './routes/activity-logs.routes.js';
import auditRoutes from './routes/audit.routes.js';
import visitsRoutes from './routes/visits.routes.js';
import documentsRoutes from './routes/documents.routes.js';
import permissionRoutes from './routes/permission.routes.js';
import securityQuestionsRoutes from './routes/securityQuestions.routes.js';
import landingConfigRoutes from './routes/landing-config.routes.js';
import globalSearchRoutes from './routes/global-search.routes.js';
import { getSystemConfig } from './controllers/evaluation.controller.js';
import { subscribeToNotifications } from './services/sse.service.js';
import { dbManager } from './lib/db-manager.js';
import { performanceMiddleware } from './lib/performance-middleware.js';
import { authenticateToken, restrictAsistente } from './middlewares/auth.middleware.js';
import * as listsService from './services/lists.service.js';
import * as usersService from './services/users.service.js';
import { startPeriodScheduler } from './services/period-scheduler.service.js';

// Detectar si estamos en Vercel (serverless)
const isVercel = !!process.env.VERCEL;

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Leer orígenes permitidos desde env (coma-separados). Ejemplo:
// ALLOWED_ORIGINS=https://your-frontend.vercel.app,http://localhost:5173
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:3000')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// Performance monitoring
app.use(performanceMiddleware);

// Initialize Database (non-blocking)
dbManager.connect().catch(err => {
  console.error('[Main] Failed to connect to database on startup:', err.message);
});
listsService.ensurePhonePrefixesSeeded().catch(() => {});
usersService.ensureRolesSeeded().catch(() => {});

// Iniciar scheduler de notificaciones de períodos (SOLO en modo tradicional, NO en Vercel)
if (!isVercel) {
  setTimeout(() => {
    try {
      startPeriodScheduler();
    } catch (err: unknown) {
      console.error('[Scheduler] Error starting:', err);
    }
  }, 10000);
} else {
  console.log('[Vercel] Scheduler disabled — use Vercel Cron Jobs instead');
}

// Security config (dev friendly)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: [
        "'self'", 
        "data:",
        "https://*.onrender.com", 
        "http://localhost:*", 
        "ws://localhost:*", 
        "http://backend:3000",
        "https://basemaps.cartocdn.com",
        "https://*.basemaps.cartocdn.com",
        "https://server.arcgisonline.com",
        "https://*.tile.openstreetmap.org",
        "https://fonts.googleapis.com",
        "https://fonts.gstatic.com",
        "https://*"
      ],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "blob:"],
      workerSrc: ["'self'", "blob:"],
      childSrc: ["'self'", "blob:"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: [
        "'self'", 
        "data:", 
        "blob:", 
        "https://*",
        "https://basemaps.cartocdn.com",
        "https://*.basemaps.cartocdn.com",
        "https://server.arcgisonline.com",
        "https://*.tile.openstreetmap.org"
      ],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com", "https://*"],
      frameSrc: ["'self'", "blob:", "data:"],
      objectSrc: ["'self'", "blob:", "data:"],
      upgradeInsecureRequests: null,
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: (origin, callback) => {
    // permitir requests sin origin (herramientas como curl, servidores-side)
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.some(allowed => 
      allowed.replace(/\/$/, '') === origin.replace(/\/$/, '')
    );

    // Permitir si está en la lista, si es de render, o si es una preview de vercel
    if (isAllowed || origin.endsWith('.onrender.com') || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    
    console.warn(`[CORS] Rejected origin: ${origin}`);
    // No devolvemos error, simplemente decimos que no está permitido
    return callback(null, false);
  },
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Request Logger (Debug)
app.use((req, _res, next) => {
  console.log(`[Request] ${req.method} ${req.url} - Origin: ${req.headers.origin}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes); // AI Agent Routes (Separate Auth)
app.use('/api/users', usersRoutes);

// Public Health endpoints (Must be before authentication)
app.get('/api/db-status', async (_req, res) => {
  const health = await dbManager.checkHealth();
  
  // Si hay error, lo registramos silenciosamente en la consola del servidor
  if (health.status !== 'healthy') {
    console.warn(`[Database] Health check failed: ${health.details?.error || 'Unknown error'}`);
  }

  // Siempre retornamos 200 para evitar que interceptores globales de error en el frontend 
  // disparen alertas o mensajes técnicos al usuario en páginas públicas.
  res.status(200).json({ 
    status: health.status === 'healthy' ? 'connected' : 'disconnected',
    message: health.status === 'healthy' ? 'Conexión exitosa' : 'Servicio en modo informativo',
    error: health.status === 'healthy' ? null : 'DB_CONNECTION_ERROR',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', async (_req, res) => {
  const health = await dbManager.checkHealth();
  res.status(health.status === 'healthy' ? 200 : 503).json({ 
    status: health.status, 
    message: 'Backend is running',
    database: health.details,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Public routes (no auth required)
import testRoutes from './routes/test.routes.js';
app.use('/api/public', publicRoutes);
app.use('/api/test', testRoutes);
app.use('/api/landing-config', landingConfigRoutes);
app.use('/api/search', globalSearchRoutes);
app.use('/api/institutions', institutionsRoutes);
app.use('/api/institutional-responsibles', institutionalResponsiblesRoutes);
app.get('/api/evaluations/system-config', getSystemConfig);

// Apply protection to all subsequent /api routes
app.use('/api', authenticateToken, restrictAsistente);

app.use('/api/careers', careersRoutes);
app.use('/api/internship-types', internshipTypesRoutes);
app.use('/api/periodos', periodsRoutes);
app.use('/api/enrollments', enrollmentsRoutes);
app.use('/api/practices', practicesRoutes);
app.use('/api/pre-enrollments', preEnrollmentsRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/tutors', tutorsRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/lists', listsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/config', configRoutes);
app.use('/api/culmination', culminationRoutes);
app.use('/api/manuals', manualsRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/tutor', tutorDashboardRoutes);
app.use('/api/student', studentDashboardRoutes);
app.use('/api/requests', adminRequestsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/backups', backupRoutes);
app.use('/api/user/theme', userThemeRoutes);
app.use('/api/activity-logs', activityLogsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/visits', visitsRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/security-questions', securityQuestionsRoutes);
// SSE endpoint — deshabilitado en Vercel (no compatible con serverless)
if (isVercel) {
  app.get('/api/notifications/stream', (_req, res) => {
    res.status(501).json({
      message: 'SSE no disponible en serverless. Use polling o un servicio externo como Supabase Realtime.',
      alternative: '/api/notifications?limit=20&offset=0'
    });
  });
} else {
  app.get('/api/notifications/stream', subscribeToNotifications);
}

// Servir archivos estáticos del frontend (Vite build)
// Intentar encontrar la carpeta dist en lugares comunes
const possibleDistPaths = [
  path.join(process.cwd(), '../dist'),      // Desarrollo en Docker (backend está en /app, frontend en /app/../dist -> /dist?? No)
  path.join(process.cwd(), 'dist'),         // Producción en contenedor backend solo
  path.join(process.cwd(), '../../dist'),   // Producción en contenedor raíz
  path.join(__dirname, '../../dist'),       // Basado en __dirname
  path.join(__dirname, '../dist'),
];

let frontendDistPath = '';
for (const p of possibleDistPaths) {
  if (fs.existsSync(path.join(p, 'index.html'))) {
    frontendDistPath = p;
    break;
  }
}

if (frontendDistPath) {
  console.log(`[Static] Serving frontend from: ${frontendDistPath}`);
  app.use(express.static(frontendDistPath));
} else {
  console.warn(`[Static] Frontend dist directory not found. SPA catch-all will be disabled.`);
}

// Rutas principales informativas
app.get('/', (_req, res) => {
  res.json({
    message: 'UNEFA Dashboard API - Online',
    version: '1.0.0',
    documentation: 'https://github.com/Antony-Figueroa/UNEFA_DASHBOARD',
    status: 'running'
  });
});

// Catch-all para rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({
    message: 'Ruta no encontrada',
    path: req.url,
    hint: 'Verifica que el endpoint sea correcto o consulta la documentación.'
  });
});

// Error Handler
app.use((err: Error & { status?: number }, _req: Request, res: Response, _next: NextFunction) => {
  void _next; // Satisfy linter for unused required parameter
  console.error('[Error Handler]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

export { app, port };
export default app;

