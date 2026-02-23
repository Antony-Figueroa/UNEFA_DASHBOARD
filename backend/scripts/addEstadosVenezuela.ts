import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const supabaseUrl = process.env.SUPABASE_URL || 'https://rgvnwslyvixviypgegra.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJndm53c2x5dml4dml5cGdlZ3JhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY0ODQ2NTIwMCwiZXhwIjoxOTY0MDQxNDAwfQ.W6BVBmJ5J-JG4K6o3uZ8f9yFyN2vX4hK8jL3mP1oR0s';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addEstadosVenezuelaList() {
  try {
    // 1. Verificar si la lista ya existe
    const { data: existingList } = await supabase
      .from('t_list')
      .select('*')
      .eq('NAME', 'ESTADOS_VENEZUELA')
      .single();

    let listId;

    if (existingList) {
      console.log('La lista ESTADOS_VENEZUELA ya existe, ID:', existingList.LIST_ID);
      listId = existingList.LIST_ID;
      
      // Limpiar valores existentes
      await supabase
        .from('t_value_list')
        .delete()
        .eq('LIST_ID', listId);
      console.log('Valores existentes eliminados');
    } else {
      // 2. Crear la lista
      const now = new Date().toISOString();
      const { data: newList, error: listError } = await supabase
        .from('t_list')
        .insert({ 
          NAME: 'ESTADOS_VENEZUELA', 
          STATUS: 1,
          CREATION_DATE: now,
          MODIF_USER_ID: 0,
          MODIF_USER_DATE: now,
          ELIM_USER_ID: 0,
          ELIM_USER_DATE: now,
          REST_USER_ID: 0,
          REST_USER_DATE: now
        })
        .select()
        .single();
      
      if (listError) throw listError;
      listId = newList.LIST_ID;
      console.log('Lista creada con ID:', listId);
    }

    // 3. Insertar valores (solo Portuguesa por defecto)
    const now = new Date().toISOString();
    const estados = [
      { name: 'Portuguesa', abbreviation: 'PORTUGUE', status: true }
    ];

    const valuesToInsert = estados.map(e => ({
      LIST_ID: listId,
      NAME: e.name,
      ABBREVIATION: e.abbreviation,
      STATUS: e.status ? 1 : 0,
      CREATION_DATE: now,
      MODIF_USER_ID: 0,
      MODIF_USER_DATE: now,
      ELIM_USER_ID: 0,
      ELIM_USER_DATE: now,
      REST_USER_ID: 0,
      REST_USER_DATE: now
    }));

    const { error: valuesError } = await supabase
      .from('t_value_list')
      .insert(valuesToInsert);

    if (valuesError) throw valuesError;

    console.log('Valores insertados correctamente');
    console.log('Estados habilitados:', estados.map(e => e.name).join(', '));

  } catch (error) {
    console.error('Error:', error);
  }
}

addEstadosVenezuelaList();
