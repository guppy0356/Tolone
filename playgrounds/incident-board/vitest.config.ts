import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Shared by both projects so the stories and the behavior tests run in the
// same Playwright Chromium instance.
const browser = {
  enabled: true,
  // pnpm resolves two vitest instances via peer graphs, splitting the
  // BrowserProviderOption type. Cast bridges them; runtime is unaffected.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  provider: playwright({}) as any,
  headless: true,
  instances: [{ browser: "chromium" }],
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@api": path.join(dirname, "src/api"),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        plugins: [
          storybookTest({
            configDir: path.join(dirname, ".storybook"),
            storybookScript: "pnpm storybook --no-open",
          }),
        ],
        test: {
          name: "storybook",
          browser,
        },
      },
      {
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.test.{ts,tsx}"],
          setupFiles: [path.join(dirname, "src/test/setup.ts")],
          browser,
        },
      },
    ],
  },
});
