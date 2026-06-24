/**
 * @file Middleware de validación de periodo académico.
 * @description Middleware reutilizable que valida que las operaciones se realicen
 * dentro de un periodo activo ("En Curso") y dentro del rango de fechas permitido.
 * Se aplica a módulos que dependen del periodo: visitas, evaluaciones, etc.
 */

import { Request, Response, NextFunction } from 'express';
import { SupabaseClient } from '@supabase/supabase-js';
import { dbManager } from '../lib/db-manager.js';
import { evaluationConfig } from '../config/evaluation.config.js';
import { getValidationRule, type ModuleType, type OperationType } from '../config/period-validation.config.js';
import { getPeriodValidationRule } from '../services/period-validation.service.js';
import { PRACTICES_STATUS, PERIOD_STATUS, PRACTICES_STATUS_LABELS, PERIOD_STATUS_LABELS } from '../constants/practice-status.constants.js';
import { isFeatureEnabled, resolveDates } from '../services/period-type-dates.service.js';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface PeriodData {
  PERIOD_ID: number;
  PERIOD_STATUS: string;
  START_DATE: string;
  END_DATE: string;
  ENROLLMENT_GRACE_DAYS?: number;
  EVALUATION_GRACE_DAYS?: number;
}

export interface PracticeData {
  PERIOD_ID: number;
  PRACTICES_STATUS: number;
  START_DATE?: string;
  END_DATE?: string;
}

/**
 * Configuración para la validación de periodo.
 *
 * Dos modos de operación:
 * - **Modo práctica** (default): usa `extractPracticeId` para obtener el practiceId,
 *   busca la práctica, obtiene el PERIOD_ID, y valida.
 * - **Modo periodo directo**: si se proporciona `extractPeriodDirectly`,
 *   salta la búsqueda de práctica y valida el periodo directamente.
 *   Útil para pre-inscripciones donde aún no existe la práctica.
 */
export interface PeriodValidationConfig {
  /** Extrae el ID de la práctica desde el request (body/params). Puede ser async. */
  extractPracticeId?: (req: Request) => number | string | undefined | Promise<number | string | undefined>;
  /**
   * Extrae el PERIOD_ID directamente desde el request, saltando la búsqueda de práctica.
   * Si está presente, `extractPracticeId` se ignora. Útil para endpoints como
   * POST /pre-enrollments donde no existe una práctica aún.
   */
  extractPeriodDirectly?: (req: Request) => number | undefined | null | Promise<number | undefined | null>;
  /** Extrae la fecha a validar desde el request. Si retorna undefined/null, se omite la validación de fecha. */
  extractDate: (req: Request) => string | undefined | null;
  /** Nombre legible del recurso para mensajes de error (ej: "visita", "evaluación") */
  resourceName: string;
  /** Si debe validar PRACTICES_STATUS = 2 (Inscrito) además del periodo */
  requirePracticesStatusInscribed?: boolean;
  /**
   * Días adicionales después del END_DATE del periodo en los que se permite
   * la operación. 0 = estricto (solo dentro del periodo). -1 = sin límite.
   * Útil para ventanas de evaluación configurables.
   */
  extendEndDateDays?: number;
  /**
   * Si es true, usa los días de gracia del periodo (ENROLLMENT_GRACE_DAYS /
   * EVALUATION_GRACE_DAYS) en lugar del END_DATE estático.
   *
   * Comportamiento:
   * - Si además se especifica `extendEndDateDays` → modo evaluación:
   *   END_DATE + EVALUATION_GRACE_DAYS.
   * - Si NO se especifica `extendEndDateDays` → modo inscripción:
   *   START_DATE + ENROLLMENT_GRACE_DAYS como fecha tope.
   */
  usePeriodGraceDays?: boolean;
  /**
   * Si es true, salta la validación de PERIOD_STATUS === EN_CURSO.
   * Útil para actualizaciones de pre-inscripciones donde se necesita
   * cambiar el periodo aunque el actual ya haya finalizado.
   */
  skipPeriodStatusCheck?: boolean;
  /**
   * Módulo para búsqueda dinámica de reglas desde DB.
   * Si se provee (junto con `dbOperation`), las reglas se leen desde
   * t_config.PERIOD_VALIDATION_RULES en cada request, permitiendo
   * configuración en tiempo real desde Parámetros del Sistema.
   */
  dbModule?: ModuleType;
  /** Operación para búsqueda dinámica de reglas desde DB. */
  dbOperation?: OperationType;
  /**
   * Extrae el INTERNSHIP_TYPE_ID desde el request.
   * Cuando está presente y FEATURE_PERIOD_TYPE_DATES=true,
   * las fechas se resuelven con fallback a t_period_type_dates
   * antes de las validaciones de rango.
   */
  extractInternshipTypeId?: (req: Request) => number | undefined | null | Promise<number | undefined | null>;
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
      // Merge dinámico de reglas desde DB si está configurado
      if (config.dbModule && config.dbOperation) {
        const dbRules = await getPeriodValidationRule(config.dbModule, config.dbOperation);
        config = { ...config, ...dbRules };
      }
      const supabase = dbManager.getConnection();

