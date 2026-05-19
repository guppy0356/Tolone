import type { Preview } from "@storybook/react-vite";
import { worker } from "../src/mocks/browser";
import "../src/app.css";

await worker.start({ onUnhandledRequest: "bypass" });

const preview: Preview = {};

export default preview;
