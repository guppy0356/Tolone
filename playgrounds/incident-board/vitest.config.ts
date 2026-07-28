import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Both projects run in Playwright Chromium. Each needs its own config object:
// vitest stamps the resolved project name onto the shared `instances` entries,
// so reusing one literal makes the two projects collide on a single name.
const browserConfig = () => ({
  enabled: true,
  // pnpm resolves two vitest instances via peer graphs, splitting the
  // BrowserProviderOption type. Cast bridges them; runtime is unaffected.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  provider: playwright({}) as any,
  headless: true,
  instances: [{ browser: "chromium" }],
});

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@api": path.join(dirname, "src/api"),
    },
    // vitest-browser-react bundles its own React; without this the router's
    // hooks run against a second copy and every render throws.
    dedupe: ["react", "react-dom"],
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
          browser: browserConfig(),
        },
      },
      {
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.test.{ts,tsx}"],
          setupFiles: [path.join(dirname, "src/test/setup.ts")],
          browser: browserConfig(),
        },
      },
    ],
  },
});
