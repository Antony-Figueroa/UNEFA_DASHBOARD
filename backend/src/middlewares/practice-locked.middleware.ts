/**
 * @file Middleware que bloquea modificaciones a prácticas culminadas.
 * @description Una vez que una práctica tiene PRACTICES_STATUS = CULMINADO,
 * no se puede crear, editar ni eliminar visitas, evaluaciones, ni la práctica misma.
 *
 * Uso:
 *   // Práctica ID directa en params o body
 *   router.put('/:id', requireNotCulminated('params', 'id'), updateTracking);
 *
 *   // Práctica ID en body (POST)
 *   router.post('/', requireNotCulminated('body', 'practiceId'), createVisit);
 */

import { Request, Response, NextFunction } from 'express';
import { dbManager } from '../lib/db-manager.js';
import { PRACTICES_STATUS } from '../constants/practice-status.constants.js';

/**
 * Verifica que la práctica NO esté culminada antes de permitir la operación.
 * @param source  - 'params' | 'body' — dónde buscar el ID de la práctica
 * @param field   - nombre del campo (ej: 'id', 'practiceId', 'enrollmentId')
 */
export const requireNotCulminated = (source: 'params' | 'body', field: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const practiceId = parseInt(source === 'params' ? req.params[field] : req.body[field], 10);
      if (!practiceId) {
        return res.status(400).json({ message: 'ID de práctica requerido' });
      }

      const supabase = dbManager.getConnection();
      const { data: practice } = await supabase
        .from('t_professional_practices')
        .select('PRACTICES_STATUS')
        .eq('PROFESSIONAL_PRACTICE_ID', practiceId)
        .single();

      if (!practice) {
        return res.status(404).json({ message: 'Práctica no encontrada' });
      }

      if (practice.PRACTICES_STATUS === PRACTICES_STATUS.CULMINADO) {
        return res.status(423).json({
          message: 'No se puede modificar: la práctica ya está culminada. Los registros históricos no se pueden editar ni eliminar.'
        });
      }

      next();
    } catch (error) {
      console.error('[PracticeLocked] Error:', error);
      res.status(500).json({ message: 'Error al verificar estado de la práctica' });
    }
  };
};
