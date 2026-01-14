import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

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
import { dbManager } from './lib/db-manager.js';
import { performanceMiddleware } from './lib/performance-middleware.js';
import { cacheManager } from './lib/cache-manager.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Leer orígenes permitidos desde env (coma-separados). Ejemplo:
// ALLOWED_ORIGINS=https://your-frontend.vercel.app,http://localhost:5173
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

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
      connectSrc: ["'self'", "http://localhost:3000", "http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "ws://localhost:5173", "ws://localhost:5174", "ws://localhost:5175", "http://backend:3000"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://*"],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
      upgradeInsecureRequests: null,
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: (origin, callback) => {
    // permitir requests sin origin (herramientas como curl, servidores-side)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS policy: origin not allowed'), false);
  },
  credentials: true
}));
app.use(express.json());

// Routes
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

// DB status endpoint
app.get('/api/db-status', async (_req, res) => {
  const health = await dbManager.checkHealth();
  res.status(health.status === 'healthy' ? 200 : 503).json({ 
    status: health.status === 'healthy' ? 'connected' : 'disconnected',
    message: health.status === 'healthy' ? 'Conexión exitosa' : 'no hay conexion a la bd',
    error: health.details?.error,
    timestamp: new Date().toISOString()
  });
});

app.use(express.static('public'));

app.get('/', (_req, res) => {
  res.send('<html><body><h1>Proyecto-Unefa Backend</h1></body></html>');
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

export { app, port };
export default app;
