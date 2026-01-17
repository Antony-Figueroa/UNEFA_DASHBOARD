import fs from 'fs';
import path from 'path';

/**
 * Script de prueba para verificar que el archivo .env es de solo lectura.
 * Este script intenta escribir en el archivo .env y espera un error.
 */

const envPath = path.join(process.cwd(), '.env');

console.log(`🔍 Probando integridad de .env en: ${envPath}`);

try {
    if (!fs.existsSync(envPath)) {
        console.error('❌ Error: El archivo .env no existe en el contenedor.');
        process.exit(1);
    }

    // Intentar añadir una línea al archivo
    fs.appendFileSync(envPath, '\n# Intento de escritura maliciosa');
    
    console.error('🚨 FALLO DE SEGURIDAD: Se pudo escribir en el archivo .env!');
    process.exit(1);
} catch (error: any) {
    if (error.code === 'EROFS' || error.code === 'EACCES' || error.message.includes('read-only')) {
        console.log('✅ ÉXITO: El sistema de archivos es de solo lectura como se esperaba.');
        process.exit(0);
    } else {
        console.error(`❌ Error inesperado: ${error.message}`);
        process.exit(1);
    }
}
