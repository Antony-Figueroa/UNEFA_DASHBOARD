import { dbManager } from '../lib/db-manager.js';

export interface Manual {
  id: number;
  title: string;
  description: string;
  category: string;
  fileType: string;
  fileSize: string;
  fileUrl?: string;
  version: string;
  status: number;
  createdAt: string;
  updatedAt: string;
}

export const getManuals = async (category?: string, search?: string): Promise<Manual[]> => {
  const supabase = dbManager.getConnection();
  
  let query = supabase
    .from('t_manuals')
    .select('*')
    .eq('STATUS', 1)
    .order('CREATED_AT', { ascending: false });

  if (category) {
    query = query.eq('CATEGORY', category);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[ManualsService] Error getting manuals:', error);
    return [];
  }

  let manuals = (data || []).map((m: any) => ({
    id: m.MANUAL_ID,
    title: m.TITLE,
    description: m.DESCRIPTION,
    category: m.CATEGORY,
    fileType: m.FILE_TYPE,
    fileSize: m.FILE_SIZE,
    fileUrl: m.FILE_URL,
    version: m.VERSION,
    status: m.STATUS,
    createdAt: m.CREATED_AT,
    updatedAt: m.UPDATED_AT
  }));

  if (search) {
    const s = search.toLowerCase();
    manuals = manuals.filter(m => 
      m.title.toLowerCase().includes(s) ||
      m.description.toLowerCase().includes(s)
    );
  }

  return manuals;
};

export const getManualById = async (id: number): Promise<Manual | null> => {
  const supabase = dbManager.getConnection();
  
  const { data, error } = await supabase
    .from('t_manuals')
    .select('*')
    .eq('MANUAL_ID', id)
    .single();

  if (error) {
    console.error('[ManualsService] Error getting manual:', error);
    return null;
  }

  return {
    id: data.MANUAL_ID,
    title: data.TITLE,
    description: data.DESCRIPTION,
    category: data.CATEGORY,
    fileType: data.FILE_TYPE,
    fileSize: data.FILE_SIZE,
    fileUrl: data.FILE_URL,
    version: data.VERSION,
    status: data.STATUS,
    createdAt: data.CREATED_AT,
    updatedAt: data.UPDATED_AT
  };
};

export const createManual = async (manual: Omit<Manual, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Manual | null> => {
  const supabase = dbManager.getConnection();
  
  const { data, error } = await supabase
    .from('t_manuals')
    .insert({
      TITLE: manual.title,
      DESCRIPTION: manual.description,
      CATEGORY: manual.category,
      FILE_TYPE: manual.fileType,
      FILE_SIZE: manual.fileSize,
      FILE_URL: manual.fileUrl,
      VERSION: manual.version,
      STATUS: 1,
      CREATED_AT: new Date().toISOString(),
      UPDATED_AT: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('[ManualsService] Error creating manual:', error);
    return null;
  }

  return {
    id: data.MANUAL_ID,
    title: data.TITLE,
    description: data.DESCRIPTION,
    category: data.CATEGORY,
    fileType: data.FILE_TYPE,
    fileSize: data.FILE_SIZE,
    fileUrl: data.FILE_URL,
    version: data.VERSION,
    status: data.STATUS,
    createdAt: data.CREATED_AT,
    updatedAt: data.UPDATED_AT
  };
};

export const updateManual = async (id: number, updates: Partial<Manual>): Promise<Manual | null> => {
  const supabase = dbManager.getConnection();
  
  const dbUpdates: Record<string, any> = {
    UPDATED_AT: new Date().toISOString()
  };

  if (updates.title) dbUpdates.TITLE = updates.title;
  if (updates.description) dbUpdates.DESCRIPTION = updates.description;
  if (updates.category) dbUpdates.CATEGORY = updates.category;
  if (updates.fileType) dbUpdates.FILE_TYPE = updates.fileType;
  if (updates.fileSize) dbUpdates.FILE_SIZE = updates.fileSize;
  if (updates.fileUrl) dbUpdates.FILE_URL = updates.fileUrl;
  if (updates.version) dbUpdates.VERSION = updates.version;

  const { data, error } = await supabase
    .from('t_manuals')
    .update(dbUpdates)
    .eq('MANUAL_ID', id)
    .select()
    .single();

  if (error) {
    console.error('[ManualsService] Error updating manual:', error);
    return null;
  }

  return {
    id: data.MANUAL_ID,
    title: data.TITLE,
    description: data.DESCRIPTION,
    category: data.CATEGORY,
    fileType: data.FILE_TYPE,
    fileSize: data.FILE_SIZE,
    fileUrl: data.FILE_URL,
    version: data.VERSION,
    status: data.STATUS,
    createdAt: data.CREATED_AT,
    updatedAt: data.UPDATED_AT
  };
};

export const deleteManual = async (id: number): Promise<boolean> => {
  const supabase = dbManager.getConnection();
  
  const { error } = await supabase
    .from('t_manuals')
    .update({ STATUS: 0, UPDATED_AT: new Date().toISOString() })
    .eq('MANUAL_ID', id);

  if (error) {
    console.error('[ManualsService] Error deleting manual:', error);
    return false;
  }

  return true;
};

export const getCategories = async (): Promise<string[]> => {
  const supabase = dbManager.getConnection();
  
  const { data, error } = await supabase
    .from('t_manuals')
    .select('CATEGORY')
    .eq('STATUS', 1);

  if (error) {
    console.error('[ManualsService] Error getting categories:', error);
    return ['General', 'Inscripciones', 'Seguimiento', 'Reportes', 'Configuración', 'Videos'];
  }

  const categories = [...new Set((data || []).map((m: any) => m.CATEGORY))] as string[];
  return categories.length > 0 ? categories : ['General', 'Inscripciones', 'Seguimiento', 'Reportes', 'Configuración', 'Videos'];
};
