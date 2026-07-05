import { spawn } from 'child_process';
import { openSync } from 'fs';
import http from 'http';

const log = openSync('c:/temp/offline.log', 'w');
const child = spawn(
  process.execPath,
  ['--import', 'tsx/esm', 'src/server-offline.ts'],
  {
    cwd: process.cwd(),
    stdio: ['ignore', log, log],
    detached: true,
  }
);
child.unref();
console.log('Server PID:', child.pid);

// Wait for server to start, then test
const maxWait = Date.now() + 60000;
function test() {
  http.get('http://localhost:3001/api/health', (res) => {
    let data = '';
    res.on('data', (c) => data += c);
    res.on('end', () => {
      console.log('Health:', data);
      testLogin();
    });
  }).on('error', () => {
    if (Date.now() < maxWait) {
      setTimeout(test, 2000);
    } else {
      console.log('Timeout waiting for server');
      process.exit(1);
    }
  });
}

function testLogin() {
  const payload = JSON.stringify({ userCi: 'V12345678', password: 'Admin123' });
  const req = http.request('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, (res) => {
    let data = '';
    res.on('data', (c) => data += c);
    res.on('end', () => {
      console.log('Login:', data);
      process.exit(0);
    });
  });
  req.write(payload);
  req.end();
}

setTimeout(test, 15000);
