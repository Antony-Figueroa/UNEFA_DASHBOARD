import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import axios, { AxiosRequestConfig } from 'axios';
import careersRoutes from './routes/careers.routes';
import { supabase } from './lib/supabase';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const MOCK_API_URL = 'https://694ed7abb5bc648a93c169dc.mockapi.io';

// Configuración de Seguridad (CSP) más permisiva para desarrollo
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "http://localhost:3000", "http://localhost:5173", "ws://localhost:5173", "http://backend:3000", "https://694ed7abb5bc648a93c169dc.mockapi.io"],
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

// Servir archivos estáticos si existiera la carpeta
app.use(express.static('public'));

// Ruta raíz para evitar 404
app.get('/', (_req: Request, res: Response) => {
  res.send(`
    <html>
      <head><title>Proyecto-Unefa API</title></head>
      <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #f0f2f5;">
        <h1 style="color: #1e293b;">🚀 Proyecto-Unefa Backend</h1>
        <p style="color: #64748b;">La API está actuando como Proxy para MockAPI.</p>
        <div style="background: white; padding: 20px; border-radius: 8px; shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <strong>Endpoints Proxied:</strong>
          <ul style="margin-top: 10px;">
            <li><a href="/api/periodos">/api/periodos</a> (Desde MockAPI)</li>
            <li><a href="/api/careers">/api/careers</a> (Desde MockAPI)</li>
          </ul>
        </div>
      </body>
    </html>
  `);
});

// Endpoint solicitado por Chrome DevTools
app.get('/.well-known/appspecific/com.chrome.devtools.json', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    description: 'Chrome DevTools endpoint for development'
  });
});

app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    const mockApiCheck = await axios.get(`${MOCK_API_URL}/health`).catch(() => ({ status: 'unknown' }));
    
    // Verificar conexión a Supabase
    const { error: supabaseError } = await supabase.from('careers').select('count', { count: 'exact', head: true });
    
    res.json({ 
      status: 'ok', 
      message: 'Backend is running',
      proxyTarget: MOCK_API_URL,
      mockApiStatus: mockApiCheck.status === 200 ? 'reachable' : 'unreachable',
      supabaseStatus: supabaseError ? `error: ${supabaseError.message}` : 'connected'
    });
  } catch {
    res.json({ status: 'ok', message: 'Backend is running', mockApiStatus: 'unreachable', supabaseStatus: 'error' });
  }
});

// Helper para manejar reintentos en caso de errores temporales (503, 429)
async function axiosWithRetry(config: AxiosRequestConfig, retries = 3, backoff = 1000) {
  const axiosConfig = {
    ...config,
    timeout: config.timeout || 10000, // Timeout por defecto de 10s
  };

  try {
    return await axios(axiosConfig);
  } catch (error: unknown) {
    let status: number | undefined;
    
    if (axios.isAxiosError(error)) {
      status = error.response?.status;
    }

    const isRetryable = status === 429 || (status && status >= 500);

    if (retries > 0 && isRetryable) {
      console.warn(`[Retry] Error ${status} en MockAPI. Reintentando en ${backoff}ms... (${retries} intentos restantes)`);
      await new Promise(resolve => setTimeout(resolve, backoff));
      return axiosWithRetry(config, retries - 1, backoff * 1.5);
    }

    // Log detallado del error antes de lanzar
    if (axios.isAxiosError(error)) {
      console.error(`[AxiosError] ${error.config?.method?.toUpperCase()} ${error.config?.url} - Status: ${status} - Message: ${error.message}`);
      if (error.code === 'ECONNABORTED') {
        console.error(`[Timeout] La petición excedió el tiempo límite de ${axiosConfig.timeout}ms`);
      }
    } else {
      console.error(`[UnknownError]`, error);
    }
    
    throw error;
  }
}

