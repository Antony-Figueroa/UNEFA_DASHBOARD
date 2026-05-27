/**
 * @file Middleware de validación de periodo académico.
 * @description Middleware reutilizable que valida que las operaciones se realicen
 * dentro de un periodo activo ("En Curso") y dentro del rango de fechas permitido.
 * Se aplica a módulos que dependen del periodo: visitas, evaluaciones, etc.
 */

import { Request, Response, NextFunction } from 'express';
import { SupabaseClient } from '@supabase/supabase-js';
import { dbManager } from '../lib/db-manager.js';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface PeriodData {
  PERIOD_ID: number;
  PERIOD_STATUS: string;
  START_DATE: string;
  END_DATE: string;
}

export interface PracticeData {
  PERIOD_ID: number;
  PRACTICES_STATUS: number;
  START_DATE?: string;
  END_DATE?: string;
}

/**
 * Configuración para la validación de periodo.
 */
export interface PeriodValidationConfig {
  /** Extrae el ID de la práctica desde el request (body/params). Puede ser async. */
  extractPracticeId: (req: Request) => number | string | undefined | Promise<number | string | undefined>;
  /** Extrae la fecha a validar desde el request. Si retorna undefined/null, se omite la validación de fecha. */
  extractDate: (req: Request) => string | undefined | null;
  /** Nombre legible del recurso para mensajes de error (ej: "visita", "evaluación") */
  resourceName: string;
  /** Si debe validar PRACTICES_STATUS = 2 (Inscrito) además del periodo */
  requirePracticesStatusInscribed?: boolean;
}

// ---------------------------------------------------------------------------
// Middleware factory
// ---------------------------------------------------------------------------

/**
 * Crea un middleware que valida que una operación esté dentro de un periodo
 * académico activo ("En Curso") y dentro del rango de fechas del periodo.
 *
 * Flujo:
 * 1. Extrae PRACTICE_ID del request (body o params)
 * 2. Busca la práctica en t_professional_practices → obtiene PERIOD_ID + PRACTICES_STATUS
 * 3. Si requirePracticesStatusInscribed → valida PRACTICES_STATUS = 2
 * 4. Busca el periodo en t_internships_period
 * 5. Valida PERIOD_STATUS = '2' (En Curso)
 * 6. Valida que la fecha objetivo esté entre START_DATE y END_DATE
 */
export const validatePeriodOperation = (config: PeriodValidationConfig) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const supabase = dbManager.getConnection();
      const practiceId = await config.extractPracticeId(req);

      if (!practiceId) {
        return res.status(400).json({
          success: false,
          message: `No se pudo determinar la práctica asociada a la ${config.resourceName}.`,
          code: 'MISSING_PRACTICE_ID',
        });
      }

      // --- Paso 1: Obtener la práctica y su PERIOD_ID + PRACTICES_STATUS ---
      const { data: practice, error: practiceError } = await supabase
        .from('t_professional_practices')
        .select('PERIOD_ID, PRACTICES_STATUS')
        .eq('PROFESSIONAL_PRACTICE_ID', practiceId)
        .single();

      if (practiceError || !practice) {
        return res.status(404).json({
          success: false,
          message: 'Práctica profesional no encontrada.',
          code: 'PRACTICE_NOT_FOUND',
        });
      }

      // --- Paso 2: Validar PRACTICES_STATUS (opcional) ---
      if (config.requirePracticesStatusInscribed && practice.PRACTICES_STATUS !== 2) {
        const statusLabels: Record<number, string> = {
          0: 'Retirado',
          1: 'Pre-inscrito',
          2: 'Inscrito',
          3: 'Culminado',
        };
        return res.status(403).json({
          success: false,
          message: `La práctica no está en estado "Inscrito". Estado actual: ${statusLabels[practice.PRACTICES_STATUS] || 'Desconocido'}. Las evaluaciones solo se permiten para prácticas inscritas.`,
          code: 'PRACTICE_NOT_INSCRIBED',
          currentStatus: practice.PRACTICES_STATUS,
        });
      }

      // --- Paso 3: Obtener el periodo ---
      const { data: period, error: periodError } = await supabase
        .from('t_internships_period')
        .select('PERIOD_ID, PERIOD_STATUS, START_DATE, END_DATE')
        .eq('PERIOD_ID', practice.PERIOD_ID)
        .single();

      if (periodError || !period) {
        return res.status(404).json({
          success: false,
          message: 'Periodo académico no encontrado.',
          code: 'PERIOD_NOT_FOUND',
        });
      }

      // --- Paso 4: Validar que el periodo esté "En Curso" ---
      if (period.PERIOD_STATUS !== '2') {
        const statusLabels: Record<string, string> = {
          '1': 'Pendiente',
          '2': 'En Curso',
          '3': 'Culminado',
        };
        return res.status(403).json({
          success: false,
          message: `El periodo académico (${period.PERIOD_STATUS === '1' ? 'Pendiente' : 'Culminado'}) no está activo. Solo se permite esta operación en periodos "En Curso".`,
          code: 'PERIOD_NOT_ACTIVE',
          periodStatus: period.PERIOD_STATUS,
        });
      }

      // --- Paso 5: Validar que la fecha esté dentro del rango del periodo (si se proporcionó) ---
      const dateToValidate = config.extractDate(req);
      if (dateToValidate) {
        const dateObj = new Date(dateToValidate);
        const startDate = new Date(period.START_DATE);
        const endDate = new Date(period.END_DATE);

        if (isNaN(dateObj.getTime())) {
          return res.status(400).json({
            success: false,
            message: `La fecha proporcionada para la ${config.resourceName} no es válida.`,
            code: 'INVALID_DATE',
          });
        }

        if (dateObj < startDate || dateObj > endDate) {
          const formatDate = (d: Date) => d.toLocaleDateString('es-VE');
          return res.status(403).json({
            success: false,
            message: `La fecha de la ${config.resourceName} está fuera del rango del periodo académico (${formatDate(startDate)} - ${formatDate(endDate)}).`,
            code: 'DATE_OUTSIDE_PERIOD',
            periodStart: period.START_DATE,
            periodEnd: period.END_DATE,
            providedDate: dateToValidate,
          });
        }
      }

      // Adjuntar datos útiles al request para uso posterior en el controller
      (req as any).periodValidation = {
        practice,
        period,
      };

      next();
    } catch (error) {
      console.error('[PeriodValidator] Error inesperado:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno al validar el periodo académico.',
        code: 'VALIDATION_ERROR',
      });
    }
  };
};

