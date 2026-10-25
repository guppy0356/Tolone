import type { Meta, StoryObj } from "@storybook/react-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Scratch } from "./Scratch";

// 初学者版の story。「No QueryClient set」と言われたので decorator で包んだ。
const meta = {
  title: "features/Scratch",
  component: Scratch,
  decorators: [
    (Story) => (
      <QueryClientProvider client={new QueryClient()}>
        <Story />
      </QueryClientProvider>
    ),
  ],
} satisfies Meta<typeof Scratch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
