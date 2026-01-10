import { Request, Response } from 'express';
import { supabase } from '../lib/supabase';

// Basado en las pruebas, la tabla se llama t_career con guión bajo
const TABLE_NAME = 't_career'; 

export const getCareers = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('CREATION_DATE', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error: unknown) {
    console.error(`Error en getCareers:`, error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    res.status(500).json({ error: message });
  }
};

export const getCareerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('CAREER_ID', id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    res.status(500).json({ error: message });
  }
};

export const createCareer = async (req: Request, res: Response) => {
  try {
    const { CAREER_CODE, CAREER_NAME, MINIMUM_GRADE, CAREER_ABBREVIATION, STATUS } = req.body;
    
    // Nota: Tu tabla no tiene internship_type_ids según la imagen, 
    // pero tiene campos de auditoría (MODIF_USER_ID, etc.)
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([
        { 
          CAREER_CODE: Number(CAREER_CODE), 
          CAREER_NAME, 
          MINIMUM_GRADE: Number(MINIMUM_GRADE), 
          CAREER_ABBREVIATION, 
          STATUS: STATUS ?? 1, // 1 para activo (smallint)
          CREATION_DATE: new Date().toISOString()
        }
      ])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    res.status(500).json({ error: message });
  }
};

export const updateCareer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update(updates)
      .eq('CAREER_ID', id)
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    res.status(500).json({ error: message });
  }
};

export const deleteCareer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Si prefieres borrado lógico (status = 0)
    const { error } = await supabase
      .from(TABLE_NAME)
      .update({ STATUS: 0 })
      .eq('CAREER_ID', id);

    if (error) throw error;
    res.status(204).send();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    res.status(500).json({ error: message });
  }
};

export const bulkDeleteCareers = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    const { error } = await supabase
      .from(TABLE_NAME)
      .update({ STATUS: 0 })
      .in('CAREER_ID', ids);

    if (error) throw error;
    res.status(204).send();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    res.status(500).json({ error: message });
  }
};
