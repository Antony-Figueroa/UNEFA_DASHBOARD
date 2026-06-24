import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const serviceRole = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk1Nn0.***REMOVED***';

const supabase = createClient(supabaseUrl, serviceRole);

const statements = [
  `ALTER TABLE t_user_roles ADD CONSTRAINT fk_user_roles_user FOREIGN KEY ("ID_USER") REFERENCES t_user("USER_ID")`,
  `ALTER TABLE t_user_roles ADD CONSTRAINT fk_user_roles_role FOREIGN KEY ("ID_ROLES") REFERENCES t_roles("ID_ROLS")`,
  `ALTER TABLE t_user_key ADD CONSTRAINT fk_user_key_user FOREIGN KEY ("USER_ID") REFERENCES t_user("USER_ID")`,
  `SELECT setval('t_auth_log_id_seq', COALESCE((SELECT MAX("ID") FROM t_auth_log), 0) + 1, false)`,
  `SELECT setval('t_users_user_id_seq', COALESCE((SELECT MAX("USER_ID") FROM t_user), 11), false)`,
  `SELECT setval('t_user_key_user_key_id_seq', COALESCE((SELECT MAX("USER_KEY_ID") FROM t_user_key), 15), false)`,
];

for (const sql of statements) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    if (error) {
      // Try raw query
      console.log(`Statement: ${sql.substring(0, 60)}...`);
      console.log(`RPC error: ${error.message}`);
      // Fall back to supabase db query via child_process
      const { execSync } = await import('child_process');
      const result = execSync(`echo "${sql.replace(/"/g, '\\"')}" | supabase db query 2>&1`, { 
        encoding: 'utf-8', 
        shell: 'powershell',
        timeout: 10000 
      });
      console.log(`Result: ${result.substring(0, 100)}`);
    } else {
      console.log(`OK: ${sql.substring(0, 60)}...`);
    }
  } catch (e) {
    console.log(`Error: ${sql.substring(0, 60)}... → ${e.message?.substring(0,100) || e}`);
  }
}
