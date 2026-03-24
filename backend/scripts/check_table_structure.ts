import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan credenciales de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableStructure() {
  console.log('🔍 Consultando estructura de tabla t_tutors...\n');

  try {
    // Consulta SQL simple para obtener columnas
    const sql = `
      SELECT 
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 't_tutors'
      ORDER BY ordinal_position
    `;
    
    // Ejecutar sin punto y coma
    const { data, error } = await supabase.rpc('execute_sql', { sql });
    
    if (error) {
      console.error('❌ Error al ejecutar SQL:', error.message);
      
      // Intentar una consulta más simple
      console.log('\nIntentando consulta más simple...');
      const simpleSql = `SELECT column_name FROM information_schema.columns WHERE table_name = 't_tutors'`;
      const { data: simpleData, error: simpleError } = await supabase.rpc('execute_sql', { sql: simpleSql });
      
      if (simpleError) {
        console.error('❌ Error en consulta simple:', simpleError.message);
        return;
      }
      
      if (simpleData) {
        console.log('   Columnas en t_tutors:');
        const columns = Array.isArray(simpleData) ? simpleData : [simpleData];
        columns.forEach((row: any) => {
          console.log(`   - ${row.column_name}`);
        });
      }
      return;
    }
    
    if (data) {
      console.log('✅ Estructura de t_tutors:');
      const rows = Array.isArray(data) ? data : [data];
      rows.forEach((row: any) => {
        const type = row.data_type === 'character varying' 
          ? `varchar(${row.character_maximum_length})` 
          : row.data_type;
        const nullable = row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = row.column_default ? `DEFAULT ${row.column_default}` : '';
        console.log(`   ${row.column_name}: ${type} ${nullable} ${defaultVal}`);
      });
      
      // Buscar columna TITULO
      const tituloCol = rows.find((col: any) => col.column_name === 'TITULO');
      if (tituloCol) {
        console.log('\n✅ Columna TITULO encontrada:');
        console.log(`   Tipo: ${tituloCol.data_type}`);
        console.log(`   Longitud: ${tituloCol.character_maximum_length}`);
        console.log(`   Nullable: ${tituloCol.is_nullable}`);
        console.log(`   Default: ${tituloCol.column_default}`);
        
        // Verificar si coincide con lo esperado
        const expectedType = 'character varying';
        const expectedLength = 50;
        
        if (tituloCol.data_type === expectedType && tituloCol.character_maximum_length === expectedLength) {
          console.log('✅ La columna tiene el tipo correcto: varchar(50)');
        } else {
          console.log(`⚠️  La columna tiene tipo diferente: ${tituloCol.data_type}(${tituloCol.character_maximum_length}), se esperaba varchar(${expectedLength})`);
        }
        
        if (tituloCol.is_nullable === 'YES') {
          console.log('✅ La columna permite valores NULL');
        } else {
          console.log('⚠️  La columna NO permite valores NULL (se esperaba que sí)');
        }
      } else {
        console.log('\n❌ Columna TITULO NO encontrada en la tabla');
        console.log('   Esto significa que la columna no existe en la base de datos.');
      }
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

checkTableStructure().then(() => {
  console.log('\n👋 Script finalizado');
  process.exit(0);
});