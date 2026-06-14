#!/usr/bin/env node
/**
 * apply-migration.js
 *
 * Applies migration SQL to a Supabase project.
 *
 * Option 1: Direct (requires exec_sql RPC - not available on fresh projects):
 *   TARGET_SERVICE_ROLE_KEY=<key> node scripts/apply-migration.js
 *
 * Option 2: Supabase Management API (requires personal access token):
 *   SUPABASE_PAT=<pat> node scripts/apply-migration.js --pat
 *
 * Option 3: Print to console for manual paste in Supabase Dashboard SQL Editor:
 *   node scripts/apply-migration.js --print
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const PROJECT_REF = 'kajmugaibkmaibgofipc';
const DEFAULT_FILE = 'backend/src/migrations/014_seed_transfer.sql';

const parseArgs = () => {
  const args = process.argv.slice(2);
  return {
    pat: args.includes('--pat'),
    print: args.includes('--print'),
    file: args.find(a => a.startsWith('--file='))?.split('=')[1] || DEFAULT_FILE,
  };
};

const readSql = (file) => {
  const sqlPath = path.resolve(file);
  if (!fs.existsSync(sqlPath)) {
    console.error(`File not found: ${sqlPath}`);
    process.exit(1);
  }
  return fs.readFileSync(sqlPath, 'utf8');
};

const printUsage = (sql) => {
  console.log('=' .repeat(70));
  console.log('STEP 1: Open your Supabase Dashboard');
  console.log(`URL: https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new`);
  console.log('=' .repeat(70));
  console.log('');
  console.log('STEP 2: Copy the SQL below and paste it into the SQL Editor');
  console.log('STEP 3: Click "Run" to execute the migration');
  console.log('');
  console.log('=' .repeat(70));
  console.log('MIGRATION SQL:');
  console.log('=' .repeat(70));
  console.log(sql);
};

const applyViaManagementApi = async (sql, pat) => {
  console.log(`Applying migration to project ${PROJECT_REF} via Management API...`);

  const body = JSON.stringify({ query: sql });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.supabase.com',
      path: `/v1/projects/${PROJECT_REF}/database/query`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pat}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log('Migration applied successfully!');
          resolve();
        } else {
          console.error(`API Error (${res.statusCode}):`, data);
          reject(new Error(`API returned ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
};

const main = async () => {
  const { pat, print, file } = parseArgs();
  const sql = readSql(file);

  if (print) {
    printUsage(sql);
    return;
  }

  if (pat) {
    const token = process.env.SUPABASE_PAT;
    if (!token) {
      console.error('SUPABASE_PAT environment variable is required with --pat flag');
      console.error('Get your PAT from: https://supabase.com/dashboard/account/tokens');
      process.exit(1);
    }
    await applyViaManagementApi(sql, token);
    return;
  }

  // Default: print usage instructions
  printUsage(sql);
};

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
