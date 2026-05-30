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
        catch { resolve({ status: res.statusCode, data }); }
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

  // Si el server muere antes de tiempo, error
  server.on('exit', (code) => { if (code !== 0) console.error('❌ Server crash exit code:', code); });

  try {
    await waitForServer();
    console.log('✅ Server listo\n');

    const login = await http('POST', '/api/auth/login', JSON.stringify({ userCi: 'V00000000', password: 'admin123' }));
    console.log(`1. LOGIN: ${login.status} role:${login.data?.user?.role} ${login.data?.message}`);

    const students = await http('GET', '/api/students?limit=1');
    console.log(`2. STUDENTS: ${students.status} ${students.status === 200 ? (students.data?.data?.length || 0) + ' registros ✅' : students.data?.message || ''}`);

    const old = cookie; cookie = '';
    const noAuth = await http('GET', '/api/students?limit=1');
    cookie = old;
    console.log(`3. SIN AUTH: ${noAuth.status} ${noAuth.status === 401 ? '✅' : '❌'}`);

    const me = await http('GET', '/api/auth/me');
    console.log(`4. /ME: ${me.status} ${me.data?.user?.name || 'error'}`);

    const ok = login.status === 200 && students.status === 200 && noAuth.status === 401 && me.status === 200;
    console.log(`\n${ok ? '✅ TODOS OK' : '❌ FALLÓ'}`);
  } finally {
    server.kill('SIGTERM');
    // Esperar que termine
    await new Promise(r => setTimeout(r, 3000));
  }
}

main();
