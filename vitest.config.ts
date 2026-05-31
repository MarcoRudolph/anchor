import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts'],
    exclude: ['node_modules', '.next'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      // Start permissive — tighten as tests land on critical paths (ADR-0020)
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70,
      },
      include: [
        'src/app/**/*.ts',
        'src/app/**/*.tsx',
        'src/lib/**/*.ts',
        'src/i18n/**/*.ts',
      ],
      exclude: [
        'src/app/**/*.d.ts',
        'node_modules',
        '.next',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
