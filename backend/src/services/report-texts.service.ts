import { dbManager } from '../lib/db-manager.js';

export interface TextTemplate {
  templateId: number;
  reportType: string;
  section: string;
  contentTemplate: string;
  updatedBy: number | null;
  updatedAt: string;
  status: number;
}

export async function getText(reportType: string, section: string): Promise<TextTemplate | null> {
  try {
    const supabase = dbManager.getConnection();
    const { data } = await supabase
      .from('t_report_text_templates')
      .select('*')
      .eq('REPORT_TYPE', reportType)
      .eq('SECTION', section)
      .eq('STATUS', 1)
      .single();
    return data;
  } catch {
    return null;
  }
}

export async function getAllTexts(): Promise<TextTemplate[]> {
  try {
    const supabase = dbManager.getConnection();
    const { data } = await supabase
      .from('t_report_text_templates')
      .select('*')
      .eq('STATUS', 1)
      .order('REPORT_TYPE')
      .order('SECTION');
    return data || [];
  } catch {
    return [];
  }
}

export async function upsertText(
  reportType: string,
  section: string,
  contentTemplate: string,
  userId?: number
): Promise<TextTemplate | null> {
  try {
    const supabase = dbManager.getConnection();
    const { data } = await supabase
      .from('t_report_text_templates')
      .upsert({
        REPORT_TYPE: reportType,
        SECTION: section,
        CONTENT_TEMPLATE: contentTemplate,
        UPDATED_BY: userId || null,
        UPDATED_AT: new Date().toISOString(),
      }, {
        onConflict: 'REPORT_TYPE, SECTION',
      })
      .select()
      .single();
    return data;
  } catch {
    return null;
  }
}