// ---------------------------------------------------------------------------
// Extractores pre-configurados para cada módulo
// ---------------------------------------------------------------------------

/**
 * Middleware para validar CREACIÓN de visitas.
 * Extrae practiceId y visitDate del body.
 */
export const validateCreateVisitPeriod = validatePeriodOperation({
  extractPracticeId: (req) => req.body.practiceId,
  extractDate: (req) => req.body.visitDate,
  resourceName: 'visita',
});

/**
 * Middleware para validar ACTUALIZACIÓN de visitas.
 * Extrae practiceId desde la visita existente (por params id).
 * Solo valida la fecha si el body incluye visitDate (es decir, si se está cambiando).
 */
export const validateUpdateVisitPeriod = validatePeriodOperation({
  extractPracticeId: async (req) => {
    const supabase = dbManager.getConnection();
    const { id } = req.params;
    const { data } = await supabase
      .from('t_practice_visits')
      .select('PROFESSIONAL_PRACTICE_ID')
      .eq('VISIT_ID', id)
      .single();
    return data?.PROFESSIONAL_PRACTICE_ID;
  },
  extractDate: (req) => req.body.visitDate || null, // null → skip date validation
  resourceName: 'visita',
});

/**
 * Middleware para validar CREACIÓN de evaluaciones.
 * Extrae professionalPracticeId del body y usa la fecha actual.
 * También valida que PRACTICES_STATUS = 2.
 */
export const validateCreateEvaluationPeriod = validatePeriodOperation({
  extractPracticeId: (req) => req.body.professionalPracticeId,
  extractDate: () => new Date().toISOString(),
  resourceName: 'evaluación',
  requirePracticesStatusInscribed: true,
});

/**
 * Middleware para validar ACTUALIZACIÓN de evaluaciones.
 * El practiceId se obtiene desde la evaluación existente (por params id).
 * También valida que PRACTICES_STATUS = 2.
 */
export const validateUpdateEvaluationPeriod = validatePeriodOperation({
  extractPracticeId: async (req) => {
    const supabase = dbManager.getConnection();
    const { id } = req.params;
    const { data } = await supabase
      .from('t_evaluation')
      .select('PROFESSIONAL_PRACTICE_ID')
      .eq('EVALUATION_ID', id)
      .single();
    return data?.PROFESSIONAL_PRACTICE_ID;
  },
  extractDate: () => new Date().toISOString(),
  resourceName: 'evaluación',
  requirePracticesStatusInscribed: true,
});

export default validatePeriodOperation;
