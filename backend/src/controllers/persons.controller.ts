import { Request, Response } from 'express';
import { personService } from '../services/person.service.js';

export const getPersons = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status !== undefined ? parseInt(req.query.status as string) : undefined;
    const search = req.query.search as string;

    const result = await personService.getAllPersons(page, limit, { status, search });
    res.json(result);
  } catch (error) {
    personService.handlePersonError(error, 'getPersons');
  }
};

export const getPersonById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const person = await personService.getPersonById(id);

    if (!person) {
      res.status(404).json({ message: 'Persona no encontrada' });
      return;
    }

    res.json(person);
  } catch (error) {
    personService.handlePersonError(error, 'getPersonById');
  }
};

export const searchPersons = async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string) || '';
    if (!query.trim()) {
      res.json([]);
      return;
    }

    const persons = await personService.searchPersons(query);
    res.json(persons);
  } catch (error) {
    personService.handlePersonError(error, 'searchPersons');
  }
};

export const getPersonByCi = async (req: Request, res: Response) => {
  try {
    const ci = req.params.ci;
    const person = await personService.getPersonByCi(ci);

    if (!person) {
      res.status(200).json({ data: null });
      return;
    }

    res.json(person);
  } catch (error) {
    personService.handlePersonError(error, 'getPersonByCi');
  }
};

export const createPerson = async (req: Request, res: Response) => {
  try {
    const { ci, firstName, middleName, lastName, secondLastName, email, phone, gender, birthDate, address, maritalStatus } = req.body;

    if (!ci || !firstName || !lastName || !email) {
      res.status(400).json({ message: 'Faltan campos obligatorios: ci, firstName, lastName, email' });
      return;
    }

    const ciAvailable = await personService.validateUniqueCi(ci);
    if (!ciAvailable) {
      res.status(409).json({ message: 'Ya existe una persona con esta cédula' });
      return;
    }

    const emailAvailable = await personService.validateUniqueEmail(email);
    if (!emailAvailable) {
      res.status(409).json({ message: 'Ya existe una persona con este correo electrónico' });
      return;
    }

    const person = await personService.createPerson({
      ci, firstName, middleName, lastName, secondLastName, email, phone, gender, birthDate, address, maritalStatus,
    });

    res.status(201).json(person);
  } catch (error) {
    personService.handlePersonError(error, 'createPerson');
  }
};

export const updatePerson = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const personData = req.body;

    if (personData.email) {
      const emailAvailable = await personService.validateUniqueEmail(personData.email, id);
      if (!emailAvailable) {
        res.status(409).json({ message: 'Ya existe otra persona con este correo electrónico' });
        return;
      }
    }

    const person = await personService.updatePerson(id, personData);

    if (!person) {
      res.status(404).json({ message: 'Persona no encontrada' });
      return;
    }

    res.json(person);
  } catch (error) {
    personService.handlePersonError(error, 'updatePerson');
  }
};

export const togglePersonStatus = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const person = await personService.togglePersonStatus(id);
    res.json(person);
  } catch (error) {
    personService.handlePersonError(error, 'togglePersonStatus');
  }
};

export const checkCiAvailability = async (req: Request, res: Response) => {
  try {
    const ci = req.query.ci as string;
    const excludeId = req.query.excludeId ? parseInt(req.query.excludeId as string) : undefined;

    if (!ci) {
      res.status(400).json({ message: 'CI es requerido' });
      return;
    }

    const available = await personService.validateUniqueCi(ci, excludeId);
    res.json({ available, message: available ? 'CI disponible' : 'Ya existe una persona con esta cédula' });
  } catch (error) {
    personService.handlePersonError(error, 'checkCiAvailability');
  }
};

export const checkEmailAvailability = async (req: Request, res: Response) => {
  try {
    const email = req.query.email as string;
    const excludeId = req.query.excludeId ? parseInt(req.query.excludeId as string) : undefined;

    if (!email) {
      res.status(400).json({ message: 'Email es requerido' });
      return;
    }

    const available = await personService.validateUniqueEmail(email, excludeId);
    res.json({ available, message: available ? 'Email disponible' : 'Ya existe una persona con este email' });
  } catch (error) {
    personService.handlePersonError(error, 'checkEmailAvailability');
  }
};
