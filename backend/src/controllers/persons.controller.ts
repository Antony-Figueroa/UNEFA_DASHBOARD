import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { sanitizeText } from '../utils/text-utils.js';
import * as personService from '../services/person.service.js';
import { auditCreate, auditUpdate } from '../utils/audit-helpers.js';

const TABLE_NAME = 't_persons';

const PERSON_COLUMNS_TO_AUDIT = [
  'ci', 'first_name', 'middle_name', 'last_name', 'second_last_name',
  'email', 'phone', 'gender', 'birthdate', 'address', 'marital_status', 'status'
];

// ============================================================
// LIST / SEARCH
// ============================================================

/**
 * GET /api/persons
 * Listado paginado de personas con búsqueda opcional.
 */
export const getPersons = async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '50',
      search,
      status
    } = req.query;

    const result = await personService.getPersons({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      search: search as string | undefined,
      status: status !== undefined ? parseInt(status as string) : undefined,
    });

    res.json(result);
  } catch (error: unknown) {
    personService.handlePersonError(res, error, 'Error al listar personas');
  }
};

/**
 * GET /api/persons/search?q=
 * Búsqueda global de personas.
 */
export const searchPersons = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ message: 'El parámetro "q" es requerido para la búsqueda' });
    }

    const results = await personService.searchPersons(q as string);
    res.json({ data: results });
  } catch (error: unknown) {
    personService.handlePersonError(res, error, 'Error al buscar personas');
  }
};

// ============================================================
// GET BY ID
// ============================================================

/**
 * GET /api/persons/:id
 */
export const getPersonById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const person = await personService.getPersonById(parseInt(id));

    if (!person) {
      return res.status(404).json({ message: 'Persona no encontrada' });
    }

    res.json(person);
  } catch (error: unknown) {
    personService.handlePersonError(res, error, 'Error al obtener persona');
  }
};

/**
 * GET /api/persons/by-ci/:ci
 */
export const getPersonByCi = async (req: Request, res: Response) => {
  try {
    const { ci } = req.params;
    const person = await personService.getPersonByCi(ci);

    if (!person) {
      return res.status(404).json({ message: 'Persona no encontrada' });
    }

    res.json(person);
  } catch (error: unknown) {
    personService.handlePersonError(res, error, 'Error al obtener persona por cédula');
  }
};

// ============================================================
// CREATE
// ============================================================

/**
 * POST /api/persons
 */
