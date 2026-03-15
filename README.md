# Architectural Playground: Facade + Presenter Pattern

This repository is a dedicated playground for experimenting with the **Facade + Presenter** pattern in modern React applications. It uses a monorepo structure to host multiple "theme" apps (e.g., Todo, CMS) sharing a common UI library and a centralized OpenAPI schema.

## 🏗 Key Concepts

- **Facade + Presenter Pattern**: Decoupling data orchestration (Facade) and UI logic (Presenter) from pure rendering (View).
- **OpenAPI-Driven Development**: The `openapi.yaml` at the root serves as the Single Source of Truth for both API mocking and TypeScript types.
- **Type-Safe Fetching**: Uses `openapi-fetch` for lightweight, schema-guaranteed API communication.
- **Instant Mocking**: Uses [Prism](https://stoplight.io/open-source/prism) to provide a mock backend instantly from the YAML schema.

## 📁 Project Structure

```text
.
├── openapi.yaml          # Central API specification (Source of Truth)
├── pnpm-workspace.yaml   # Monorepo configuration
├── apps/
│   ├── todo/             # Example: Todo application experiment
│   │   └── src/api/      # Generated types (v1.d.ts) reside here
│   └── cms/              # Example: CMS dashboard experiment
└── packages/
    └── ui/               # Shared UI components (shadcn/ui based)
```

## 🚀 Getting Started

### 1. Installation

```bash
pnpm install
```

### 2. Start Infrastructure (Mock Server & Typegen Watcher)

Run the following command at the root to start the Prism mock server and a file watcher that automatically regenerates TypeScript types whenever `openapi.yaml` is modified:

```bash
pnpm dev:infra
```

- **Mock Server**: Runs at `http://127.0.0.1:4010`
- **Typegen**: Automatically updates `./apps/*/src/api/v1.d.ts`

### 3. Run an App

Navigate to an app directory and start the Next.js development server:

```bash
cd apps/todo
pnpm dev
```

## 🛠 Development Workflow

1.  **Define Schema**: Update the root `openapi.yaml` with your desired API endpoints.
2.  **Auto-Sync**: The `watcher` will detect changes and update the type definitions inside each app's `src/api/` directory.
3.  **Implement Facade**: Create a `.facade.ts` using `openapi-fetch` to interact with the mock server.
4.  **Implement Presenter**: Create a `.presenter.ts` to manage local state and UI logic.
5.  **Build View**: Create a `.component.tsx` to render the UI using props from the Presenter.

## 🧪 Experiments Included

- **Pattern A (Todo)**: Basic CRUD with local state management.
- **Pattern B (CMS)**: Complex forms, validation, and dashboard layouts.
- **Pattern C (Advanced UI)**: Deeply nested components with state synchronization using Context or Sloting.

---
*Generated with ❤️ for architectural excellence.*