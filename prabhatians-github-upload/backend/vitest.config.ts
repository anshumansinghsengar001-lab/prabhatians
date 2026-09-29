import { defineConfig } from "vitest/config";
export default defineConfig({ test: { include: ["tests/**/*.test.ts"], setupFiles: ["./vitest.setup.ts"], testTimeout: 180000, hookTimeout: 180000, maxWorkers: 1, minWorkers: 1 } });