      // -----------------------------------------------------------------------
      // Ruta A: Modo periodo directo — salta la búsqueda de práctica
      // Útil para pre-inscripciones/inscripciones donde no hay práctica aún
      // o el practiceId se resuelve de forma diferente.
      // -----------------------------------------------------------------------
      if (config.extractPeriodDirectly) {
        const periodId = await config.extractPeriodDirectly(req);

        if (!periodId) {
          return res.status(400).json({
            success: false,
            message: `No se pudo determinar el periodo académico para la ${config.resourceName}.`,
            code: 'MISSING_PERIOD_ID',
          });
        }

        const { data: period, error: periodError } = await supabase
          .from('t_internships_period')
          .select('PERIOD_ID, PERIOD_STATUS, START_DATE, END_DATE, ENROLLMENT_GRACE_DAYS, EVALUATION_GRACE_DAYS')
          .eq('PERIOD_ID', periodId)
          .single();

        if (periodError || !period) {
          return res.status(404).json({
            success: false,
            message: 'Periodo académico no encontrado.',
            code: 'PERIOD_NOT_FOUND',
          });
        }

        // ─── Resolución de fechas por tipo de pasantía ───
        if (config.extractInternshipTypeId && isFeatureEnabled()) {
          const internshipTypeId = await config.extractInternshipTypeId(req);
          if (internshipTypeId) {
            try {
              const resolved = await resolveDates(periodId, internshipTypeId);
              period.START_DATE = resolved.START_DATE;
              period.END_DATE = resolved.END_DATE;
            } catch {
              // Si falla la resolución, mantener fechas del periodo padre
              console.warn('[PeriodValidator] resolveDates falló, usando fechas del periodo padre');
            }
          }
        }

        // Validar PERIOD_STATUS = '2' (En Curso)
        if (!config.skipPeriodStatusCheck && period.PERIOD_STATUS !== PERIOD_STATUS.EN_CURSO) {
          return res.status(403).json({
            success: false,
            message: `El periodo académico ${PERIOD_STATUS_LABELS[period.PERIOD_STATUS] || 'Desconocido'} no está activo. Solo se permite esta operación en periodos "En Curso".`,
            code: 'PERIOD_NOT_ACTIVE',
            periodStatus: period.PERIOD_STATUS,
          });
        }

        // --- Validar fecha (misma lógica que Ruta B) ---
        // overridePeriodValidation: true salta la validación de rango de fechas
        const dateToValidate = (config.skipPeriodStatusCheck || req.body.overridePeriodValidation === true) ? null : config.extractDate(req);
        if (dateToValidate) {
          const dateObj = new Date(dateToValidate);
          const startDate = new Date(period.START_DATE);

          let effectiveEndDate: Date;

          if (config.usePeriodGraceDays) {
            if (config.extendEndDateDays !== undefined) {
              // Modo evaluación: END_DATE + extendEndDateDays (desde config/toggle UI)
              effectiveEndDate = new Date(period.END_DATE);
              const extraDays = config.extendEndDateDays >= 0
                ? config.extendEndDateDays
                : (period.EVALUATION_GRACE_DAYS ?? 0);
              effectiveEndDate.setDate(effectiveEndDate.getDate() + extraDays);
            } else {
              // Modo inscripción: START_DATE + ENROLLMENT_GRACE_DAYS
              effectiveEndDate = new Date(period.START_DATE);
              effectiveEndDate.setDate(effectiveEndDate.getDate() + (period.ENROLLMENT_GRACE_DAYS ?? 0));
            }
          } else {
            effectiveEndDate = new Date(period.END_DATE);
            if (config.extendEndDateDays && config.extendEndDateDays > 0) {
              effectiveEndDate.setDate(effectiveEndDate.getDate() + config.extendEndDateDays);
            }
          }

          if (isNaN(dateObj.getTime())) {
            return res.status(400).json({
              success: false,
              message: `La fecha proporcionada para la ${config.resourceName} no es válida.`,
              code: 'INVALID_DATE',
            });
          }

          const isValidStart = dateObj >= startDate;
          const isValidEnd = config.extendEndDateDays === -1 || dateObj <= effectiveEndDate;

          if (!isValidStart || !isValidEnd) {
            const formatDate = (d: Date) => d.toLocaleDateString('es-VE');
            const rangeEnd = config.extendEndDateDays === -1 ? 'sin límite' : formatDate(effectiveEndDate);
            return res.status(403).json({
              success: false,
              message: `La fecha de la ${config.resourceName} está fuera del rango permitido (${formatDate(startDate)} - ${rangeEnd}).`,
              code: 'DATE_OUTSIDE_PERIOD',
              periodStart: period.START_DATE,
              periodEnd: period.END_DATE,
              effectiveEndDate: effectiveEndDate.toISOString(),
              providedDate: dateToValidate,
              extendEndDateDays: config.extendEndDateDays ?? 0,
            });
          }
        }

        (req as any).periodValidation = { period };
        next();
        return;
      }

