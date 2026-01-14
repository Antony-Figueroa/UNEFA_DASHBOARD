import { app, port } from './app.js';
import http from 'http';

const server: http.Server = app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
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
