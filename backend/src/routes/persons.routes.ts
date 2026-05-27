import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import {
  getPersons,
  searchPersons,
  getPersonById,
  getPersonByCi,
  createPerson,
  updatePerson,
  togglePersonStatus,
  checkAvailability,
} from '../controllers/persons.controller.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/persons — Listado paginado
router.get('/', getPersons);

// GET /api/persons/search — Búsqueda global
router.get('/search', searchPersons);

// GET /api/persons/check/:type/:value — Verificar disponibilidad (antes de /:id para evitar conflictos)
router.get('/check/:type/:value', checkAvailability);

// GET /api/persons/by-ci/:ci — Obtener por cédula
router.get('/by-ci/:ci', getPersonByCi);

// GET /api/persons/:id — Obtener por ID
router.get('/:id', getPersonById);

// POST /api/persons — Crear persona
router.post('/', createPerson);

// PUT /api/persons/:id — Actualizar persona
router.put('/:id', updatePerson);

// PATCH /api/persons/:id/status — Cambiar estado
router.patch('/:id/status', togglePersonStatus);

export default router;
