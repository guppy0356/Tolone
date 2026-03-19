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
  join(root, "src", "mocks"),
  join(root, "src", "test"),
  join(root, "public"),
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
    "test": "vitest run"
  },
  "dependencies": {
    "@tanstack/react-query": "catalog:",
    "react": "catalog:",
    "react-dom": "catalog:",
    "ky": "catalog:"
  },
  "devDependencies": {
    "@tolone/tailwind": "workspace:*",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "tailwindcss": "catalog:",
    "@tailwindcss/vite": "catalog:",
    "vite": "^6.0.0",
    "vitest": "catalog:",
    "msw": "catalog:",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",
    "jsdom": "^25.0.0",
    "typescript": "^5.7.0"
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

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
`;

const vitestConfig = `import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    css: false,
    setupFiles: ["./src/test/setup.ts"],
  },
});
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
import "./app.css";

const queryClient = new QueryClient();

async function enableMocking() {
  const { worker } = await import("./mocks/browser");
  return worker.start({ onUnhandledRequest: "bypass" });
}

enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <div>
          <h1>${pascal} Playground</h1>
        </div>
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

export const api = ky.create({ prefixUrl: "/api" });
`;

const mockHandlers = `import type { HttpHandler } from "msw";

export const handlers: HttpHandler[] = [];
`;

const mockBrowser = `import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);
`;

const testSetup = `import "@testing-library/jest-dom/vitest";
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
  [join(root, "src", "test", "setup.ts"), testSetup],
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
