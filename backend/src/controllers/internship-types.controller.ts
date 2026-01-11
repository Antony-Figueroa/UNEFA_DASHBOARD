import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager';

const LOOKUP_TABLE = 't_internship_type';
const JOIN_TABLE = 't_career_internship_type';

export const getAllInternshipTypes = async (req: Request, res: Response) => {
  try {
    const data = await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from(LOOKUP_TABLE)
        .select('*')
        .eq('STATUS', 1)
        .order('PRIORITY', { ascending: true });

      if (error) throw error;
      return data;
    });
    res.json(data);
  } catch (error: unknown) {
    console.error(`Error en getAllInternshipTypes:`, error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    res.status(500).json({ error: message });
  }
};

export const getInternshipTypesByCareer = async (req: Request, res: Response) => {
  try {
    const { careerId } = req.params;
    
    const flattened = await dbManager.withRetry(async (supabase) => {
      // Unimos la tabla de relación con la tabla de tipos para obtener los nombres
      const { data, error } = await supabase
        .from(JOIN_TABLE)
        .select(`
          ID_CAREER_INTERNSHIP_TYPE_ID,
          CAREER_ID,
          INTERNSHIP_TYPE_ID,
          t_internship_type (
            INTERNSHIP_TYPE_ID,
            NAME,
            PRIORITY,
            STATUS
          )
        `)
        .eq('CAREER_ID', careerId);

      if (error) throw error;

      // Aplanar la respuesta para que sea más fácil de consumir
      interface InternshipType {
        STATUS: number;
      }

      return (data || [])
        .filter(item => {
          const type = item.t_internship_type as unknown as InternshipType;
          return type?.STATUS === 1;
        })
        .map(item => item.t_internship_type);
    });

    res.json(flattened);
  } catch (error: unknown) {
    console.error(`Error en getInternshipTypesByCareer:`, error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    res.status(500).json({ error: message });
  }
};
