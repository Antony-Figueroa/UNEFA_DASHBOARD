/**
 * @file email-templates.service.ts
 * @description CRUD de plantillas de email editables, almacenadas en t_email_templates.
 * Si la tabla está vacía, siembra las 4 plantillas por defecto al iniciar.
 */

import { supabase } from '../lib/supabase.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EmailTemplate {
  id: number;
  name: string;
  description: string | null;
  category: string;
  subject: string;
  body_html: string;
  created_at: string;
  updated_at: string;
}

export type CreateEmailTemplate = Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'>;
export type UpdateEmailTemplate = Partial<CreateEmailTemplate>;

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const SEED_TEMPLATES: CreateEmailTemplate[] = [
  {
    name: 'Inicio de Lapso Académico',
    description: 'Notificar a estudiantes sobre el inicio de un nuevo período académico',
    category: 'periodo',
    subject: '📢 Inicio de lapso {{periodo}}',
    body_html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: #1e40af; padding: 20px; text-align: center; color: white;">
      <h1 style="margin: 0;">SIGP UNEFA</h1>
    </div>
    <div style="padding: 24px; color: #1e293b;">
      <h2>¡Bienvenido al {{periodo}}, {{nombre}}!</h2>
      <p>Informamos que el lapso académico <strong>{{periodo}}</strong> ha dado inicio el día <strong>{{fecha_inicio}}</strong>.</p>
      <p>Te recordamos mantener tus datos al día y revisar las actividades programadas para este período.</p>
      <hr style="border-top: 1px solid #e2e8f0;">
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">SIGP UNEFA — Sistema de Gestión de Personal</p>
    </div>
  </div>`,
  },
  {
    name: 'Fin de Lapso Académico',
    description: 'Notificar a estudiantes sobre el cierre del período académico',
    category: 'periodo',
    subject: '⏰ Cierre de lapso {{periodo}}',
    body_html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: #1e40af; padding: 20px; text-align: center; color: white;">
      <h1 style="margin: 0;">SIGP UNEFA</h1>
    </div>
    <div style="padding: 24px; color: #1e293b;">
      <h2>Cierre del {{periodo}}</h2>
      <p>Hola {{nombre}},</p>
      <p>Te informamos que el lapso académico <strong>{{periodo}}</strong> finaliza el <strong>{{fecha_fin}}</strong>.</p>
      <p>Asegurate de tener toda tu documentación al día antes del cierre.</p>
      <hr style="border-top: 1px solid #e2e8f0;">
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">SIGP UNEFA — Sistema de Gestión de Personal</p>
    </div>
  </div>`,
  },
  {
    name: 'Reporte de Evaluación',
    description: 'Notificar a tutores sobre reportes de evaluación disponibles',
    category: 'evaluacion',
    subject: '📋 Reporte de evaluación disponible',
    body_html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: #1e40af; padding: 20px; text-align: center; color: white;">
      <h1 style="margin: 0;">SIGP UNEFA</h1>
    </div>
    <div style="padding: 24px; color: #1e293b;">
      <h2>Reporte de Evaluación</h2>
      <p>Hola {{nombre}},</p>
      <p>Tenés disponible el reporte de evaluación del período <strong>{{periodo}}</strong>.</p>
      <p>Ingresá al sistema para revisar los resultados y completar las evaluaciones pendientes de tus estudiantes asignados.</p>
      <hr style="border-top: 1px solid #e2e8f0;">
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">SIGP UNEFA — Sistema de Gestión de Personal</p>
    </div>
  </div>`,
  },
  {
    name: 'Aviso General',
    description: 'Plantilla genérica para comunicados institucionales',
    category: 'general',
    subject: '{{asunto}}',
    body_html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: #1e40af; padding: 20px; text-align: center; color: white;">
      <h1 style="margin: 0;">SIGP UNEFA</h1>
    </div>
    <div style="padding: 24px; color: #1e293b;">
      <h2>{{asunto}}</h2>
      <p>Hola {{nombre}},</p>
      <p>{{mensaje}}</p>
      <hr style="border-top: 1px solid #e2e8f0;">
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">SIGP UNEFA — Sistema de Gestión de Personal</p>
    </div>
  </div>`,
  },
];

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

const TABLE = 't_email_templates';

export const emailTemplatesService = {
  /** Retorna todas las plantillas ordenadas por categoría */
  async getAll(): Promise<EmailTemplate[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('[EmailTemplates] Error fetching templates:', error);
      throw error;
    }

    return data as EmailTemplate[];
  },

  /** Retorna una plantilla por ID */
  async getById(id: number): Promise<EmailTemplate | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('[EmailTemplates] Error fetching template:', error);
      throw error;
    }

    return data as EmailTemplate | null;
  },

  /** Crea una nueva plantilla */
  async create(input: CreateEmailTemplate): Promise<EmailTemplate> {
    const { data, error } = await supabase
      .from(TABLE)
      .insert({ ...input })
      .select()
      .single();

    if (error) {
      console.error('[EmailTemplates] Error creating template:', error);
      throw error;
    }

    return data as EmailTemplate;
  },

  /** Actualiza una plantilla existente */
  async update(id: number, input: UpdateEmailTemplate): Promise<EmailTemplate> {
    const { data, error } = await supabase
      .from(TABLE)
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[EmailTemplates] Error updating template:', error);
      throw error;
    }

    return data as EmailTemplate;
  },

  /** Elimina una plantilla */
  async remove(id: number): Promise<void> {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[EmailTemplates] Error deleting template:', error);
      throw error;
    }
  },

  /** Siembra las plantillas por defecto si la tabla está vacía */
  async seedIfEmpty(): Promise<void> {
    try {
      const { count, error } = await supabase
        .from(TABLE)
        .select('*', { count: 'exact', head: true });

      if (error) throw error;

      if (count === 0) {
        const { error: insertError } = await supabase
          .from(TABLE)
          .insert(SEED_TEMPLATES);

        if (insertError) throw insertError;
        console.log('[EmailTemplates] ✓ Seed templates inserted');
      }
    } catch (error) {
      console.error('[EmailTemplates] Error seeding templates:', error);
    }
  },
};
