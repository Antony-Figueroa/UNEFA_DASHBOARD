import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Set env before importing app
process.env.PORT = '3099';

const { default: app } = await import('./src/app.js');

const server = app.listen(3099, async () => {
  console.log('Server started on 3099');
  
  try {
    const http = require('http');
    
    const makeRequest = (path, method, body) => new Promise((resolve, reject) => {
      const data = body ? JSON.stringify(body) : '';
      const opts = {
        hostname: 'localhost', port: 3099, path, method,
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
      };
      const req = http.request(opts, res => {
        let b = '';
        res.on('data', c => b += c);
        res.on('end', () => resolve({ status: res.statusCode, body: b }));
      });
      req.on('error', reject);
      if (data) req.write(data);
      req.end();
    });
    
    // Test 1: Login with CI 00000000
    console.log('\n--- Test 1: Login con CI 00000000 ---');
    const r1 = await makeRequest('/api/auth/login', 'POST', { userCi: '00000000', password: 'Admin123!' });
    console.log(`Status: ${r1.status}`);
    console.log(`Body: ${r1.body.substring(0, 200)}`);
    
    if (r1.status === 200) {
      const j1 = JSON.parse(r1.body);
      if (j1.token || j1.access_token) console.log('✅ LOGIN EXITOSO');
      else if (j1.requirePasswordChange) console.log('⚠️ OK pero requiere cambio de clave');
      else console.log('❌:', j1.message);
    } else {
      console.log('❌ Login falló');
    }
    
    // Test 2: Login with 'admin' as userCi (for the USER column)
    console.log('\n--- Test 2: Login con USER=admin ---');
    const r2 = await makeRequest('/api/auth/login', 'POST', { userCi: 'admin', password: 'Admin123!' });
    console.log(`Status: ${r2.status}`);
    console.log(`Body: ${r2.body.substring(0, 200)}`);
    
  } catch (e) {
    console.error('Error:', e);
  } finally {
    server.close();
    process.exit(0);
  }
});
