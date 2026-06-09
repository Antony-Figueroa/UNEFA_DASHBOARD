/**
 * @file period-validation.service.ts
 * @description Servicio de reglas de validación de periodo.
 * 
 * Lee las reglas desde la DB (t_config.PERIOD_VALIDATION_RULES) con fallback
 * al archivo period-validation.config.ts si la DB no tiene datos.
 * 
 * Esto permite cambiar las reglas desde la UI de Parámetros del Sistema
 * sin redeployar el backend.
 */

import { dbManager } from '../lib/db-manager.js';
import { getValidationRule, type ModuleType, type OperationType, type PeriodValidationRule } from '../config/period-validation.config.js';

/**
 * Obtiene una regla de validación para un módulo y operación.
 * 
 * Prioridad:
 * 1. DB (t_config.PERIOD_VALIDATION_RULES) — configurable desde UI
 * 2. Archivo period-validation.config.ts — defaults hardcodeados
 * 
 * @param module - Módulo (visit, evaluation, pre-enrollment, enrollment)
 * @param operation - Operación (create, update)
 * @returns Regla de validación
 */
export const getPeriodValidationRule = async (
  module: ModuleType,
  operation: OperationType,
): Promise<PeriodValidationRule> => {
  try {
    const supabase = dbManager.getConnection();
    const { data, error } = await supabase
      .from('t_config')
      .select('PERIOD_VALIDATION_RULES')
      .eq('CONFIG_ID', 1)
      .maybeSingle();

    if (error || !data?.PERIOD_VALIDATION_RULES) {
      // Fallback al archivo de configuración
      return getValidationRule(module, operation);
    }

    const rules = data.PERIOD_VALIDATION_RULES as Record<string, any>;
    const moduleRules = rules[module]?.[operation];
    
    if (!moduleRules) {
      return getValidationRule(module, operation);
    }

    return {
      skipPeriodStatusCheck: moduleRules.skipPeriodStatusCheck ?? false,
      usePeriodGraceDays: moduleRules.usePeriodGraceDays ?? false,
      extendEndDateDays: moduleRules.extendEndDateDays,
      requirePracticesStatusInscribed: moduleRules.requirePracticesStatusInscribed ?? false,
    };
  } catch {
    // Si hay cualquier error (DB no disponible, etc.), fallback al archivo
    return getValidationRule(module, operation);
  }
};

/**
 * Obtiene TODAS las reglas de validación para exponerlas en la UI.
 * Combina DB + file, priorizando DB.
 */
export const getAllPeriodValidationRules = async (): Promise<Record<string, any>> => {
  try {
    const supabase = dbManager.getConnection();
    const { data, error } = await supabase
      .from('t_config')
      .select('PERIOD_VALIDATION_RULES')
      .eq('CONFIG_ID', 1)
      .maybeSingle();

    if (error || !data?.PERIOD_VALIDATION_RULES) {
      return getFileDefaults();
    }

    return data.PERIOD_VALIDATION_RULES as Record<string, any>;
  } catch {
    return getFileDefaults();
  }
};

/**
 * Retorna los defaults del archivo de configuración.
 */
const getFileDefaults = (): Record<string, any> => {
  const { periodValidationRules } = require('../config/period-validation.config.js');
  return periodValidationRules;
};

export default { getPeriodValidationRule, getAllPeriodValidationRules };
