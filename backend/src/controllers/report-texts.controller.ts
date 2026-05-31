import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager.js';

export const getAllTexts = async (_req: Request, res: Response) => {
  try {
    const supabase = dbManager.getConnection();
    const { data, error } = await supabase
      .from('t_report_text_templates')
      .select('*')
      .eq('STATUS', 1)
      .order('REPORT_TYPE')
      .order('SECTION');

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('[report-texts] getAllTexts error:', error);
    res.status(500).json({ success: false, message: 'Error al obtener textos' });
  }
};

export const getTextByTypeAndSection = async (req: Request, res: Response) => {
  try {
    const supabase = dbManager.getConnection();
    const { reportType, section } = req.params;

    const { data, error } = await supabase
      .from('t_report_text_templates')
      .select('CONTENT_TEMPLATE')
      .eq('REPORT_TYPE', reportType)
      .eq('SECTION', section)
      .eq('STATUS', 1)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, message: 'Texto no encontrado' });
    }

    res.json({ success: true, contentTemplate: data.CONTENT_TEMPLATE });
  } catch (error) {
    console.error('[report-texts] getTextByTypeAndSection error:', error);
    res.status(500).json({ success: false, message: 'Error al obtener texto' });
  }
};

export const updateText = async (req: Request, res: Response) => {
  try {
    const supabase = dbManager.getConnection();
    const { reportType, section } = req.params;
    const { contentTemplate } = req.body;

    if (!contentTemplate) {
      return res.status(400).json({ success: false, message: 'contentTemplate es requerido' });
    }

    const { data, error } = await supabase
      .from('t_report_text_templates')
      .update({
        CONTENT_TEMPLATE: contentTemplate,
        UPDATED_AT: new Date().toISOString(),
        UPDATED_BY: (req as any).user?.id || null,
      })
      .eq('REPORT_TYPE', reportType)
      .eq('SECTION', section)
      .select()
      .single();

    if (error) {
      return res.status(404).json({ success: false, message: 'Texto no encontrado' });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('[report-texts] updateText error:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar texto' });
  }
};

export const createText = async (req: Request, res: Response) => {
  try {
    const supabase = dbManager.getConnection();
    const { reportType, section, contentTemplate } = req.body;

    if (!reportType || !section || !contentTemplate) {
      return res.status(400).json({
        success: false,
        message: 'reportType, section y contentTemplate son requeridos'
      });
    }

    const { data, error } = await supabase
      .from('t_report_text_templates')
      .insert({
        REPORT_TYPE: reportType,
        SECTION: section,
        CONTENT_TEMPLATE: contentTemplate,
        UPDATED_BY: (req as any).user?.id || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          message: 'Ya existe un texto para este tipo de reporte y sección'
        });
      }
      throw error;
    }

    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('[report-texts] createText error:', error);
    res.status(500).json({ success: false, message: 'Error al crear texto' });
  }
};
