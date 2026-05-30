import { PGlite } from '@electric-sql/pglite';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const pglite = new PGlite({ dataDir: path.join(__dirname, 'data', 'pglite') });

  // 1. Generar hash para admin123
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('admin123', salt);
  console.log('Generated hash for admin123:', hash);

  // 2. Verificar que funciona
  const test = await bcrypt.compare('admin123', hash);
  console.log('Verification test:', test ? 'PASS ✅' : 'FAIL ❌');

  // 3. Actualizar la clave del usuario 1 (V00000000)
  const result = await pglite.query(
    'UPDATE "t_user_key" SET "KEY" = $1 WHERE "USER_ID" = $2 AND "STATUS" = 1',
    [hash, 1]
  );
  console.log('Update result:', result.affectedRows, 'rows');
  
  // 4. Verificar
  const verify = await pglite.query(
    'SELECT "USER_ID", "KEY" FROM "t_user_key" WHERE "USER_ID" = $1 AND "STATUS" = 1',
    [1]
  );
  if (verify.rows.length > 0) {
    const storedHash = verify.rows[0].KEY;
    const check = await bcrypt.compare('admin123', storedHash);
    console.log('Stored hash check:', check ? 'MATCH ✅' : 'NO MATCH ❌');
  }

  await pglite.close();
}

main().catch(console.error);
