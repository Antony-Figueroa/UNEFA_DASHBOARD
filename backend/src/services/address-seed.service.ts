import { supabase } from '../lib/supabase.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ParroquiaItem {
  municipio: string;
  capital: string;
  parroquias: string[];
}

interface EstadoItem {
  iso_31662: string;
  estado: string;
  capital: string;
  id_estado: number;
  municipios: ParroquiaItem[];
}

export async function seedGeographicData(): Promise<void> {
  try {
    const { count, error } = await supabase
      .from('t_estado')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.warn('[Address Seed] t_estado not available:', error.message);
      return;
    }

    if (count && count > 0) {
      console.log(`[Address Seed] Geographic data already seeded (${count} estados), skipping`);
      return;
    }

    const paths = [
      path.resolve(__dirname, '../src/data/venezuela.json'),
      path.resolve(__dirname, '../../src/data/venezuela.json'),
      path.resolve(__dirname, '../../../src/data/venezuela.json'),
    ];

    let raw: string;
    const foundPath = paths.find(p => fs.existsSync(p));
    if (foundPath) {
      raw = fs.readFileSync(foundPath, 'utf-8');
    } else {
      console.warn('[Address Seed] venezuela.json not found, skipping seed');
      return;
    }

    const data: EstadoItem[] = JSON.parse(raw);

    for (const estado of data) {
      const { error: eError } = await supabase
        .from('t_estado')
        .insert({
          estado_id: estado.id_estado,
          iso_31662: estado.iso_31662,
          name: estado.estado,
          capital: estado.capital,
        });

      if (eError) {
        console.warn(`[Address Seed] Error inserting estado ${estado.estado}:`, eError.message);
        continue;
      }

      for (const municipio of estado.municipios) {
        const { data: mData, error: mError } = await supabase
          .from('t_municipio')
          .insert({
            estado_id: estado.id_estado,
            name: municipio.municipio,
          })
          .select('municipio_id')
          .single();

        if (mError || !mData) {
          console.warn(`[Address Seed] Error inserting municipio ${municipio.municipio}:`, mError?.message);
          continue;
        }

        const parroquias = municipio.parroquias.map((p: string) => ({
          municipio_id: mData.municipio_id,
          name: p,
        }));

        if (parroquias.length > 0) {
          const { error: pError } = await supabase
            .from('t_parroquia')
            .insert(parroquias);

          if (pError) {
            console.warn(`[Address Seed] Error inserting parroquias for ${municipio.municipio}:`, pError.message);
          }
        }
      }
    }

    console.log(`[Address Seed] Geographic data seeded: ${data.length} estados`);
  } catch (error: any) {
    console.error('[Address Seed] Fatal error:', error.message);
  }
}
