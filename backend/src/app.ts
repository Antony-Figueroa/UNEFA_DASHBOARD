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
import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import { dbManager } from './lib/db-manager.js';
import { performanceMiddleware } from './lib/performance-middleware.js';
import { authenticateToken, restrictAsistente } from './middlewares/auth.middleware.js';

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

console.log(`[CORS] Allowed Origins:`, allowedOrigins);

// Performance monitoring
app.use(performanceMiddleware);

// Initialize Database (non-blocking)
dbManager.connect().catch(err => {
  console.error('[Main] Failed to connect to database on startup:', err.message);
});

// Security config (dev friendly)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: [
        "'self'", 
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

    if (isAllowed || origin.endsWith('.onrender.com')) {
      return callback(null, true);
    }
    
    console.warn(`[CORS] Rejected origin: ${origin}`);
    return callback(new Error('CORS policy: origin not allowed'), false);
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
app.use('/api/users', usersRoutes);

// Public Health endpoints (Must be before authentication)
app.get('/api/db-status', async (_req, res) => {
  const health = await dbManager.checkHealth();
  res.status(health.status === 'healthy' ? 200 : 503).json({ 
    status: health.status === 'healthy' ? 'connected' : 'disconnected',
    message: health.status === 'healthy' ? 'Conexión exitosa' : 'no hay conexion a la bd',
    error: health.details?.error,
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

// Apply protection to all subsequent /api routes
app.use('/api', authenticateToken, restrictAsistente);

app.use('/api/careers', careersRoutes);
app.use('/api/internship-types', internshipTypesRoutes);
app.use('/api/periodos', periodsRoutes);
app.use('/api/enrollments', enrollmentsRoutes);
app.use('/api/pre-enrollments', preEnrollmentsRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/tutors', tutorsRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/institutions', institutionsRoutes);
app.use('/api/institutional-responsibles', institutionalResponsiblesRoutes);
app.use('/api/lists', listsRoutes);
app.use('/api/dashboard', dashboardRoutes);

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

// Catch-all para el frontend (SPA)
app.get('*', (req, res, next) => {
  // Si la ruta empieza por /api, no servir el index.html
  if (req.url.startsWith('/api')) {
    return next();
  }
  
  if (frontendDistPath) {
    const indexPath = path.join(frontendDistPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
  }

  // En desarrollo, o si no se encontró el build, devolvemos un JSON informativo
  res.status(404).json({
    message: 'Frontend build not found or route not handled',
    hint: 'If you are in development, use the frontend dev server (localhost:5173).',
    path: req.url,
    distPath: frontendDistPath || 'not found'
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
