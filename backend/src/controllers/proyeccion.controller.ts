import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

const TABLE_NAME = 't_proyeccion_pasantias';

const handleDbError = (res: Response, error: unknown) => {
  console.error('Database Error:', error);
  const dbError = error as { message?: string; details?: string; code?: string };

  let userMessage = 'Error en la base de datos';
  if (dbError.code === '23502') {
    userMessage = `Error: El campo ${dbError.details?.match(/"([^"]+)"/)?.[1] || 'requerido'} no puede estar vacío`;
  } else if (dbError.code === '23505') {
    userMessage = 'Error: Ya existe un registro con estos datos (duplicado)';
  } else if (dbError.code === '22P02') {
    userMessage = 'Error: Formato de datos inválido';
  }

  res.status(500).json({
    message: userMessage,
    error: dbError.message || 'Unknown database error'
  });
};

export const getProyeccionByPeriod = async (req: Request, res: Response) => {
  try {
    const { periodId } = req.query;

    if (!periodId) {
      return res.status(400).json({ message: 'Se requiere el parámetro periodId' });
    }

    const result = await dbManager.withRetry(async (supabase) => {
      // Get period info
      const { data: periodData, error: periodError } = await supabase
        .from('t_internships_period')
        .select('PERIOD_ID, DESCRIPTION')
        .eq('PERIOD_ID', Number(periodId))
        .maybeSingle();

      if (periodError) throw periodError;
      if (!periodData) {
        throw { code: 'NOT_FOUND', message: 'Período no encontrado' };
      }

      // Get all projections for this period with joins
      const { data: proyecciones, error: proyError } = await supabase
        .from(TABLE_NAME)
        .select(`
          proyeccion_id,
          estudiantes_proyectados,
          nucleus_id,
          career_id,
          t_system_nucleus!inner(
            nucleus_id,
            name,
            region,
            nucleus_type
          ),
    t_career!inner(
      CAREER_ID,
      CAREER_NAME,
      CAREER_TYPE
    )
        `)
        .eq('period_id', Number(periodId));

      if (proyError) throw proyError;

      // Group by nucleus
      const nucleiMap = new Map<number, any>();

      for (const p of proyecciones || []) {
        const nucleus = (p as any).t_system_nucleus;
        const career = (p as any).t_career;
        const nucleusId = nucleus.nucleus_id;

        if (!nucleiMap.has(nucleusId)) {
          nucleiMap.set(nucleusId, {
            nucleusId,
            name: nucleus.name,
            region: nucleus.region,
            nucleusType: nucleus.nucleus_type,
            shortCareers: [],
            longCareers: []
          });
        }

        const entry = nucleiMap.get(nucleusId);
        const careerEntry = {
          careerId: career.CAREER_ID,
          careerName: career.CAREER_NAME,
          proyectados: p.estudiantes_proyectados
        };

        if (career.CAREER_TYPE === 'CORTA') {
          entry.shortCareers.push(careerEntry);
        } else {
          entry.longCareers.push(careerEntry);
        }
      }

      const nuclei = Array.from(nucleiMap.values());

      // Calculate totals
      let totalShortCareers = 0;
      let totalLongCareers = 0;
      let totalStudents = 0;

      for (const n of nuclei) {
        totalShortCareers += n.shortCareers.length;
        totalLongCareers += n.longCareers.length;
        totalStudents += n.shortCareers.reduce((s: number, c: any) => s + c.proyectados, 0);
        totalStudents += n.longCareers.reduce((s: number, c: any) => s + c.proyectados, 0);
      }

      return {
        periodId: Number(periodId),
        periodDescription: periodData.DESCRIPTION,
        nuclei,
        totals: {
          totalShortCareers,
          totalLongCareers,
          totalCareers: totalShortCareers + totalLongCareers,
          totalStudents
        }
      };
    });

    res.json(result);
  } catch (error) {
    const dbError = error as { code?: string; message?: string };
    if (dbError.code === 'NOT_FOUND') {
      return res.status(404).json({ message: dbError.message });
    }
    handleDbError(res, error);
  }
};

