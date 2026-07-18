import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['./tests/modules/**/*.test.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    fileParallelism: false,
    reporters: ['verbose'],
    envDir: path.resolve(__dirname, '..'),
    // No globalSetup — unit tests use mocks, no live DB needed
  },
});
