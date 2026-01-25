import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    // Environment configuration
    environment: "happy-dom",

    // Global setup and teardown
    globals: true,

    // Setup files
    setupFiles: ["./tests/setup.ts"],

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.d.ts",
        "src/**/*.types.ts",
        "src/env.d.ts",
        "src/**/*.stories.tsx",
        "src/**/*.test.{ts,tsx}",
        "src/**/*.spec.{ts,tsx}",
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 59,
        statements: 60,
      },
    },

    // Test patterns
    include: ["src/**/*.{test,spec}.{ts,tsx}", "tests/unit/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", "dist", ".astro", "tests/e2e"],

    // Watch mode configuration
    watch: false,

    // Reporter configuration
    reporters: ["verbose"],
  },

  // Path resolution
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
