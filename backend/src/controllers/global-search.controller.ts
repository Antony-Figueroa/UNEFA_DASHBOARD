/**
 * @file global-search.controller.ts
 * @description Controlador para búsqueda global en el sistema
 * Busca en estudiantes, tutores, instituciones y carreras
 */

import { Request, Response } from 'express';
import { supabase } from '../lib/supabase.js';

interface SearchResult {
  students: Array<{
    id: string;
    name: string;
    ci: string;
    email: string;
    careerName?: string;
    semester?: number;
  }>;
  tutors: Array<{
    id: string;
    name: string;
    ci: string;
    email: string;
    department?: string;
  }>;
  institutions: Array<{
    id: string;
    name: string;
    rif: string;
    phone?: string;
    region?: string;
  }>;
  careers: Array<{
    id: string;
    name: string;
    code?: string;
  }>;
}

/**
 * Normaliza texto para búsqueda (elimina tildes y convierte a minúsculas)
 */
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

/**
 * Construye condición de búsqueda con ILIKE y normalización
 */
const buildSearchCondition = (term: string, fields: string[]): string => {
  const normalizedTerm = normalizeText(term);
  return fields
    .map(f => `LOWER(${f}) ILIKE '%${normalizedTerm}%'`)
    .join(' OR ');
};

/**
 * Búsqueda global en el sistema
 * Busca en estudiantes, tutores, instituciones y carreras
 */
export const globalSearch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, types, limit = 5 } = req.query;
    
    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      res.status(400).json({ 
        success: false, 
        message: 'El parámetro "q" es requerido' 
      });
      return;
    }

    const searchTerm = q.trim();
    const limitNum = Math.min(parseInt(String(limit), 10) || 5, 20); // Max 20 por tipo
    
    // Determinar qué tipos buscar
    const typesToSearch = types 
      ? (types as string).split(',').map(t => t.trim().toLowerCase())
      : ['students', 'tutors', 'institutions', 'careers'];

    const results: SearchResult = {
      students: [],
      tutors: [],
      institutions: [],
      careers: []
    };

    // Buscar estudiantes
    if (typesToSearch.includes('students')) {
      const { data: students, error: studentsError } = await supabase
        .from('t_students')
        .select(`
          STUDENTS_ID,
          t_career(CAREER_NAME),
          SEMESTER,
          t_persons!inner(ci, first_name, last_name, email)
        `)
        .eq('STATUS', true)
        .or(buildSearchCondition(searchTerm, ['t_persons.first_name', 't_persons.last_name', 't_persons.ci', 't_persons.email']))
        .limit(limitNum);

      if (studentsError) {
        console.error('[GlobalSearch] Error fetching students:', studentsError);
      } else if (students) {
        results.students = students.map((s: any) => ({
          id: String(s.STUDENTS_ID),
          name: `${s.t_persons?.first_name || ''} ${s.t_persons?.last_name || ''}`.trim(),
          ci: s.t_persons?.ci || '',
          email: s.t_persons?.email || '',
          careerName: s.t_career?.CAREER_NAME,
          semester: s.SEMESTER
        }));
      }
    }

    // Buscar tutores
    if (typesToSearch.includes('tutors')) {
      const { data: tutors, error: tutorsError } = await supabase
        .from('t_tutors')
        .select(`
          TUTOR_ID,
          DEPARTMENT,
          t_persons!inner(ci, first_name, last_name, email)
        `)
        .eq('STATUS', true)
        .or(buildSearchCondition(searchTerm, ['t_persons.first_name', 't_persons.last_name', 't_persons.ci', 't_persons.email']))
        .limit(limitNum);

      if (tutorsError) {
        console.error('[GlobalSearch] Error fetching tutors:', tutorsError);
      } else if (tutors) {
        results.tutors = tutors.map((t: any) => ({
          id: String(t.TUTOR_ID),
          name: `${t.t_persons?.first_name || ''} ${t.t_persons?.last_name || ''}`.trim(),
          ci: t.t_persons?.ci || '',
          email: t.t_persons?.email || '',
          department: t.DEPARTMENT
        }));
      }
    }

    // Buscar instituciones
    if (typesToSearch.includes('institutions')) {
      const { data: institutions, error: institutionsError } = await supabase
        .from('t_institution')
        .select(`
          INSTITUTION_ID,
          RIF,
          NAME,
          PHONE,
          REGION
        `)
        .eq('STATUS', true)
        .or(buildSearchCondition(searchTerm, ['NAME', 'RIF']))
        .limit(limitNum);

      if (institutionsError) {
        console.error('[GlobalSearch] Error fetching institutions:', institutionsError);
      } else if (institutions) {
        results.institutions = institutions.map((i: any) => ({
          id: String(i.INSTITUTION_ID),
          name: i.NAME || '',
          rif: i.RIF || '',
          phone: i.PHONE,
          region: i.REGION
        }));
      }
    }

    // Buscar carreras
    if (typesToSearch.includes('careers')) {
      const { data: careers, error: careersError } = await supabase
        .from('t_career')
        .select(`
          CAREER_ID,
          CAREER_CODE,
          CAREER_NAME
        `)
        .eq('STATUS', true)
        .or(buildSearchCondition(searchTerm, ['CAREER_NAME', 'CAREER_CODE']))
        .limit(limitNum);

      if (careersError) {
        console.error('[GlobalSearch] Error fetching careers:', careersError);
      } else if (careers) {
        results.careers = careers.map((c: any) => ({
          id: String(c.CAREER_ID),
          name: c.CAREER_NAME || '',
          code: c.CAREER_CODE
        }));
      }
    }

    // Calcular total de resultados
    const totalResults = 
      results.students.length + 
      results.tutors.length + 
      results.institutions.length + 
      results.careers.length;

    res.json({
      success: true,
      data: results,
      total: totalResults,
      query: searchTerm,
      searchedTypes: typesToSearch
    });

  } catch (error) {
    console.error('[GlobalSearch] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error en la búsqueda global'
    });
  }
};