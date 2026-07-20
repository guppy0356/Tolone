import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

// pnpm resolves two vitest instances via peer graphs, splitting the
// BrowserProviderOption type. Cast bridges them; runtime is unaffected.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const browserProvider = playwright({}) as any;

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
          browser: {
            enabled: true,
            provider: browserProvider,
            headless: true,
            instances: [{ browser: "chromium" }],
          },
        },
      },
      {
        extends: true,
        test: {
          name: "behavior",
          include: ["src/**/*.test.{ts,tsx}"],
          browser: {
            enabled: true,
            provider: browserProvider,
            headless: true,
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
