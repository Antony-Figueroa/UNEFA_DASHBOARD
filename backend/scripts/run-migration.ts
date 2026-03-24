/**
 * Script para aplicar la migración de nullable columns
 * Uso: npx tsx scripts/run-migration.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://rgvnwslyvixviypgegra.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function runMigration() {
  console.log('🔄 Conectando a Supabase...');
  console.log('URL:', supabaseUrl);
  
  if (!supabaseKey) {
    console.error('❌ No se encontró SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Verificar conexión
  const { error: testError } = await supabase.from('t_professional_practices').select('count');
  if (testError) {
    console.error('❌ Error de conexión:', testError.message);
    process.exit(1);
  }
  console.log('✅ Conexión exitosa');

  // Aplicar ALTER TABLE para INSTITUTION_ID
  console.log('\n🔧 Modificando INSTITUTION_ID...');
  const { error: instError } = await supabase.rpc('exec', { 
    query: 'ALTER TABLE "t_professional_practices" ALTER COLUMN "INSTITUTION_ID" DROP NOT NULL;'
  }).catch(() => null);

  // Intentar con SQL directo via RPC opg
  const { error: alterInstError } = await supabase.rpc('pgmlrpc', {
    command: 'ALTER TABLE "t_professional_practices" ALTER COLUMN "INSTITUTION_ID" DROP NOT NULL;'
  }).catch(() => null);

  // Alternativa: verificar si ya es nullable
  const { data: columnInfo } = await supabase
    .from('information_schema.columns')
    .select('column_name, is_nullable')
    .eq('table_name', 't_professional_practices')
    .eq('column_name', 'INSTITUTION_ID')
    .single();

  console.log('INSTITUTION_ID nullable:', columnInfo?.is_nullable === 'YES' ? '✅ Ya es nullable' : '⚠️ Revisar manualmente');

  // Verificar MANAGER_ID
  const { data: managerInfo } = await supabase
    .from('information_schema.columns')
    .select('column_name, is_nullable')
    .eq('table_name', 't_professional_practices')
    .eq('column_name', 'MANAGER_ID')
    .single();

  console.log('MANAGER_ID nullable:', managerInfo?.is_nullable === 'YES' ? '✅ Ya es nullable' : '⚠️ Revisar manualmente');

  if (columnInfo?.is_nullable === 'YES' && managerInfo?.is_nullable === 'YES') {
    console.log('\n✅ Migración ya aplicada o no necesaria');
  } else {
    console.log('\n⚠️ Es necesario aplicar la migración manualmente en Supabase Dashboard:');
    console.log('   ALTER TABLE "t_professional_practices" ALTER COLUMN "INSTITUTION_ID" DROP NOT NULL;');
    console.log('   ALTER TABLE "t_professional_practices" ALTER COLUMN "MANAGER_ID" DROP NOT NULL;');
  }
}

runMigration();
