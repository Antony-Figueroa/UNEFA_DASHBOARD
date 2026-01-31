import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { careerSchema, studentSchema, tutorSchema, periodSchema, institutionSchema, responsibleSchema, enrollmentSchema, preEnrollmentSchema } from './schemas.js';
import { validate, checkRole } from './middleware.js';
import { apiCache } from './cache.js';

dotenv.config();

const app = express();

// Supabase Configuration
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Supabase credentials are missing');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false
  },
  global: {
    headers: { 'x-application-name': 'tailadmin-api' }
  },
  db: {
    schema: 'public'
  }
});

// Robust query wrapper with retry logic
const withRetry = async <T>(operation: (client: typeof supabase) => Promise<{ data: T | null; error: unknown }>): Promise<T> => {
  const maxRetries = 3;
  const retryDelay = 1000;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { data, error } = await operation(supabase);
      if (error) throw error;
      return data as T;
    } catch (error) {
      lastError = error;
      console.warn(`[Vercel-API] Attempt ${attempt} failed:`, error);
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }
  }
  throw lastError;
};

console.log(`[Vercel-API] Inicializando Supabase en: ${supabaseUrl}`);

// Security Configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: [
        "'self'", 
        "data:",
        "https://*.vercel.app", 
        "https://*.onrender.com",
        supabaseUrl,
        "https://basemaps.cartocdn.com",
        "https://*.basemaps.cartocdn.com",
        "https://server.arcgisonline.com",
        "https://*.tile.openstreetmap.org",
        "https://fonts.googleapis.com",
        "https://fonts.gstatic.com",
        "https://*"
      ],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://*"],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com", "https://*"],
      frameSrc: ["'self'", "blob:", "data:"],
      objectSrc: ["'self'", "blob:", "data:"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors());
app.use(express.json());

// Performance Monitoring Middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[API-Monitor] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

interface DbError {
  status?: number;
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
}

// Error handler helper
const handleDbError = (res: Response, error: unknown) => {
  console.error('Database Error:', error);
  
  const err = error as DbError;
  const status = err.status || 500;
  const message = err.message || 'Error interno del servidor';
  const detail = err.details || err.hint || 'No hay detalles disponibles';

  // Si hay un error de conexión, limpiamos el caché
  const isConnectionError = 
    err.code === 'PGRST301' || // JWT expired
    err.code === '57P01' ||    // admin_shutdown
    err.code === '57P03' ||    // cannot_connect_now
    message.toLowerCase().includes('connection') ||
    message.toLowerCase().includes('fetch') ||
    message.toLowerCase().includes('network');

  if (isConnectionError) {
    console.warn('[Vercel-API] Error de conexión detectado. Limpiando caché...');
    apiCache.clear();
  }

  res.status(status).json({ 
    message: 'Error en la base de datos',
    error: message,
    detail: detail
  });
};

// --- API Endpoints using Supabase ---

// --- Periodos ---
app.get('/api/periodos', async (req: Request, res: Response) => {
  try {
    const cachedData = apiCache.get('periodos');
    if (cachedData) return res.json(cachedData);

    const data = await withRetry(async (supabase) => 
      await supabase
        .from('t_period')
        .select('*')
        .order('DESCRIPTION', { ascending: true })
    );
    
    apiCache.set('periodos', data);
    res.json(data);
  } catch (error) {
    handleDbError(res, error);
  }
});

app.post('/api/periodos', validate(periodSchema), async (req: Request, res: Response) => {
  try {
    const data = await withRetry(async (supabase) => 
      await supabase
        .from('t_period')
        .insert([req.body])
        .select()
    );
    
    apiCache.delete('periodos');
    res.status(201).json((data as unknown[])[0]);
  } catch (error) {
    handleDbError(res, error);
  }
});

app.put('/api/periodos/:id', validate(periodSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = await withRetry(async (supabase) => 
      await supabase
        .from('t_period')
        .update(req.body)
        .eq('PERIOD_ID', id)
        .select()
    );
    
    apiCache.delete('periodos');
    res.json((data as unknown[])[0]);
  } catch (error) {
    handleDbError(res, error);
  }
});

app.delete('/api/periodos/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await withRetry(async (supabase) => 
      await supabase
        .from('t_period')
        .delete()
        .eq('PERIOD_ID', id)
    );
    
    apiCache.delete('periodos');
    res.status(204).send();
  } catch (error) {
    handleDbError(res, error);
  }
});

