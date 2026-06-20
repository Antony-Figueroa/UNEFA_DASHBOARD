/**
 * @file period-type-dates.controller.ts
 * @description CRUD controller for t_period_type_dates.
 *
 * Endpoints:
 *   GET    /?periodId=       → getAllByPeriod
 *   GET    /:id              → getById
 *   POST   /                 → upsert (create or update by periodId+internshipTypeId)
 *   PUT    /:id              → update (partial update by ID)
 *   DELETE /:id              → delete (soft-delete or hard-delete)
 *
 * All operations check the FEATURE_PERIOD_TYPE_DATES flag at the service layer.
 * Audit logging via audit-helpers for create/update/delete.
 */

import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { auditCreate, auditUpdate, auditDelete } from '../utils/audit-helpers.js';
import { getTypeDatesByPeriod } from '../services/period-type-dates.service.js';

const TABLE_NAME = 't_period_type_dates';

const COLUMNS_TO_AUDIT = [
  'PERIOD_ID', 'INTERNSHIP_TYPE_ID', 'START_DATE', 'END_DATE'
];

// ---------------------------------------------------------------------------
// Error handler
// ---------------------------------------------------------------------------

interface AppError extends Error {
  code?: string;
  details?: string;
}

const handleDbError = (res: Response, error: unknown) => {
  console.error('Database Error:', error);
  const dbError = error as AppError;

  let userMessage = 'Error en la base de datos';
  let statusCode = 500;

  if (dbError.code === '23502') {
    userMessage = `Error: El campo ${dbError.details?.match(/"([^"]+)"/)?.[1] || 'requerido'} no puede estar vacío`;
  } else if (dbError.code === '23505') {
    userMessage = 'Error: Ya existe un registro con estos datos (duplicado)';
  } else if (dbError.code === '404') {
    statusCode = 404;
    userMessage = dbError.message || 'Registro no encontrado';
    return res.status(statusCode).json({ message: userMessage });
  } else if (dbError.code === '22P02') {
    userMessage = 'Error: Formato de datos inválido';
  }

  res.status(statusCode).json({
    message: userMessage,
    error: dbError.message || 'Unknown database error',
  });
};

// ---------------------------------------------------------------------------
// GET /?periodId=
// ---------------------------------------------------------------------------

export const getAllByPeriod = async (req: Request, res: Response) => {
  try {
    const periodId = parseInt(req.query.periodId as string, 10);

    if (isNaN(periodId)) {
      return res.status(400).json({ message: 'periodId query parameter is required and must be a number' });
    }

    const data = await getTypeDatesByPeriod(periodId);
    res.json(data);
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

// ---------------------------------------------------------------------------
// GET /:id
// ---------------------------------------------------------------------------

export const getById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const data = await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('ID', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          const nf = new Error(`Registro con ID ${id} no encontrado`) as AppError;
          nf.code = '404';
          throw nf;
        }
        throw error;
      }
      return data;
    });

    res.json(data);
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

// ---------------------------------------------------------------------------
// POST / — Upsert
// ---------------------------------------------------------------------------

export const upsertTypeDate = async (req: AuthRequest, res: Response) => {
  try {
    const { periodId, internshipTypeId, startDate, endDate } = req.body;

    if (!periodId || !internshipTypeId) {
      return res.status(400).json({ message: 'periodId and internshipTypeId are required' });
    }

    const data = await dbManager.withRetry(async (supabase) => {
      // Check if a record already exists for this combination
      const { data: existing } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('PERIOD_ID', periodId)
        .eq('INTERNSHIP_TYPE_ID', internshipTypeId)
        .maybeSingle();

      const now = new Date().toISOString();
      const userId = req.user?.userId ?? null;

      if (existing) {
        // Update existing record
        const updatePayload: Record<string, unknown> = {};
        if (startDate !== undefined) updatePayload.START_DATE = startDate || null;
        if (endDate !== undefined) updatePayload.END_DATE = endDate || null;
        updatePayload.MODIF_USER_ID = userId;
        updatePayload.MODIF_USER_DATE = now;

        const { data: updated, error } = await supabase
          .from(TABLE_NAME)
          .update(updatePayload)
          .eq('ID', existing.ID)
          .select()
          .single();

        if (error) throw error;

        await auditUpdate(req, TABLE_NAME, existing, updatePayload, COLUMNS_TO_AUDIT);
        return updated;
      } else {
        // Create new record
        const insertPayload = {
          PERIOD_ID: periodId,
          INTERNSHIP_TYPE_ID: internshipTypeId,
          START_DATE: startDate || null,
          END_DATE: endDate || null,
          CREATION_DATE: now,
          MODIF_USER_ID: userId,
        };

        const { data: created, error } = await supabase
          .from(TABLE_NAME)
          .insert([insertPayload])
          .select()
          .single();

        if (error) throw error;

        await auditCreate(req, TABLE_NAME, insertPayload, COLUMNS_TO_AUDIT);
        return created;
      }
    }, 'upsertTypeDate');

    res.status(201).json(data);
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

// ---------------------------------------------------------------------------
// PUT /:id — Partial update
// ---------------------------------------------------------------------------

export const updateTypeDate = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.body;

    const data = await dbManager.withRetry(async (supabase) => {
      // Get existing record
      const { data: existing, error: readError } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('ID', id)
        .single();

      if (readError) {
        if (readError.code === 'PGRST116') {
          const nf = new Error(`Registro con ID ${id} no encontrado`) as AppError;
          nf.code = '404';
          throw nf;
        }
        throw readError;
      }

      const now = new Date().toISOString();
      const updatePayload: Record<string, unknown> = {
        MODIF_USER_ID: req.user?.userId ?? null,
        MODIF_USER_DATE: now,
      };
      if (startDate !== undefined) updatePayload.START_DATE = startDate || null;
      if (endDate !== undefined) updatePayload.END_DATE = endDate || null;

      const { data: updated, error } = await supabase
        .from(TABLE_NAME)
        .update(updatePayload)
        .eq('ID', id)
        .select()
        .single();

      if (error) throw error;

      await auditUpdate(req, TABLE_NAME, existing, updatePayload, COLUMNS_TO_AUDIT);
      return updated;
    });

    res.json(data);
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

// ---------------------------------------------------------------------------
// DELETE /:id — Hard delete
// ---------------------------------------------------------------------------

export const deleteTypeDate = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await dbManager.withRetry(async (supabase) => {
      // Get existing record for audit
      const { data: existing, error: readError } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('ID', id)
        .single();

      if (readError) {
        if (readError.code === 'PGRST116') {
          const nf = new Error(`Registro con ID ${id} no encontrado`) as AppError;
          nf.code = '404';
          throw nf;
        }
        throw readError;
      }

      const { error } = await supabase
        .from(TABLE_NAME)
        .delete()
        .eq('ID', id);

      if (error) throw error;

      // Log deletion timestamp if record had one
      await auditDelete(req, TABLE_NAME, existing, COLUMNS_TO_AUDIT);
    });

    res.status(204).send();
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};