// Helper to handle MockAPI responses which are sometimes wrapped or inconsistent
const handleApiResponse = (res: Response, data: unknown) => {
  // MockAPI usually returns an array or an object directly
  // but if it ever returns { data: [...] }, we handle it here
  if (data && typeof data === 'object' && 'data' in data) {
    const wrappedData = data as { data: unknown };
    if (Array.isArray(wrappedData.data)) {
      return res.json(wrappedData.data);
    }
  }
  res.json(data);
};

// --- Proxy Endpoints to MockAPI ---

// Periods
app.get('/api/periodos', async (_req: Request, res: Response) => {
  try {
    const url = `${MOCK_API_URL}/periodos`;
    console.log(`[Proxy GET] ${url}`);
    const response = await axiosWithRetry({ method: 'get', url });
    console.log(`[Proxy GET] Success: ${Array.isArray(response.data) ? response.data.length : '1'} items`);
    handleApiResponse(res, response.data);
  } catch (error) {
    const errorMessage = axios.isAxiosError(error) ? error.message : 'Unknown error';
    console.error(`[Proxy GET] Error fetching periods:`, errorMessage);
    res.status(500).json({ message: 'Error al conectar con MockAPI (periodos)', error: errorMessage });
  }
});

app.post('/api/periodos', async (req: Request, res: Response) => {
  try {
    console.log(`[Proxy POST] ${MOCK_API_URL}/periodos`, req.body);
    const response = await axiosWithRetry({
      method: 'post',
      url: `${MOCK_API_URL}/periodos`,
      data: req.body
    });
    res.status(201).json(response.data);
  } catch (error) {
    const errorMessage = axios.isAxiosError(error) ? error.message : 'Unknown error';
    console.error('[Proxy POST] Error periodos:', errorMessage);
    res.status(500).json({ message: 'Error al crear en MockAPI (periodos)', error: errorMessage });
  }
});

app.put('/api/periodos/:id', async (req: Request, res: Response) => {
  try {
    const url = `${MOCK_API_URL}/periodos/${req.params.id}`;
    // Limpiar el body para evitar conflictos con el ID en la URL
    const updateData = { ...req.body };
    delete updateData.id;
    delete updateData.periodId;
    console.log(`[Proxy PUT] ${url}`, updateData);
    const response = await axiosWithRetry({
      method: 'put',
      url,
      data: updateData
    });
    res.json(response.data);
  } catch (error) {
    const errorMessage = axios.isAxiosError(error) ? error.message : 'Unknown error';
    console.error('[Proxy PUT] Error periodos:', errorMessage);
    res.status(500).json({ message: 'Error al actualizar en MockAPI (periodos)', error: errorMessage });
  }
});

app.delete('/api/periodos/:id', async (req: Request, res: Response) => {
  try {
    const url = `${MOCK_API_URL}/periodos/${req.params.id}`;
    console.log(`[Proxy DELETE] ${url}`);
    const response = await axiosWithRetry({ method: 'delete', url });
    res.json(response.data);
  } catch (error) {
    const errorMessage = axios.isAxiosError(error) ? error.message : 'Unknown error';
    console.error('[Proxy DELETE] Error periodos:', errorMessage);
    res.status(500).json({ message: 'Error al eliminar en MockAPI (periodos)', error: errorMessage });
  }
});

// Careers
app.get('/api/careers', async (_req: Request, res: Response) => {
  try {
    const url = `${MOCK_API_URL}/careers`;
    console.log(`[Proxy GET] ${url}`);
    const response = await axiosWithRetry({ method: 'get', url });
    console.log(`[Proxy GET] Success: ${Array.isArray(response.data) ? response.data.length : '1'} items`);
    handleApiResponse(res, response.data);
  } catch (error) {
    const errorMessage = axios.isAxiosError(error) ? error.message : 'Unknown error';
    console.error('[Proxy GET] Error careers:', errorMessage);
    res.status(500).json({ message: 'Error al conectar con MockAPI (careers)', error: errorMessage });
  }
});