export const upsertProyeccion = async (req: AuthRequest, res: Response) => {
  try {
    const { period_id, nucleus_id, career_id, estudiantes_proyectados } = req.body;

    if (!period_id || !nucleus_id || !career_id) {
      return res.status(400).json({ message: 'Se requieren period_id, nucleus_id y career_id' });
    }

    const data = await dbManager.withRetry(async (supabase) => {
      // Check if exists
      const { data: existing } = await supabase
        .from(TABLE_NAME)
        .select('proyeccion_id')
        .eq('period_id', period_id)
        .eq('nucleus_id', nucleus_id)
        .eq('career_id', career_id)
        .maybeSingle();

      if (existing) {
        // Update
        const { data, error } = await supabase
          .from(TABLE_NAME)
          .update({
            estudiantes_proyectados: estudiantes_proyectados ?? 0,
            updated_at: new Date().toISOString()
          })
          .eq('proyeccion_id', existing.proyeccion_id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert
        const { data, error } = await supabase
          .from(TABLE_NAME)
          .insert({
            period_id,
            nucleus_id,
            career_id,
            estudiantes_proyectados: estudiantes_proyectados ?? 0,
            created_by: req.user?.userId || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    });

    res.status(201).json(data);
  } catch (error) {
    handleDbError(res, error);
  }
};

export const batchUpsertProyeccion = async (req: AuthRequest, res: Response) => {
  try {
    const { period_id, items } = req.body;

    if (!period_id || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Se requieren period_id y un array de items' });
    }

    const data = await dbManager.withRetry(async (supabase) => {
      const results = [];

      for (const item of items) {
        const { nucleus_id, career_id, estudiantes_proyectados } = item;

        if (!nucleus_id || !career_id) continue;

        // Check if exists
        const { data: existing } = await supabase
          .from(TABLE_NAME)
          .select('proyeccion_id')
          .eq('period_id', period_id)
          .eq('nucleus_id', nucleus_id)
          .eq('career_id', career_id)
          .maybeSingle();

        if (existing) {
          const { data, error } = await supabase
            .from(TABLE_NAME)
            .update({
              estudiantes_proyectados: estudiantes_proyectados ?? 0,
              updated_at: new Date().toISOString()
            })
            .eq('proyeccion_id', existing.proyeccion_id)
            .select()
            .single();

          if (error) throw error;
          results.push(data);
        } else {
          const { data, error } = await supabase
            .from(TABLE_NAME)
            .insert({
              period_id,
              nucleus_id,
              career_id,
              estudiantes_proyectados: estudiantes_proyectados ?? 0,
              created_by: req.user?.userId || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();

          if (error) throw error;
          results.push(data);
        }
      }

      return results;
    });

    res.json(data);
  } catch (error) {
    handleDbError(res, error);
  }
};

export const getProyeccionStructure = async (req: Request, res: Response) => {
  try {
    const { periodId } = req.query;

    if (!periodId) {
      return res.status(400).json({ message: 'Se requiere el parámetro periodId' });
    }

    const result = await dbManager.withRetry(async (supabase) => {
      // Get period info
      const { data: periodData, error: periodError } = await supabase
        .from('t_internships_period')
        .select('PERIOD_ID, DESCRIPTION')
        .eq('PERIOD_ID', Number(periodId))
        .maybeSingle();

      if (periodError) throw periodError;

      // Get active nuclei with their assigned careers
      const { data: nuclei, error: nucleiError } = await supabase
        .from('t_system_nucleus')
        .select('*')
        .eq('status', 1)
        .order('name', { ascending: true });

      if (nucleiError) throw nucleiError;

      const structure = [];

      for (const nucleus of nuclei || []) {
        // Get careers assigned to this nucleus
        const { data: assignments, error: assignError } = await supabase
          .from('t_nucleus_career')
          .select(`
            nucleus_career_id,
            t_career!inner(CAREER_ID, CAREER_NAME, CAREER_TYPE)
          `)
          .eq('nucleus_id', nucleus.nucleus_id);

        if (assignError) throw assignError;

        // Get existing projections for this period + nucleus
        const { data: proyecciones } = await supabase
          .from(TABLE_NAME)
          .select('career_id, estudiantes_proyectados')
          .eq('period_id', Number(periodId))
          .eq('nucleus_id', nucleus.nucleus_id);

        // Build proyeccion map
        const proyMap = new Map<number, number>();
        for (const p of proyecciones || []) {
          proyMap.set(p.career_id, p.estudiantes_proyectados);
        }

        const careers = (assignments || []).map((a: any) => {
          const career = a.t_career;
          return {
            careerId: career.CAREER_ID,
            careerName: career.CAREER_NAME,
            careerType: career.CAREER_TYPE,
            proyectados: proyMap.get(career.CAREER_ID) || 0
          };
        });

        structure.push({
          nucleusId: nucleus.nucleus_id,
          name: nucleus.name,
          region: nucleus.region,
          nucleusType: nucleus.nucleus_type,
          careers
        });
      }

      return {
        periodId: Number(periodId),
        periodDescription: periodData?.DESCRIPTION || '',
        nuclei: structure
      };
    });

    res.json(result);
  } catch (error) {
    handleDbError(res, error);
  }
};
