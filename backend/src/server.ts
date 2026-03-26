import { app, port } from './app.js';
import http from 'http';

const server: http.Server = app.listen(Number(port), '0.0.0.0', () => {
  console.log(`🚀 Backend corriendo en http://localhost:${port}`);
});

server.on('error', (err: { code?: string }) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`❌ ERROR: Puerto ${port} en uso. Cerrá el proceso o cambiá la variable PORT.`);
    process.exit(1);
  }
  console.error('❌ Error inesperado del servidor:', err);
  process.exit(1);
});
