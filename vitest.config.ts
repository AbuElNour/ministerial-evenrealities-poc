import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'contracts/test/**/*.test.ts',
      'scripts/test/**/*.test.ts',
      'plugin/test/**/*.test.ts',
    ],
  },
});
