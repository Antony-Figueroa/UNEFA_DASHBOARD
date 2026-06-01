import { spawn } from 'child_process';
import { request } from 'http';

const BACKEND_DIR = 'C:\\Users\\Server Admin\\Documents\\GitHub\\UNEFA_DASHBOARD\\backend';
let cookie = '';

function http(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, 'http://localhost:3001');
    const opts = {
      hostname: url.hostname, port: url.port,
      path: url.pathname + url.search, method,
      headers: { 'Connection': 'close' },
    };
    if (body) { opts.headers['Content-Type'] = 'application/json'; opts.headers['Content-Length'] = Buffer.byteLength(body); }
    if (cookie) opts.headers['Cookie'] = cookie;
    const req = request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        const sc = res.headers['set-cookie'];
        if (sc) sc.forEach(c => { const p = c.split(';')[0]; if (p) cookie = p; });
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data: data.substring(0, 100) }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => { req.destroy(); reject(Error('timeout')); });
    if (body) req.write(body); req.end();
  });
}

async function waitForServer(timeout = 130000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const r = await http('GET', '/api/health');
      if (r.status === 200 && r.data?.database?.mode === 'offline') return;
    } catch {}
    await new Promise(r => setTimeout(r, 2000));
  }
  throw Error('Server timeout');
}

async function main() {
  console.log('⏳ Iniciando servidor (sync ≈ 25s)...');
  const server = spawn('cmd', ['/c', 'npx tsx src/server-offline.ts'], {
    cwd: BACKEND_DIR,
    env: { ...process.env, USE_PGLITE: 'true', PGLITE_DATA_DIR: 'data/pglite' },
    stdio: ['ignore', 'inherit', 'inherit'],
  });

  server.on('exit', (code) => { if (code !== 0 && code !== null) console.error('❌ Server crash exit code:', code); });

  try {
    await waitForServer();
    console.log('✅ Server listo\n');

    // Login
    const login = await http('POST', '/api/auth/login', JSON.stringify({ userCi: 'V00000000', password: 'admin123' }));
    console.log(`1. LOGIN: ${login.status} ${login.data?.message}\n`);

    // Test all endpoints
    const endpoints = [
      '/api/periodos', '/api/careers', '/api/students?limit=3', '/api/tutors',
      '/api/institutions', '/api/enrollments', '/api/pre-enrollments', '/api/tracking',
      '/api/activity-logs', '/api/notifications', '/api/backups', '/api/dashboard/stats',
      '/api/auth/me', '/api/internship-types', '/api/lists', '/api/users',
      '/api/evaluations'
    ];

    let passed = 0, failed = 0;

    for (const ep of endpoints) {
      try {
        const r = await http('GET', ep);
        const count = Array.isArray(r.data) ? r.data.length : r.data?.data?.length || r.data?.length || '?';
        const msg = r.data?.message || r.data?.error || '';
        const ok = r.status === 200;
        console.log(`  ${ok ? '✅' : '❌'} ${ep}: ${r.status}${msg ? ' ' + msg.substring(0, 80) : ''} [${count}]`);
        if (ok) passed++; else failed++;
      } catch (e) {
        console.log(`  💥 ${ep}: ${e.message}`);
        failed++;
      }
    }

    console.log(`\n✅ ${passed} exitosos  ❌ ${failed} fallaron\n`);
    console.log(passed > 0 ? '✅ SERVIDOR OFFLINE FUNCIONAL' : '❌ FALLÓ');
  } finally {
    server.kill('SIGTERM');
    await new Promise(r => setTimeout(r, 3000));
  }
}

main();
