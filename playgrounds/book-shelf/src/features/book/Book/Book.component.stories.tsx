import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { BookComponent } from "./Book.component";

const meta = {
  title: "features/Book",
  component: BookComponent,
  args: { registerBook: fn() },
} satisfies Meta<typeof BookComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