      // -----------------------------------------------------------------------
      // Ruta B: Modo práctica — flujo original
      // -----------------------------------------------------------------------
      const practiceId = await config.extractPracticeId!(req);

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
      if (config.requirePracticesStatusInscribed && practice.PRACTICES_STATUS !== PRACTICES_STATUS.INSCRITO) {
        return res.status(403).json({
          success: false,
          message: `La práctica no está en estado "${PRACTICES_STATUS_LABELS[PRACTICES_STATUS.INSCRITO]}". Estado actual: ${PRACTICES_STATUS_LABELS[practice.PRACTICES_STATUS] || 'Desconocido'}. Las evaluaciones solo se permiten para prácticas inscritas.`,
          code: 'PRACTICE_NOT_INSCRIBED',
          currentStatus: practice.PRACTICES_STATUS,
        });
      }

      // --- Paso 3: Obtener el periodo ---
      const { data: period, error: periodError } = await supabase
        .from('t_internships_period')
        .select('PERIOD_ID, PERIOD_STATUS, START_DATE, END_DATE, ENROLLMENT_GRACE_DAYS, EVALUATION_GRACE_DAYS')
        .eq('PERIOD_ID', practice.PERIOD_ID)
        .single();

      if (periodError || !period) {
        return res.status(404).json({
          success: false,
          message: 'Periodo académico no encontrado.',
          code: 'PERIOD_NOT_FOUND',
        });
      }

      // ─── Resolución de fechas por tipo de pasantía (Route B) ───
      if (config.extractInternshipTypeId && isFeatureEnabled()) {
        const internshipTypeId = await config.extractInternshipTypeId(req);
        if (internshipTypeId) {
          try {
            const resolved = await resolveDates(practice.PERIOD_ID, internshipTypeId);
            period.START_DATE = resolved.START_DATE;
            period.END_DATE = resolved.END_DATE;
          } catch {
            console.warn('[PeriodValidator] resolveDates falló (Route B), usando fechas del periodo padre');
          }
        }
      }

      // --- Paso 4: Validar que el periodo esté "En Curso" ---
      if (!config.skipPeriodStatusCheck && period.PERIOD_STATUS !== PERIOD_STATUS.EN_CURSO) {
        return res.status(403).json({
          success: false,
          message: `El periodo académico ${PERIOD_STATUS_LABELS[period.PERIOD_STATUS] || 'Desconocido'} no está activo. Solo se permite esta operación en periodos "En Curso".`,
          code: 'PERIOD_NOT_ACTIVE',
          periodStatus: period.PERIOD_STATUS,
        });
      }

