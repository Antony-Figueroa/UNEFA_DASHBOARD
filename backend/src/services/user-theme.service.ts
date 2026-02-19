import { dbManager } from '../lib/db-manager.js';

export interface UserThemeDB {
  USER_THEME_ID: number;
  USER_ID: number;
  BRAND_COLOR: string;
  CREATION_DATE: string;
  MODIF_USER_ID: number;
  MODIF_USER_DATE: string;
  ELIM_USER_ID: number;
  ELIM_USER_DATE: string;
  REST_USER_ID: number;
  REST_USER_DATE: string;
  STATUS: number;
}

export interface UserTheme {
  brandColor: string;
}

export type BrandColorKey = 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'pink' | 'teal' | 'indigo';

export const VALID_BRAND_COLORS: BrandColorKey[] = [
  'blue',
  'green', 
  'purple',
  'orange',
  'red',
  'pink',
  'teal',
  'indigo'
];

export const isValidBrandColor = (color: string): color is BrandColorKey => {
  return VALID_BRAND_COLORS.includes(color as BrandColorKey);
};

export const getUserTheme = async (userId: number): Promise<UserTheme | null> => {
  const data = await dbManager.withRetry(async (supabase) => {
    const { data, error } = await supabase
      .from('t_user_theme')
      .select('*')
      .eq('USER_ID', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }, 'getUserTheme');

  if (!data) return null;

  const themeData = data as UserThemeDB;
  return {
    brandColor: themeData.BRAND_COLOR
  };
};

export const upsertUserTheme = async (userId: number, brandColor: string): Promise<UserTheme> => {
  if (!isValidBrandColor(brandColor)) {
    throw new Error(`Invalid brand color: ${brandColor}`);
  }

  const now = new Date().toISOString();

  const data = await dbManager.withRetry(async (supabase) => {
    const { data: existing } = await supabase
      .from('t_user_theme')
      .select('USER_THEME_ID')
      .eq('USER_ID', userId)
      .single();

    if (existing) {
      const { data, error } = await supabase
        .from('t_user_theme')
        .update({
          BRAND_COLOR: brandColor,
          MODIF_USER_ID: userId,
          MODIF_USER_DATE: now
        })
        .eq('USER_ID', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('t_user_theme')
        .insert([{
          USER_ID: userId,
          BRAND_COLOR: brandColor,
          CREATION_DATE: now,
          MODIF_USER_ID: userId,
          MODIF_USER_DATE: now,
          ELIM_USER_ID: 0,
          ELIM_USER_DATE: now,
          REST_USER_ID: 0,
          REST_USER_DATE: now,
          STATUS: 1
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  }, 'upsertUserTheme');

  const themeData = data as UserThemeDB;
  return {
    brandColor: themeData.BRAND_COLOR
  };
};
