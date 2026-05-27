import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Environment de Node (NO jsdom — esto es backend)
    environment: 'node',

    // Global setup antes de todos los tests
    globalSetup: ['./tests/setup/globalSetup.ts'],

    // Incluir solo archivos .test.ts en modules/
    include: ['./tests/modules/**/*.test.ts'],

    // Timeout generoso para tests de integración (30s)
    testTimeout: 30000,
    hookTimeout: 30000,

    // No paralelizar archivos de tests — corren secuencial para no pisar data
    fileParallelism: false,

    // Mostrar output más detallado
    reporters: ['verbose'],

    // Forzar la carga de .env
    envDir: path.resolve(__dirname, '..'),
  },
});