app.post('/api/careers', async (req: Request, res: Response) => {
  try {
    const url = `${MOCK_API_URL}/careers`;
    console.log(`[Proxy POST] ${url}`, req.body);
    const response = await axiosWithRetry({
      method: 'post',
      url,
      data: req.body
    });
    res.status(201).json(response.data);
  } catch (error) {
    const errorMessage = axios.isAxiosError(error) ? error.message : 'Unknown error';
    console.error('[Proxy POST] Error careers:', errorMessage);
    res.status(500).json({ message: 'Error al crear en MockAPI (careers)', error: errorMessage });
  }
});

app.put('/api/careers/:id', async (req: Request, res: Response) => {
  try {
    const url = `${MOCK_API_URL}/careers/${req.params.id}`;
    const updateData = { ...req.body };
    delete updateData.id;
    console.log(`[Proxy PUT] ${url}`, updateData);
    const response = await axiosWithRetry({
      method: 'put',
      url,
      data: updateData
    });
    res.json(response.data);
  } catch (error) {
    const errorMessage = axios.isAxiosError(error) ? error.message : 'Unknown error';
    console.error('[Proxy PUT] Error careers:', errorMessage);
    res.status(500).json({ message: 'Error al actualizar en MockAPI (careers)', error: errorMessage });
  }
});

app.delete('/api/careers/:id', async (req: Request, res: Response) => {
  try {
    const url = `${MOCK_API_URL}/careers/${req.params.id}`;
    console.log(`[Proxy DELETE] ${url}`);
    const response = await axiosWithRetry({ method: 'delete', url });
    res.json(response.data);
  } catch (error) {
    const errorMessage = axios.isAxiosError(error) ? error.message : 'Unknown error';
    console.error('[Proxy DELETE] Error careers:', errorMessage);
    res.status(500).json({ message: 'Error al eliminar en MockAPI (careers)', error: errorMessage });
  }
});

// Students Proxy
app.get('/api/students', async (_req: Request, res: Response) => {
  try {
    const url = `${MOCK_API_URL}/students`;
    console.log(`[Proxy GET] ${url}`);
    const response = await axiosWithRetry({ method: 'get', url });
    handleApiResponse(res, response.data);
  } catch (error) {
    const errorMessage = axios.isAxiosError(error) ? error.message : 'Unknown error';
    console.error('[Proxy GET] Error students:', errorMessage);
    res.status(500).json({ message: 'Error al conectar con MockAPI (students)', error: errorMessage });
  }
});

app.post('/api/students', async (req: Request, res: Response) => {
  try {
    const response = await axiosWithRetry({
      method: 'post',
      url: `${MOCK_API_URL}/students`,
      data: req.body
    });
    res.status(201).json(response.data);
  } catch (error) {
    const errorMessage = axios.isAxiosError(error) ? error.message : 'Unknown error';
    console.error('[Proxy POST] Error students:', errorMessage);
    res.status(500).json({ message: 'Error al crear en MockAPI (students)' });
  }
});

// Tutors Proxy
app.get('/api/tutors', async (_req: Request, res: Response) => {
  try {
    const url = `${MOCK_API_URL}/tutors`;
    console.log(`[Proxy GET] ${url}`);
    const response = await axiosWithRetry({ method: 'get', url });
    handleApiResponse(res, response.data);
  } catch (error) {
    const errorMessage = axios.isAxiosError(error) ? error.message : 'Unknown error';
    console.error('[Proxy GET] Error tutors:', errorMessage);
    res.status(500).json({ message: 'Error al conectar con MockAPI (tutors)' });
  }
});

app.post('/api/tutors', async (req: Request, res: Response) => {
  try {
    const response = await axiosWithRetry({
      method: 'post',
      url: `${MOCK_API_URL}/tutors`,
      data: req.body
    });
    res.status(201).json(response.data);
  } catch (error) {
    const errorMessage = axios.isAxiosError(error) ? error.message : 'Unknown error';
    console.error('[Proxy POST] Error tutors:', errorMessage);
    res.status(500).json({ message: 'Error al crear en MockAPI (tutors)' });
  }
});


app.listen(port, () => {
  console.log(`Backend listening at http://localhost:${port}`);
});
