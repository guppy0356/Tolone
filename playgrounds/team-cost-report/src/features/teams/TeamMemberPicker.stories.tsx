import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  expect,
  fireEvent,
  fn,
  userEvent,
  waitFor,
  within,
} from "storybook/test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TeamMemberPicker } from "./TeamMemberPicker.component";

const meta = {
  title: "features/TeamMemberPicker",
  component: TeamMemberPicker,
  args: {
    picked: [],
    onAdd: fn(),
    onRemove: fn(),
    onRateChange: fn(),
  },
  decorators: [
    (Story) => {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      return (
        <QueryClientProvider client={queryClient}>
          <Story />
        </QueryClientProvider>
      );
    },
  ],
} satisfies Meta<typeof TeamMemberPicker>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const OpensComboboxAndListsMatches: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /Add member/ }));
    await expect(
      canvas.getByRole("combobox", { name: "Search members" }),
    ).toBeInTheDocument();
    await waitFor(async () => {
      await expect(canvas.getByText("Ada Lovelace")).toBeInTheDocument();
    });
  },
};

export const FiltersAsUserTypes: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /Add member/ }));
    const input = canvas.getByRole("combobox", { name: "Search members" });
    await userEvent.type(input, "Ada");
    await waitFor(async () => {
      await expect(canvas.getByText("Ada Lovelace")).toBeInTheDocument();
      await expect(canvas.queryByText("Alan Turing")).not.toBeInTheDocument();
    });
  },
};

export const CallsOnAddOnSelect: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /Add member/ }));
    await waitFor(async () => {
      await expect(canvas.getByText("Grace Hopper")).toBeInTheDocument();
    });
    await userEvent.click(canvas.getByText("Grace Hopper"));
    await expect(args.onAdd).toHaveBeenCalledWith({
      id: "m3",
      name: "Grace Hopper",
    });
  },
};

export const RendersPickedWithRateAndRemove: Story = {
  args: {
    picked: [{ memberId: "m1", name: "Ada Lovelace", hourlyRate: 120 }],
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const rateInput = canvas.getByLabelText(
      "Hourly rate for Ada Lovelace",
    ) as HTMLInputElement;
    await expect(rateInput).toHaveValue(120);
    await fireEvent.change(rateInput, { target: { value: "150" } });
    await expect(args.onRateChange).toHaveBeenLastCalledWith("m1", 150);

    await userEvent.click(
      canvas.getByRole("button", { name: "Remove Ada Lovelace" }),
    );
    await expect(args.onRemove).toHaveBeenCalledWith("m1");
  },
};

export const ExcludesAlreadyPickedMembers: Story = {
  args: {
    picked: [{ memberId: "m1", name: "Ada Lovelace", hourlyRate: 100 }],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /Add member/ }));
    await waitFor(async () => {
      await expect(canvas.getByText("Alan Turing")).toBeInTheDocument();
    });
    // Ada appears only in the chip area, not the dropdown
    const adaElements = canvas.getAllByText("Ada Lovelace");
    await expect(adaElements).toHaveLength(1);
  },
};
