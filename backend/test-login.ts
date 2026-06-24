import { spawn } from 'child_process';
import { request } from 'http';

const PORT = 3001;
process.env.PORT = String(PORT);

const serverPath = new URL('./src/app.ts', import.meta.url).pathname;

// Spawn backend
const backend = spawn('npx', ['tsx', serverPath], {
  cwd: new URL('.', import.meta.url).pathname,
  env: { ...process.env, PORT: String(PORT) },
  stdio: ['ignore', 'pipe', 'pipe']
});

backend.stdout.on('data', d => process.stdout.write(`[BE] ${d}`));
backend.stderr.on('data', d => process.stderr.write(`[BE:e] ${d}`));

// Wait for it to start
function waitForServer(retries = 20) {
  return new Promise((resolve, reject) => {
    const tryConnect = (n) => {
      if (n <= 0) return reject(new Error('Timeout waiting for server'));
      const req = request({ hostname: 'localhost', port: PORT, path: '/', method: 'GET', timeout: 1000 }, (res) => {
        resolve(true);
      });
      req.on('error', () => setTimeout(() => tryConnect(n - 1), 1000));
      req.on('timeout', () => { req.destroy(); setTimeout(() => tryConnect(n - 1), 1000); });
      req.end();
    };
    tryConnect(retries);
  });
}

async function main() {
  console.log('Waiting for backend...');
  await waitForServer(25);
  console.log('Backend ready!');
  
  // Test login
  const body = JSON.stringify({ userCi: '00000000', password: 'Admin123!' });
  const result = await new Promise((resolve, reject) => {
    const req = request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
  
  console.log(`Status: ${result.status}`);
  console.log(`Body: ${result.body}`);
  
  try {
    const parsed = JSON.parse(result.body);
    if (parsed.token || parsed.access_token) console.log('✅ LOGIN EXITOSO - Token recibido');
    else if (parsed.requirePasswordChange) console.log('⚠️ Login ok pero requiere cambio de clave');
    else console.log('❌ Login falló:', parsed.message);
  } catch { console.log('No JSON response'); }
  
  backend.kill();
  process.exit(result.status === 200 ? 0 : 1);
}

main().catch(e => { console.error(e); backend.kill(); process.exit(1); });
