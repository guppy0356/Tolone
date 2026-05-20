import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

const name = process.argv[2];
if (!name) {
  console.error("Usage: pnpm new:playground <name>");
  process.exit(1);
}

const pascal = name.charAt(0).toUpperCase() + name.slice(1);
const root = join("playgrounds", name);

// Directory structure
const dirs = [
  root,
  join(root, "src"),
  join(root, "src", "lib"),
  join(root, "src", "features"),
  join(root, "src", "features", "welcome"),
  join(root, "src", "mocks"),
  join(root, "src", "types"),
  join(root, "public"),
  join(root, ".storybook"),
];

for (const dir of dirs) {
  mkdirSync(dir, { recursive: true });
}

// --- File templates ---

const packageJson = `{
  "name": "@tolone/${name}",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    "generate:api": "openapi-typescript src/openapi.yaml -o src/types/openapi.d.ts"
  },
  "dependencies": {
    "@tanstack/react-query": "catalog:",
    "@tanstack/react-router": "catalog:",
    "openapi-msw": "catalog:",
    "react": "catalog:",
    "react-dom": "catalog:",
    "ky": "catalog:"
  },
  "devDependencies": {
    "@storybook/addon-vitest": "catalog:",
    "@storybook/react-vite": "catalog:",
    "@tailwindcss/vite": "catalog:",
    "@tolone/tailwind": "workspace:*",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.1",
    "@vitest/browser": "catalog:",
    "@vitest/browser-playwright": "catalog:",
    "msw": "catalog:",
    "openapi-typescript": "catalog:",
    "playwright": "catalog:",
    "storybook": "catalog:",
    "tailwindcss": "catalog:",
    "typescript": "^6.0.3",
    "vite": "^8.0.10",
    "vite-plugin-checker": "catalog:",
    "vitest": "catalog:"
  }
}
`;

const tsconfig = `{
  "extends": "../../tsconfig.json",
  "include": ["src"]
}
`;

const viteConfig = `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import checker from "vite-plugin-checker";

export default defineConfig({
  plugins: [react(), tailwindcss(), checker({ typescript: true })],
});
`;

const vitestConfig = `import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
            // pnpm resolves two vitest instances via peer graphs, splitting the
            // BrowserProviderOption type. Cast bridges them; runtime is unaffected.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            provider: playwright({}) as any,
            headless: true,
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
`;

const storybookMain = `import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  framework: "@storybook/react-vite",
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-vitest"],
};

export default config;
`;

const storybookPreview = `import type { Preview } from "@storybook/react-vite";
import "../src/app.css";

const preview: Preview = {};

export default preview;
`;

const welcomeStory = `import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Welcome",
  render: () => (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Welcome to ${pascal}</h1>
      <p className="text-gray-600">
        Replace this with your first feature story.
      </p>
    </div>
  ),
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
`;

const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${pascal}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;

const mainTsx = `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createRouter,
  createRootRoute,
  createRoute,
  RouterProvider,
} from "@tanstack/react-router";
import "./app.css";

const queryClient = new QueryClient();

const rootRoute = createRootRoute();

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => (
    <div>
      <h1>${pascal} Playground</h1>
    </div>
  ),
});

const routeTree = rootRoute.addChildren([indexRoute]);
const router = createRouter({ routeTree });

async function enableMocking() {
  const { worker } = await import("./mocks/browser");
  return worker.start({ onUnhandledRequest: "bypass" });
}

enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  );
});
`;

const appCss = `@import "@tolone/tailwind/base.css";
`;

const viteEnvDts = `/// <reference types="vite/client" />
`;

const apiClient = `import ky from "ky";

export const api = ky.create({ prefix: "/api" });
`;

const mockHandlers = `import type { HttpHandler } from "msw";

export const handlers: HttpHandler[] = [];
`;

const mockBrowser = `import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);
`;

// --- Write files ---

const files = [
  [join(root, "package.json"), packageJson],
  [join(root, "tsconfig.json"), tsconfig],
  [join(root, "vite.config.ts"), viteConfig],
  [join(root, "vitest.config.ts"), vitestConfig],
  [join(root, "index.html"), indexHtml],
  [join(root, "src", "main.tsx"), mainTsx],
  [join(root, "src", "app.css"), appCss],
  [join(root, "src", "vite-env.d.ts"), viteEnvDts],
  [join(root, "src", "lib", "api-client.ts"), apiClient],
  [join(root, "src", "mocks", "handlers.ts"), mockHandlers],
  [join(root, "src", "mocks", "browser.ts"), mockBrowser],
  [join(root, ".storybook", "main.ts"), storybookMain],
  [join(root, ".storybook", "preview.ts"), storybookPreview],
  [join(root, "src", "features", "welcome", "Welcome.stories.tsx"), welcomeStory],
];

for (const [filePath, content] of files) {
  writeFileSync(filePath, content);
}

console.log(`\nScaffolded playground: ${root}`);

// Install dependencies
console.log("\nInstalling dependencies...");
execSync("pnpm install", { stdio: "inherit" });

// Initialize MSW
console.log("\nInitializing MSW...");
execSync(`pnpm --filter @tolone/${name} exec msw init public --save`, {
  stdio: "inherit",
});

console.log(`\n✅ Playground "${name}" is ready!`);
console.log(`   cd ${root}`);
console.log(`   pnpm --filter @tolone/${name} dev`);
