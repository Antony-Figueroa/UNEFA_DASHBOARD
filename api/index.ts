import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import axios, { AxiosRequestConfig } from 'axios';

dotenv.config();

const app = express();
const MOCK_API_URL = process.env.MOCK_API_URL || 'https://694ed7abb5bc648a93c169dc.mockapi.io';

// Configuración de Seguridad (CSP) adaptada para producción (Vercel)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "https://*.vercel.app", MOCK_API_URL],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://*"],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors());
app.use(express.json());

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

    if (axios.isAxiosError(error)) {
      console.error(`[AxiosError] ${error.config?.method?.toUpperCase()} ${error.config?.url} - Status: ${status} - Message: ${error.message}`);
      if (error.code === 'ECONNABORTED') {
        console.error(`[Timeout] La petición excedió el tiempo límite de ${axiosConfig.timeout}ms`);
      }
    }
    
    throw error;
  }
}

// Helper to handle MockAPI responses which are sometimes wrapped or inconsistent
const handleApiResponse = (res: Response, data: unknown) => {
  if (data && typeof data === 'object' && 'data' in data) {
    const wrappedData = data as { data: unknown };
    if (Array.isArray(wrappedData.data)) {
      return res.json(wrappedData.data);
    }
  }
  res.json(data);
};

// Helper to get error message safely
const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

// --- Proxy Endpoints to MockAPI ---

// Periods
app.get('/api/periodos', async (_req: Request, res: Response) => {
  try {
    const url = `${MOCK_API_URL}/periodos`;
    console.log(`[Proxy GET] ${url}`);
    const response = await axiosWithRetry({ method: 'get', url });
    handleApiResponse(res, response.data);
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    console.error(`[Proxy GET] Error periodos:`, errorMessage);
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
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
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
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
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
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
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
    handleApiResponse(res, response.data);
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
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
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    console.error('[Proxy POST] Error careers:', errorMessage);
    res.status(500).json({ message: 'Error al crear en MockAPI (careers)', error: errorMessage });
  }
});

app.put('/api/careers/:id', async (req: Request, res: Response) => {
  try {
    const url = `${MOCK_API_URL}/careers/${req.params.id}`;
    // Limpiar el body: MockAPI puede fallar si se envían identificadores o campos de sistema en el body
    const updateData = { ...req.body };
    delete updateData.id;
    delete updateData.careerId;
    delete updateData.CAREER_ID;
    delete updateData.creationDate;
    delete updateData.CREATION_DATE;
    delete updateData.STATUS;

    console.log(`[Proxy PUT] ${url}`, updateData);
    const response = await axiosWithRetry({
      method: 'put',
      url,
      data: updateData
    });
    res.json(response.data);
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
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
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    console.error('[Proxy DELETE] Error careers:', errorMessage);
    res.status(500).json({ message: 'Error al eliminar en MockAPI (careers)', error: errorMessage });
  }
});

// Note: Students and Tutors endpoints have been removed as these modules now operate in Static Demo Mode.

// Root path for Vercel health check or simple landing
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'UNEFA Vercel API is running',
    endpoints: ['/api/periodos', '/api/careers']
  });
});

// Exportar la app como default para Vercel
export default app;
