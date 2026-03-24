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

async function verifyTituloColumn() {
  console.log('🔍 Verificando columna TITULO en tabla t_tutors...\n');

  try {
    // 1. Intentar seleccionar la columna para ver si existe
    console.log('1. Verificando existencia de columna TITULO...');
    const { error: checkError } = await supabase
      .from('t_tutors')
      .select('TITULO')
      .limit(1);

    if (checkError) {
      if (checkError.message.includes('column') && checkError.message.includes('does not exist')) {
        console.log('❌ Columna TITULO NO existe en la tabla');
        console.log('   Mensaje de error:', checkError.message);
        
        // Intentar agregar la columna
        console.log('\n2. Intentando agregar columna TITULO...');
        const sql = 'ALTER TABLE "t_tutors" ADD COLUMN IF NOT EXISTS "TITULO" varchar(50) DEFAULT NULL;';
        
        const { error: alterError } = await supabase.rpc('execute_sql', { sql });

        if (alterError) {
          console.error('❌ Error al ejecutar SQL:', alterError.message);
          console.log('\n📝 Ejecuta este SQL manualmente en Supabase Dashboard > SQL Editor:\n');
          console.log('--'.repeat(30));
          console.log(sql);
          console.log('--'.repeat(30));
          return;
        }
        
        console.log('✅ SQL ejecutado exitosamente');
        
        // Verificar nuevamente
        const { error: recheckError } = await supabase
          .from('t_tutors')
          .select('TITULO')
          .limit(1);
        
        if (recheckError) {
          console.log('⚠️  La columna aún no es accesible:', recheckError.message);
        } else {
          console.log('✅ Columna TITULO creada y verificada');
        }
        
        return;
      } else {
        console.log('⚠️  Error diferente al verificar columna:', checkError.message);
        return;
      }
    }

    console.log('✅ Columna TITULO existe y es accesible');
    
    // 2. Verificar información detallada de la columna usando SQL
    console.log('\n2. Obteniendo información detallada de la columna...');
    
    // Consulta SQL para obtener detalles de la columna
    const sql = `
      SELECT 
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 't_tutors' 
        AND column_name = 'TITULO';
    `;
    
    const { data: columnInfo, error: infoError } = await supabase.rpc('execute_sql', { sql: `SELECT * FROM (${sql}) as col_info` });
    
    if (infoError) {
      console.log('⚠️  No se pudo obtener información detallada:', infoError.message);
      console.log('   Intentando consulta alternativa...');
      
      // Intentar una consulta más simple
      const simpleSql = `
        SELECT 
          column_name,
          data_type,
          is_nullable
        FROM information_schema.columns 
        WHERE table_name = 't_tutors';
      `;
      
      const { data: allColumns, error: simpleError } = await supabase.rpc('execute_sql', { sql: `SELECT * FROM (${simpleSql}) as all_cols` });
      
      if (simpleError) {
        console.log('   No se pudo obtener lista de columnas:', simpleError.message);
      } else if (allColumns) {
        console.log('   Columnas en t_tutors:');
        // El resultado viene como un array de objetos
        const columns = Array.isArray(allColumns) ? allColumns : [allColumns];
        columns.forEach((row: any) => {
          console.log(`   - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'YES' ? '(NULLABLE)' : '(NOT NULL)'}`);
        });
      }
    } else if (columnInfo) {
      console.log('   Información de columna TITULO:');
      const info = Array.isArray(columnInfo) ? columnInfo[0] : columnInfo;
      console.log(`   - Nombre: ${info.column_name}`);
      console.log(`   - Tipo: ${info.data_type}`);
      console.log(`   - Longitud máxima: ${info.character_maximum_length || 'Sin límite'}`);
      console.log(`   - Nullable: ${info.is_nullable}`);
      console.log(`   - Default: ${info.column_default || 'Sin default'}`);
      
      // Verificar que coincida con lo esperado
      const expectedType = 'character varying';
      const expectedLength = 50;
      
      if (info.data_type === expectedType && info.character_maximum_length === expectedLength) {
        console.log('✅ La columna tiene el tipo correcto: varchar(50)');
      } else {
        console.log(`⚠️  La columna tiene tipo diferente: ${info.data_type}(${info.character_maximum_length}), se esperaba varchar(${expectedLength})`);
      }
      
      if (info.is_nullable === 'YES') {
        console.log('✅ La columna permite valores NULL');
      } else {
        console.log('⚠️  La columna NO permite valores NULL (se esperaba que sí)');
      }
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

verifyTituloColumn().then(() => {
  console.log('\n👋 Script finalizado');
  process.exit(0);
});