export const createPerson = async (req: AuthRequest, res: Response) => {
  try {
    const personData = req.body;

    // Validación básica
    if (!personData.ci || !personData.firstName || !personData.lastName || !personData.email) {
      return res.status(400).json({
        message: 'Error: Faltan campos requeridos (Cédula, Nombres, Apellidos y Email son obligatorios)'
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(personData.email)) {
      return res.status(400).json({ message: 'Error: El formato del correo electrónico no es válido' });
    }

    // Validar CI único
    const ciCheck = await personService.validateUniqueCi(personData.ci);
    if (!ciCheck.available) {
      return res.status(409).json({
        message: `La cédula ${personData.ci} ya está registrada`,
        personId: ciCheck.personId
      });
    }

    // Validar email único
    const emailCheck = await personService.validateUniqueEmail(personData.email);
    if (!emailCheck.available) {
      return res.status(409).json({
        message: `El correo ${personData.email} ya está registrado`,
        personId: emailCheck.personId
      });
    }

    // Normalizar texto antes de guardar
    const normalizedData = {
      ...personData,
      firstName: sanitizeText(personData.firstName) ?? personData.firstName,
      lastName: sanitizeText(personData.lastName) ?? personData.lastName,
      middleName: personData.middleName ? sanitizeText(personData.middleName) : personData.middleName,
      secondLastName: personData.secondLastName ? sanitizeText(personData.secondLastName) : personData.secondLastName,
      address: personData.address ? sanitizeText(personData.address) : personData.address,
    };

    const newPerson = await personService.createPerson(normalizedData);

    // Auditoría
    await auditCreate(req, TABLE_NAME, normalizedData, PERSON_COLUMNS_TO_AUDIT);

    res.status(201).json(newPerson);
  } catch (error: unknown) {
    personService.handlePersonError(res, error, 'Error al crear persona');
  }
};

// ============================================================
// UPDATE
// ============================================================

/**
 * PUT /api/persons/:id
 */
export const updatePerson = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const personData = req.body;
    const personId = parseInt(id);

    // Verificar que la persona existe
    const existingPerson = await personService.getPersonById(personId);
    if (!existingPerson) {
      return res.status(404).json({ message: 'Persona no encontrada' });
    }

    // Validar formato de email si se envía
    if (personData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(personData.email)) {
        return res.status(400).json({ message: 'Error: El formato del correo electrónico no es válido' });
      }
    }

    // Validar CI único si cambió
    if (personData.ci && personData.ci !== existingPerson.ci) {
      const ciCheck = await personService.validateUniqueCi(personData.ci, personId);
      if (!ciCheck.available) {
        return res.status(409).json({ message: `La cédula ${personData.ci} ya está registrada` });
      }
    }

    // Validar email único si cambió
    if (personData.email && personData.email.toLowerCase() !== existingPerson.email.toLowerCase()) {
      const emailCheck = await personService.validateUniqueEmail(personData.email, personId);
      if (!emailCheck.available) {
        return res.status(409).json({ message: `El correo ${personData.email} ya está registrado` });
      }
    }

    // Normalizar texto antes de guardar
    const normalizedData = {
      ...personData,
      ...(personData.firstName !== undefined ? { firstName: sanitizeText(personData.firstName) ?? personData.firstName } : {}),
      ...(personData.lastName !== undefined ? { lastName: sanitizeText(personData.lastName) ?? personData.lastName } : {}),
      ...(personData.middleName !== undefined ? { middleName: personData.middleName ? sanitizeText(personData.middleName) : personData.middleName } : {}),
      ...(personData.secondLastName !== undefined ? { secondLastName: personData.secondLastName ? sanitizeText(personData.secondLastName) : personData.secondLastName } : {}),
      ...(personData.address !== undefined ? { address: personData.address ? sanitizeText(personData.address) : personData.address } : {}),
    };

    const updatedPerson = await personService.updatePerson(personId, normalizedData);

    if (!updatedPerson) {
      return res.status(404).json({ message: 'Persona no encontrada' });
    }

    // Auditoría
    await auditUpdate(req, TABLE_NAME, existingPerson, normalizedData, PERSON_COLUMNS_TO_AUDIT);

    res.json(updatedPerson);
  } catch (error: unknown) {
    personService.handlePersonError(res, error, 'Error al actualizar persona');
  }
};

// ============================================================
// TOGGLE STATUS
// ============================================================

/**
 * PATCH /api/persons/:id/status
 */
export const togglePersonStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const personId = parseInt(id);

    const updatedPerson = await personService.togglePersonStatus(personId, status);

    if (!updatedPerson) {
      return res.status(404).json({ message: 'Persona no encontrada' });
    }

    res.json(updatedPerson);
  } catch (error: unknown) {
    personService.handlePersonError(res, error, 'Error al cambiar estado de persona');
  }
};

// ============================================================
// VALIDATION ENDPOINTS
// ============================================================

/**
 * GET /api/persons/check/:type/:value
 * Verifica disponibilidad de CI o email.
 */
export const checkAvailability = async (req: Request, res: Response) => {
  try {
    const { type, value } = req.params;
    const excludeId = req.query.excludeId ? parseInt(req.query.excludeId as string) : undefined;

    if (!type || !value) {
      return res.status(400).json({ message: 'Faltan parámetros: type y value son requeridos' });
    }

    let result: personService.ValidationResult;

    if (type === 'ci') {
      result = await personService.validateUniqueCi(value, excludeId);
    } else if (type === 'email') {
      result = await personService.validateUniqueEmail(value, excludeId);
    } else {
      return res.status(400).json({ message: 'Tipo de validación no válido. Use "ci" o "email"' });
    }

    res.json(result);
  } catch (error: unknown) {
    personService.handlePersonError(res, error, 'Error al verificar disponibilidad');
  }
};
