/**
 * AI Tools Service - Herramientas predefinidas para Tool Use
 *
 * Patrón: Verified Queries - Solo consultas predefinidas y validadas
 * Seguridad: La IA solo puede ejecutar acciones definidas aquí
 */

import { registerTool, getToolsForProvider, AITool } from './ai-provider.factory.js';
import { supabase } from '../lib/supabase.js';

// ============================================
// Type Definitions
// ============================================

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

// ============================================
// Available Tools - consultas predefinidas
// ============================================

/**
 * get_students - Obtiene lista de estudiantes
 */
const getStudentsTool = {
  name: 'get_students',
  description: 'Obtiene la lista de estudiantes del sistema. Use esta herramienta cuando el usuario pregunte por estudiantes, cuántos hay, liste estudiantes, etc.',
  parameters: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Número máximo de estudiantes a retornar (default: 10)',
      },
      search: {
        type: 'string',
        description: 'Búsqueda por nombre o cédula (opcional)',
      },
      status: {
        type: 'string',
        description: 'Filtrar por estado: active, inactive, all (default: active)',
      },
    },
    required: [],
  },
  handler: async (args: Record<string, unknown>): Promise<ToolResult> => {
    try {
      const limit = (args.limit as number) || 10;
      const search = args.search as string | undefined;
      const status = (args.status as string) || 'active';

      let query = supabase
        .from('t_students')
        .select('*, t_career(name), t_user(email, created_at)')
        .limit(limit);

      if (search) {
        query = query.or(`name.ilike.%${search}%,ci.ilike.%${search}%`);
      }

      if (status !== 'all') {
        // Por defecto filtramos solo activos
        query = query.eq('status', status === 'active' ? true : false);
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        success: true,
        data: {
          count: data?.length || 0,
          students: data?.map(s => ({
            ci: s.ci,
            name: s.name,
            surname: s.surname,
            career: s.t_career?.name,
            email: s.t_user?.email,
            status: s.status ? 'Activo' : 'Inactivo',
          })),
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

/**
 * get_careers - Obtiene lista de carreras
 */
const getCareersTool = {
  name: 'get_careers',
  description: 'Obtiene las carreras universitarias disponibles. Use cuando el usuario pregunte por carreras, cuántas hay, liste carreras, etc.',
  parameters: {
    type: 'object',
    properties: {
      active_only: {
        type: 'boolean',
        description: 'Solo mostrar activas (default: true)',
      },
    },
    required: [],
  },
  handler: async (args: Record<string, unknown>): Promise<ToolResult> => {
    try {
      const activeOnly = args.active_only !== false;

      let query = supabase.from('t_career').select('*');

      if (activeOnly) {
        query = query.eq('status', true);
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        success: true,
        data: {
          count: data?.length || 0,
          careers: data?.map(c => ({
            id: c.id,
            name: c.name,
            code: c.code,
            status: c.status ? 'Activa' : 'Inactiva',
          })),
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

/**
 * get_internships - Obtiene pasantías activas
 */
const getInternshipsTool = {
  name: 'get_internships',
  description: 'Obtiene las pasantías o prácticas profesionales registradas. Use cuando el usuario pregunte por pasantías, prácticas, cuántas hay, etc.',
  parameters: {
    type: 'object',
    properties: {
      period_id: {
        type: 'string',
        description: 'Filtrar por período (opcional)',
      },
      limit: {
        type: 'number',
        description: 'Límite de resultados (default: 10)',
      },
    },
    required: [],
  },
  handler: async (args: Record<string, unknown>): Promise<ToolResult> => {
    try {
      const limit = (args.limit as number) || 10;
      const periodId = args.period_id as string | undefined;

      let query = supabase
        .from('t_professional_practices')
        .select(`
          *,
          t_students:STUDENTS_ID (
            t_persons!inner (
              ci,
              first_name,
              last_name
            )
          ),
          t_institution (
            INSTITUTION_NAME
          ),
          t_professional_practices_tutor (
            t_tutors (
              t_persons!inner (
                first_name,
                phone,
                email
              )
            )
          )
        `)
        .limit(limit);

      if (periodId) {
        query = query.eq('PERIOD_ID', periodId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        success: true,
        data: {
          count: data?.length || 0,
          internships: data?.map(i => ({
            id: i.PROFESSIONAL_PRACTICE_ID,
            student: `${i.t_students?.t_persons?.first_name || ''} ${i.t_students?.t_persons?.last_name || ''}`.trim(),
            ci: i.t_students?.t_persons?.ci,
            institution: i.t_institution?.INSTITUTION_NAME,
            tutor: i.t_professional_practices_tutor?.[0]?.t_tutors?.t_persons?.first_name || '',
            status: i.STATUS,
          })),
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

/**
 * get_statistics - Obtiene estadísticas del sistema
 */
const getStatisticsTool = {
  name: 'get_statistics',
  description: 'Obtiene estadísticas generales del sistema: total de estudiantes, carreras, pasantías, tutores, etc. Use cuando el usuario pida estadísticas, métricas, resúmenes,诊断, etc.',
  parameters: {
    type: 'object',
    properties: {},
    required: [],
  },
  handler: async (): Promise<ToolResult> => {
    try {
      // Ejecutar múltiples queries en paralelo
      const [studentsRes, careersRes, internshipsRes, tutorsRes, institutionsRes, usersRes] =
        await Promise.all([
          supabase.from('t_students').select('id', { count: 'exact', head: true }),
          supabase.from('t_career').select('id', { count: 'exact', head: true }),
          supabase.from('t_internships_period').select('id', { count: 'exact', head: true }),
          supabase.from('t_tutors').select('id', { count: 'exact', head: true }),
          supabase.from('t_institution').select('id', { count: 'exact', head: true }),
          supabase.from('t_user').select('id', { count: 'exact', head: true }),
        ]);

      return {
        success: true,
        data: {
          students: studentsRes.count || 0,
          careers: careersRes.count || 0,
          internships: internshipsRes.count || 0,
          tutors: tutorsRes.count || 0,
          institutions: institutionsRes.count || 0,
          users: usersRes.count || 0,
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

/**
 * get_tutors - Obtiene tutores académicos
 */
const getTutorsTool = {
  name: 'get_tutors',
  description: 'Obtiene la lista de tutores académicos. Use cuando el usuario pregunte por tutores, cuántos hay, liste tutores, etc.',
  parameters: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Límite de resultados (default: 10)',
      },
    },
    required: [],
  },
  handler: async (args: Record<string, unknown>): Promise<ToolResult> => {
    try {
      const limit = (args.limit as number) || 10;

      const { data, error } = await supabase
        .from('t_tutors')
        .select('*, t_career(name)')
        .limit(limit);

      if (error) throw error;

      return {
        success: true,
        data: {
          count: data?.length || 0,
          tutors: data?.map(t => ({
            ci: t.ci,
            name: t.name,
            surname: t.surname,
            phone: t.phone,
            email: t.email,
            career: t.t_career?.name,
          })),
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

/**
 * get_institutions - Obtiene instituciones
 */
const getInstitutionsTool = {
  name: 'get_institutions',
  description: 'Obtiene las instituciones externas asociadas. Use cuando el usuario pregunte por empresas, instituciones, organizaciones, etc.',
  parameters: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Límite de resultados (default: 10)',
      },
    },
    required: [],
  },
  handler: async (args: Record<string, unknown>): Promise<ToolResult> => {
    try {
      const limit = (args.limit as number) || 10;

      const { data, error } = await supabase
        .from('t_institution')
        .select('*')
        .limit(limit);

      if (error) throw error;

      return {
        success: true,
        data: {
          count: data?.length || 0,
          institutions: data?.map(i => ({
            name: i.name,
            rif: i.rif,
            phone: i.phone,
            email: i.email,
            address: i.address,
          })),
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

/**
 * get_periods - Obtiene períodos académicos
 */
const getPeriodsTool = {
  name: 'get_periods',
  description: 'Obtiene los períodos académicos disponibles. Use cuando el usuario pregunte por períodos, lapsos, semestres, etc.',
  parameters: {
    type: 'object',
    properties: {
      active_only: {
        type: 'boolean',
        description: 'Solo mostrar activos (default: true)',
      },
    },
    required: [],
  },
  handler: async (args: Record<string, unknown>): Promise<ToolResult> => {
    try {
      const activeOnly = args.active_only !== false;

      let query = supabase.from('t_periods').select('*').order('start_date', { ascending: false });

      if (activeOnly) {
        const now = new Date().toISOString();
        query = query.lte('start_date', now).gte('end_date', now);
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        success: true,
        data: {
          count: data?.length || 0,
          periods: data?.map(p => ({
            id: p.id,
            name: p.name,
            start_date: p.start_date,
            end_date: p.end_date,
            status: p.status ? 'Activo' : 'Inactivo',
          })),
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

// ============================================
// Tool Registration
// ============================================

/**
 * Inicializa todas las herramientas disponibles
 */
export const initializeAITools = (): void => {
  console.log('[AI Tools] Initializing tools...');

  // Registrar cada herramienta
  registerTool(getStudentsTool);
  registerTool(getCareersTool);
  registerTool(getInternshipsTool);
  registerTool(getStatisticsTool);
  registerTool(getTutorsTool);
  registerTool(getInstitutionsTool);
  registerTool(getPeriodsTool);

  console.log('[AI Tools] All tools registered successfully');
};

// ============================================
// Export tools for provider
// ============================================

/**
 * Obtiene las herramientas en formato para Groq
 */
export const getAvailableTools = (): AITool[] => {
  return getToolsForProvider();
};

/**
 * Ejecuta una herramienta por nombre
 */
export const executeAITool = async (
  toolName: string,
  args: Record<string, unknown>
): Promise<ToolResult> => {
  try {
    const result = await import('./ai-provider.factory.js').then(m =>
      m.executeTool(toolName, args)
    );
    return result as ToolResult;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};