      // --- Paso 5: Validar que la fecha esté dentro del rango del periodo (si se proporcionó) ---
      // Si skipPeriodStatusCheck está activo, también se salta la validación de fecha
      // porque el periodo ya finalizó y la fecha actual estaría fuera de rango.
      // overridePeriodValidation: true también salta la validación de rango de fechas.
      const dateToValidate = (config.skipPeriodStatusCheck || req.body.overridePeriodValidation === true) ? null : config.extractDate(req);
      if (dateToValidate) {
        const dateObj = new Date(dateToValidate);
        const startDate = new Date(period.START_DATE);
        
        // Calcular endDate efectivo según la configuración
        let effectiveEndDate: Date;

        if (config.usePeriodGraceDays) {
          if (config.extendEndDateDays !== undefined) {
            // Modo evaluación: END_DATE + extendEndDateDays (desde config/toggle UI)
            effectiveEndDate = new Date(period.END_DATE);
            const extraDays = config.extendEndDateDays >= 0
              ? config.extendEndDateDays
              : (period.EVALUATION_GRACE_DAYS ?? 0);
            effectiveEndDate.setDate(effectiveEndDate.getDate() + extraDays);
          } else {
            // Modo inscripción: START_DATE + ENROLLMENT_GRACE_DAYS
            effectiveEndDate = new Date(period.START_DATE);
            effectiveEndDate.setDate(effectiveEndDate.getDate() + (period.ENROLLMENT_GRACE_DAYS ?? 0));
          }
        } else {
          effectiveEndDate = new Date(period.END_DATE);
          if (config.extendEndDateDays && config.extendEndDateDays > 0) {
            effectiveEndDate.setDate(effectiveEndDate.getDate() + config.extendEndDateDays);
          }
        }

        if (isNaN(dateObj.getTime())) {
          return res.status(400).json({
            success: false,
            message: `La fecha proporcionada para la ${config.resourceName} no es válida.`,
            code: 'INVALID_DATE',
          });
        }

        // Si extendEndDateDays === -1, saltar validación de fecha máxima
        const isValidStart = dateObj >= startDate;
        const isValidEnd = config.extendEndDateDays === -1 || dateObj <= effectiveEndDate;

        if (!isValidStart || !isValidEnd) {
          const formatDate = (d: Date) => d.toLocaleDateString('es-VE');
          const rangeEnd = config.extendEndDateDays === -1 ? 'sin límite' : formatDate(effectiveEndDate);
          return res.status(403).json({
            success: false,
            message: `La fecha de la ${config.resourceName} está fuera del rango permitido (${formatDate(startDate)} - ${rangeEnd}).`,
            code: 'DATE_OUTSIDE_PERIOD',
            periodStart: period.START_DATE,
            periodEnd: period.END_DATE,
            effectiveEndDate: effectiveEndDate.toISOString(),
            providedDate: dateToValidate,
            extendEndDateDays: config.extendEndDateDays ?? 0,
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
  ...getValidationRule('visit', 'create'),
  dbModule: 'visit',
  dbOperation: 'create',
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
  ...getValidationRule('visit', 'update'),
  dbModule: 'visit',
  dbOperation: 'update',
});

/**
 * Middleware para validar CREACIÓN de evaluaciones.
 * Extrae professionalPracticeId del body y usa la fecha actual.
 * También valida que PRACTICES_STATUS = 2.
 * Respeta evaluationWindowDays desde evaluation.config.ts.
 */
const evaluationCreateRule = getValidationRule('evaluation', 'create');

export const validateCreateEvaluationPeriod = validatePeriodOperation({
  extractPracticeId: (req) => req.body.professionalPracticeId,
  extractDate: () => new Date().toISOString(),
  resourceName: 'evaluación',
  ...evaluationCreateRule,
  extendEndDateDays: evaluationCreateRule.extendEndDateDays ?? evaluationConfig.evaluationWindowDays,
  dbModule: 'evaluation',
  dbOperation: 'create',
});

const evaluationUpdateRule = getValidationRule('evaluation', 'update');

/**
 * Middleware para validar ACTUALIZACIÓN de evaluaciones.
 * El practiceId se obtiene desde la evaluación existente (por params id).
 * También valida que PRACTICES_STATUS = 2.
 * Respeta evaluationWindowDays desde evaluation.config.ts.
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
  ...evaluationUpdateRule,
  extendEndDateDays: evaluationUpdateRule.extendEndDateDays ?? evaluationConfig.evaluationWindowDays,
  dbModule: 'evaluation',
  dbOperation: 'update',
});

// ---------------------------------------------------------------------------
// Extractores para PRE-INSCRIPCIONES
// ---------------------------------------------------------------------------

/**
 * Middleware para validar CREACIÓN de pre-inscripciones.
 * Extrae el PERIOD_ID directamente desde req.body.period (description string).
 * No hay práctica todavía — se usa extractPeriodDirectly.
 */
const preEnrollmentCreateRule = getValidationRule('pre-enrollment', 'create');

export const validateCreatePreEnrollmentPeriod = validatePeriodOperation({
  extractPeriodDirectly: async (req) => {
    const supabase = dbManager.getConnection();
    const { period } = req.body;
    if (!period) return undefined;
    const { data } = await supabase
      .from('t_internships_period')
      .select('PERIOD_ID')
      .eq('DESCRIPTION', period)
      .maybeSingle();
    return data?.PERIOD_ID;
  },
  extractDate: () => null,
  resourceName: 'pre-inscripción',
  ...preEnrollmentCreateRule,
  dbModule: 'pre-enrollment',
  dbOperation: 'create',
});

const preEnrollmentUpdateRule = getValidationRule('pre-enrollment', 'update');

/**
 * Middleware para validar ACTUALIZACIÓN de pre-inscripciones.
 * req.params.id es el PROFESSIONAL_PRACTICE_ID.
 * Si el body incluye `period`, se usa la fecha actual para validar el rango.
 */
export const validateUpdatePreEnrollmentPeriod = validatePeriodOperation({
  extractPracticeId: (req) => req.params.id,
  extractDate: () => new Date().toISOString(),
  resourceName: 'pre-inscripción',
  ...preEnrollmentUpdateRule,
  dbModule: 'pre-enrollment',
  dbOperation: 'update',
});

// ---------------------------------------------------------------------------
// Extractores para INSCRIPCIONES
// ---------------------------------------------------------------------------

/**
 * Middleware para validar CREACIÓN de inscripciones.
 * Extrae el PERIOD_ID buscando la práctica pre-inscrita del estudiante.
 * No hay practiceId en el body — se busca por CI del estudiante.
 */
const enrollmentCreateRule = getValidationRule('enrollment', 'create');

export const validateCreateEnrollmentPeriod = validatePeriodOperation({
  extractPeriodDirectly: async (req) => {
    const supabase = dbManager.getConnection();
    const { identificationPrefix, identificationNumber, period } = req.body;

    // Intentar 1: buscar práctica pre-inscrita del estudiante
    if (identificationPrefix && identificationNumber) {
      const { data: person } = await supabase
        .from('t_persons')
        .select('PERSON_ID')
        .eq('identification_prefix', identificationPrefix)
        .eq('ci', identificationNumber)
        .maybeSingle();

      if (person) {
        const { data: student } = await supabase
          .from('t_students')
          .select('STUDENTS_ID')
          .eq('PERSON_ID', person.PERSON_ID)
          .maybeSingle();

        if (student) {
          const { data: practice } = await supabase
            .from('t_professional_practices')
            .select('PERIOD_ID')
            .eq('STUDENTS_ID', student.STUDENTS_ID)
            .eq('PRACTICES_STATUS', PRACTICES_STATUS.PRE_INSCRITO)
            .eq('STATUS', 1)
            .maybeSingle();

          if (practice?.PERIOD_ID) return practice.PERIOD_ID;
        }
      }
    }

    // Intentar 2: fallback al campo period del body (selección directa del periodo)
    if (period) {
      const { data: p } = await supabase
        .from('t_internships_period')
        .select('PERIOD_ID')
        .eq('DESCRIPTION', period)
        .maybeSingle();
      if (p?.PERIOD_ID) return p.PERIOD_ID;
    }

    return undefined;
  },
  extractDate: () => new Date().toISOString(),
  resourceName: 'inscripción',
  ...enrollmentCreateRule,
  dbModule: 'enrollment',
  dbOperation: 'create',
});

const enrollmentUpdateRule = getValidationRule('enrollment', 'update');

/**
 * Middleware para validar ACTUALIZACIÓN de inscripciones.
 * req.params.id es el PROFESSIONAL_PRACTICE_ID.
 */
export const validateUpdateEnrollmentPeriod = validatePeriodOperation({
  extractPracticeId: (req) => req.params.id,
  extractDate: () => new Date().toISOString(),
  resourceName: 'inscripción',
  ...enrollmentUpdateRule,
  dbModule: 'enrollment',
  dbOperation: 'update',
});

// ---------------------------------------------------------------------------
// Extractores con soporte de fechas por tipo de pasantía
// ---------------------------------------------------------------------------

/**
 * Middleware para validar CREACIÓN de pre-inscripciones con fechas por tipo.
 * Extiende validateCreatePreEnrollmentPeriod agregando resolución de
 * fechas por tipo de pasantía cuando FEATURE_PERIOD_TYPE_DATES está activo.
 */
export const validateCreatePreEnrollmentPeriodWithTypeDates = validatePeriodOperation({
  extractPeriodDirectly: async (req) => {
    const supabase = dbManager.getConnection();
    const { period } = req.body;
    if (!period) return undefined;
    const { data } = await supabase
      .from('t_internships_period')
      .select('PERIOD_ID')
      .eq('DESCRIPTION', period)
      .maybeSingle();
    return data?.PERIOD_ID;
  },
  extractInternshipTypeId: (req) => req.body.internshipTypeId,
  extractDate: () => null,
  resourceName: 'pre-inscripción',
  ...preEnrollmentCreateRule,
  dbModule: 'pre-enrollment',
  dbOperation: 'create',
});

/**
 * Middleware para validar CREACIÓN de inscripciones con fechas por tipo.
 * Extiende validateCreateEnrollmentPeriod agregando resolución de fechas
 * desde el internshipTypeId de la pre-inscripción.
 */
export const validateCreateEnrollmentPeriodWithTypeDates = validatePeriodOperation({
  extractPeriodDirectly: async (req) => {
    const supabase = dbManager.getConnection();
    const { identificationPrefix, identificationNumber, period } = req.body;

    if (identificationPrefix && identificationNumber) {
      const { data: person } = await supabase
        .from('t_persons')
        .select('PERSON_ID')
        .eq('identification_prefix', identificationPrefix)
        .eq('ci', identificationNumber)
        .maybeSingle();

      if (person) {
        const { data: student } = await supabase
          .from('t_students')
          .select('STUDENTS_ID')
          .eq('PERSON_ID', person.PERSON_ID)
          .maybeSingle();

        if (student) {
          const { data: practice } = await supabase
            .from('t_professional_practices')
            .select('PERIOD_ID, INTERNSHIP_TYPE_ID')
            .eq('STUDENTS_ID', student.STUDENTS_ID)
            .eq('PRACTICES_STATUS', PRACTICES_STATUS.PRE_INSCRITO)
            .eq('STATUS', 1)
            .maybeSingle();

          if (practice?.PERIOD_ID) {
            (req as any).__internshipTypeId = practice.INTERNSHIP_TYPE_ID;
            return practice.PERIOD_ID;
          }
        }
      }
    }

    if (period) {
      const { data: p } = await supabase
        .from('t_internships_period')
        .select('PERIOD_ID')
        .eq('DESCRIPTION', period)
        .maybeSingle();
      if (p?.PERIOD_ID) return p.PERIOD_ID;
    }

    return undefined;
  },
  extractInternshipTypeId: (req) => (req as any).__internshipTypeId,
  extractDate: () => new Date().toISOString(),
  resourceName: 'inscripción',
  ...enrollmentCreateRule,
  dbModule: 'enrollment',
  dbOperation: 'create',
});

export default validatePeriodOperation;
