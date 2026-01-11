import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import careersRoutes from './routes/careers.routes';
import internshipTypesRoutes from './routes/internship-types.routes';
import periodsRoutes from './routes/periods.routes';
import enrollmentsRoutes from './routes/enrollments.routes';
import preEnrollmentsRoutes from './routes/pre-enrollments.routes';
import { dbManager } from './lib/db-manager';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Initialize Database
dbManager.connect().catch(err => {
  console.error('[Main] Failed to connect to database on startup:', err.message);
});

// Configuración de Seguridad (CSP) más permisiva para desarrollo
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "http://localhost:3000", "http://localhost:5173", "ws://localhost:5173", "http://backend:3000"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://*"],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
      upgradeInsecureRequests: null, // Desactivar en local si no usas HTTPS
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true
}));
app.use(express.json());

// Rutas de Supabase
app.use('/api/careers', careersRoutes);
app.use('/api/internship-types', internshipTypesRoutes);
app.use('/api/periodos', periodsRoutes);
app.use('/api/enrollments', enrollmentsRoutes);
app.use('/api/pre-enrollments', preEnrollmentsRoutes);

// Endpoint de estado de la base de datos para el frontend
app.get('/api/db-status', async (_req: Request, res: Response) => {
  const health = await dbManager.checkHealth();
  res.status(health.status === 'healthy' ? 200 : 503).json({ 
    status: health.status === 'healthy' ? 'connected' : 'disconnected',
    message: health.status === 'healthy' ? 'Conexión exitosa' : 'no hay conexion a la bd',
    error: health.details?.error,
    timestamp: new Date().toISOString()
  });
});

// Servir archivos estáticos si existiera la carpeta
app.use(express.static('public'));

// Ruta raíz
app.get('/', (_req: Request, res: Response) => {
  res.send(`
    <html>
      <head><title>Proyecto-Unefa API</title></head>
      <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #f0f2f5;">
        <h1 style="color: #1e293b;">🚀 Proyecto-Unefa Backend</h1>
        <p style="color: #64748b;">La API está conectada directamente a Supabase.</p>
        <div style="background: white; padding: 20px; border-radius: 8px; shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <strong>Endpoints:</strong>
          <ul style="margin-top: 10px;">
            <li><a href="/api/periodos">/api/periodos</a></li>
            <li><a href="/api/careers">/api/careers</a></li>
            <li><a href="/api/internship-types">/api/internship-types</a></li>
            <li><a href="/api/enrollments">/api/enrollments</a></li>
            <li><a href="/api/pre-enrollments">/api/pre-enrollments</a></li>
          </ul>
        </div>
      </body>
    </html>
  `);
});

// Health check
app.get('/api/health', async (_req: Request, res: Response) => {
  const health = await dbManager.checkHealth();
  
  res.status(health.status === 'healthy' ? 200 : 503).json({ 
    status: health.status, 
    message: 'Backend is running',
    database: health.details,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