// --- Careers ---
app.get('/api/careers', async (req: Request, res: Response) => {
  try {
    const cachedData = apiCache.get('careers');
    if (cachedData) return res.json(cachedData);

    const data = await withRetry(async (supabase) => 
      await supabase
        .from('t_career')
        .select('*')
        .order('CAREER_NAME', { ascending: true })
    );
    
    apiCache.set('careers', data);
    res.json(data);
  } catch (error) {
    handleDbError(res, error);
  }
});

app.post('/api/careers', checkRole(['ADMIN']), validate(careerSchema), async (req: Request, res: Response) => {
  try {
    const data = await withRetry(async (supabase) => 
      await supabase
        .from('t_career')
        .insert([req.body])
        .select()
    );
    
    apiCache.delete('careers');
    res.status(201).json((data as unknown[])[0]);
  } catch (error) {
    handleDbError(res, error);
  }
});

app.put('/api/careers/:id', checkRole(['ADMIN']), validate(careerSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = await withRetry(async (supabase) => 
      await supabase
        .from('t_career')
        .update(req.body)
        .eq('CAREER_ID', id)
        .select()
    );
    
    apiCache.delete('careers');
    res.json((data as unknown[])[0]);
  } catch (error) {
    handleDbError(res, error);
  }
});

app.patch('/api/careers/:id/status', checkRole(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const data = await withRetry(async (supabase) => 
      await supabase
        .from('t_career')
        .update({ STATUS: status ? 1 : 0 })
        .eq('CAREER_ID', id)
        .select()
    );
    
    apiCache.delete('careers');
    res.json((data as unknown[])[0]);
  } catch (error) {
    handleDbError(res, error);
  }
});

app.delete('/api/careers/:id', checkRole(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await withRetry(async (supabase) => 
      await supabase
        .from('t_career')
        .delete()
        .eq('CAREER_ID', id)
    );
    
    apiCache.delete('careers');
    res.status(204).send();
  } catch (error) {
    handleDbError(res, error);
  }
});

// --- Enrollments ---
app.get('/api/enrollments', async (req: Request, res: Response) => {
  try {
    const cachedData = apiCache.get('enrollments');
    if (cachedData) return res.json(cachedData);

    const { data, error } = await supabase
      .from('t_enrollment')
      .select('*, t_students(*), t_period(*)');
    
    if (error) return handleDbError(res, error);
    
    apiCache.set('enrollments', data);
    res.json(data);
  } catch (error) {
    handleDbError(res, error);
  }
});

app.post('/api/enrollments', validate(enrollmentSchema), async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('t_enrollment')
      .insert([req.body])
      .select();
    
    if (error) return handleDbError(res, error);
    apiCache.delete('enrollments');
    res.status(201).json(data[0]);
  } catch (error) {
    handleDbError(res, error);
  }
});

app.delete('/api/enrollments/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('t_enrollment')
      .delete()
      .eq('ENROLLMENT_ID', id);
    
    if (error) return handleDbError(res, error);
    apiCache.delete('enrollments');
    res.status(204).send();
  } catch (error) {
    handleDbError(res, error);
  }
});

// --- Pre-Enrollments ---
app.get('/api/pre-enrollments', async (req: Request, res: Response) => {
  try {
    const cachedData = apiCache.get('pre-enrollments');
    if (cachedData) return res.json(cachedData);

    const { data, error } = await supabase
      .from('t_pre_enrollment')
      .select('*, t_students(*), t_period(*)');
    
    if (error) return handleDbError(res, error);
    
    apiCache.set('pre-enrollments', data);
    res.json(data);
  } catch (error) {
    handleDbError(res, error);
  }
});

app.post('/api/pre-enrollments', validate(preEnrollmentSchema), async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('t_pre_enrollment')
      .insert([req.body])
      .select();
    
    if (error) return handleDbError(res, error);
    apiCache.delete('pre-enrollments');
    res.status(201).json(data[0]);
  } catch (error) {
    handleDbError(res, error);
  }
});

// --- Students ---
app.get('/api/students', async (req: Request, res: Response) => {
  try {
    const cachedData = apiCache.get('students');
    if (cachedData) return res.json(cachedData);

    const { data, error } = await supabase
      .from('t_students')
      .select('*')
      .order('NAME', { ascending: true });
    
    if (error) return handleDbError(res, error);
    
    apiCache.set('students', data);
    res.json(data);
  } catch (error) {
    handleDbError(res, error);
  }
});

