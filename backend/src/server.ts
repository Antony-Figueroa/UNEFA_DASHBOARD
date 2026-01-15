import { app, port } from './app.js';
import http from 'http';

const server: http.Server = app.listen(Number(port), '0.0.0.0', () => {
  console.log(`[server]: 🚀 Backend is running!`);
  console.log(`[server]: Port: ${port}`);
  console.log(`[server]: Interface: 0.0.0.0 (Accessible from Docker)`);
  console.log(`[server]: URL: http://localhost:${port}`);
});

server.on('error', (err: { code?: string }) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`[server] ERROR: Port ${port} already in use (EADDRINUSE).`);
    console.error('[server] Sugerencia: libera el puerto o cambia la variable PORT antes de reiniciar.');
    process.exit(1);
  }
  console.error('[server] Unexpected server error:', err);
  process.exit(1);
});