app.post('/api/students', validate(studentSchema), async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('t_students')
      .insert([req.body])
      .select();
    
    if (error) return handleDbError(res, error);
    apiCache.delete('students');
    res.status(201).json(data[0]);
  } catch (error) {
    handleDbError(res, error);
  }
});

app.put('/api/students/:id', validate(studentSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('t_students')
      .update(req.body)
      .eq('STUDENTS_ID', id)
      .select();
    
    if (error) return handleDbError(res, error);
    apiCache.delete('students');
    res.json(data[0]);
  } catch (error) {
    handleDbError(res, error);
  }
});

app.patch('/api/students/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { data, error } = await supabase
      .from('t_students')
      .update({ STATUS: status ? 1 : 0 })
      .eq('STUDENTS_ID', id)
      .select();
    
    if (error) return handleDbError(res, error);
    apiCache.delete('students');
    res.json(data[0]);
  } catch (error) {
    handleDbError(res, error);
  }
});

app.delete('/api/students/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('t_students')
      .delete()
      .eq('STUDENTS_ID', id);
    
    if (error) return handleDbError(res, error);
    apiCache.delete('students');
    res.status(204).send();
  } catch (error) {
    handleDbError(res, error);
  }
});

// --- Tutors ---
app.get('/api/tutors', async (req: Request, res: Response) => {
  try {
    const cachedData = apiCache.get('tutors');
    if (cachedData) return res.json(cachedData);

    const { data, error } = await supabase
      .from('t_tutors')
      .select('*')
      .order('NAME', { ascending: true });
    
    if (error) return handleDbError(res, error);
    
    apiCache.set('tutors', data);
    res.json(data);
  } catch (error) {
    handleDbError(res, error);
  }
});

app.post('/api/tutors', validate(tutorSchema), async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('t_tutors')
      .insert([req.body])
      .select();
    
    if (error) return handleDbError(res, error);
    apiCache.delete('tutors');
    res.status(201).json(data[0]);
  } catch (error) {
    handleDbError(res, error);
  }
});

app.patch('/api/tutors/:id', validate(tutorSchema.partial()), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('t_tutors')
      .update(req.body)
      .eq('TUTOR_ID', id)
      .select();
    
    if (error) return handleDbError(res, error);
    apiCache.delete('tutors');
    res.json(data[0]);
  } catch (error) {
    handleDbError(res, error);
  }
});

app.patch('/api/tutors/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { data, error } = await supabase
      .from('t_tutors')
      .update({ STATUS: status ? 1 : 0 })
      .eq('TUTOR_ID', id)
      .select();
    
    if (error) return handleDbError(res, error);
    apiCache.delete('tutors');
    res.json(data[0]);
  } catch (error) {
    handleDbError(res, error);
  }
});

app.delete('/api/tutors/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('t_tutors')
      .delete()
      .eq('TUTOR_ID', id);
    
    if (error) return handleDbError(res, error);
    apiCache.delete('tutors');
    res.status(204).send();
  } catch (error) {
    handleDbError(res, error);
  }
});

// --- Institutions ---
app.get('/api/institutions', async (req: Request, res: Response) => {
  try {
    const cachedData = apiCache.get('institutions');
    if (cachedData) return res.json(cachedData);

    const { data, error } = await supabase
      .from('t_institution')
      .select('*')
      .order('INSTITUTION_NAME', { ascending: true });
    
    if (error) return handleDbError(res, error);
    
    apiCache.set('institutions', data);
    res.json(data);
  } catch (error) {
    handleDbError(res, error);
  }
});

app.post('/api/institutions', validate(institutionSchema), async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('t_institution')
      .insert([req.body])
      .select();
    
    if (error) return handleDbError(res, error);
    apiCache.delete('institutions');
    res.status(201).json(data[0]);
  } catch (error) {
    handleDbError(res, error);
  }
});

app.patch('/api/institutions/:id', validate(institutionSchema.partial()), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('t_institution')
      .update(req.body)
      .eq('INSTITUTION_ID', id)
      .select();
    
    if (error) return handleDbError(res, error);
    apiCache.delete('institutions');
    res.json(data[0]);
  } catch (error) {
    handleDbError(res, error);
  }
});

app.patch('/api/institutions/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { data, error } = await supabase
      .from('t_institution')
      .update({ STATUS: status ? 1 : 0 })
      .eq('INSTITUTION_ID', id)
      .select();
    
    if (error) return handleDbError(res, error);
    apiCache.delete('institutions');
    res.json(data[0]);
  } catch (error) {
    handleDbError(res, error);
  }
});

app.delete('/api/institutions/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('t_institution')
      .delete() // Changed back to delete as per standard patterns
      .eq('INSTITUTION_ID', id);
    
    if (error) return handleDbError(res, error);
    apiCache.delete('institutions');
    res.status(204).send();
  } catch (error) {
    handleDbError(res, error);
  }
});

// --- Institutional Responsibles ---
app.get('/api/institutional-responsibles', async (req: Request, res: Response) => {
  try {
    const cachedData = apiCache.get('responsibles');
    if (cachedData) return res.json(cachedData);

    const { data, error } = await supabase
      .from('t_institutional_responsible')
      .select('*, t_institution(INSTITUTION_NAME)')
      .order('SURNAME', { ascending: true });
    
    if (error) return handleDbError(res, error);
    
    apiCache.set('responsibles', data);
    res.json(data);
  } catch (error) {
    handleDbError(res, error);
  }
});

app.post('/api/institutional-responsibles', validate(responsibleSchema), async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('t_institutional_responsible')
      .insert([req.body])
      .select();
    
    if (error) return handleDbError(res, error);
    apiCache.delete('responsibles');
    res.status(201).json(data[0]);
  } catch (error) {
    handleDbError(res, error);
  }
});

app.patch('/api/institutional-responsibles/:id', validate(responsibleSchema.partial()), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('t_institutional_responsible')
      .update(req.body)
      .eq('RESPONSIBLE_ID', id)
      .select();
    
    if (error) return handleDbError(res, error);
    apiCache.delete('responsibles');
    res.json(data[0]);
  } catch (error) {
    handleDbError(res, error);
  }
});

app.patch('/api/institutional-responsibles/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { data, error } = await supabase
      .from('t_institutional_responsible')
      .update({ STATUS: status ? 1 : 0 })
      .eq('RESPONSIBLE_ID', id)
      .select();
    
    if (error) return handleDbError(res, error);
    apiCache.delete('responsibles');
    res.json(data[0]);
  } catch (error) {
    handleDbError(res, error);
  }
});

app.delete('/api/institutional-responsibles/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('t_institutional_responsible')
      .delete() // Changed back to delete as per standard patterns
      .eq('RESPONSIBLE_ID', id);
    
    if (error) return handleDbError(res, error);
    apiCache.delete('responsibles');
    res.status(204).send();
  } catch (error) {
    handleDbError(res, error);
  }
});

// --- Internship Types ---
app.get('/api/internship-types', async (req: Request, res: Response) => {
  try {
    const cachedData = apiCache.get('internship-types');
    if (cachedData) return res.json(cachedData);

    const { data, error } = await supabase
      .from('t_internship_type')
      .select('*')
      .order('DESCRIPTION', { ascending: true });
    
    if (error) return handleDbError(res, error);
    
    apiCache.set('internship-types', data);
    res.json(data);
  } catch (error) {
    handleDbError(res, error);
  }
});

app.get('/api/internship-types/career/:careerId', async (req: Request, res: Response) => {
  try {
    const { careerId } = req.params;
    const { data, error } = await supabase
      .from('t_career_internship_type')
      .select('t_internship_type(*)')
      .eq('CAREER_ID', careerId);
    
    if (error) return handleDbError(res, error);
    res.json((data as { t_internship_type: unknown }[]).map((item) => item.t_internship_type));
  } catch (error) {
    handleDbError(res, error);
  }
});

// Health check and root
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'UNEFA Vercel API is running with Supabase',
    endpoints: ['/api/periodos', '/api/careers', '/api/enrollments', '/api/pre-enrollments', '/api/internship-types', '/api/db-status']
  });
});

app.get('/api/db-status', async (_req: Request, res: Response) => {
  try {
    const { error } = await supabase.from('t_career').select('CAREER_ID').limit(1);
    if (error) {
      console.error('[DB-Status] Error de conexión:', error);
      return res.status(503).json({ 
        status: 'disconnected', 
        message: 'no hay conexion a la bd',
        error: error.message 
      });
    }
    res.json({ status: 'connected', message: 'Conexión exitosa' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[DB-Status] Error inesperado:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'no hay conexion a la bd',
      error: message 
    });
  }
});

// Start Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`[Vercel-API] Servidor corriendo en puerto ${PORT}`);
});

export default app;
