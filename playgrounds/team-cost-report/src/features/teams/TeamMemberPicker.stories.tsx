import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import type { Member } from "@api/Member.api";
import { memberQueries } from "@api/Member.queries";
import { TeamMemberPicker } from "./TeamMemberPicker.component";

interface HarnessProps {
  onAdd: (member: Member) => void;
  onClose: () => void;
}

function TeamMemberPickerHarness({ onAdd, onClose }: HarnessProps) {
  const [query, setQuery] = useState("");
  const { data, isFetching } = useQuery(memberQueries.list(query || undefined));
  return (
    <TeamMemberPicker
      open={true}
      query={query}
      setQuery={setQuery}
      candidates={data ?? []}
      isSearching={isFetching}
      onAdd={onAdd}
      onClose={onClose}
    />
  );
}

const meta = {
  title: "features/TeamMemberPicker",
  component: TeamMemberPickerHarness,
  args: {
    onAdd: fn(),
    onClose: fn(),
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
} satisfies Meta<typeof TeamMemberPickerHarness>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const FiltersAsUserTypes: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("combobox", { name: "Search members" });
    await userEvent.type(input, "Ada");
    await waitFor(async () => {
      await expect(canvas.getByText("Ada Lovelace")).toBeInTheDocument();
      await expect(canvas.queryByText("Alan Turing")).not.toBeInTheDocument();
    });
  },
};

export const CallsOnAddAndOnCloseOnSelect: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(async () => {
      await expect(canvas.getByText("Grace Hopper")).toBeInTheDocument();
    });
    await userEvent.click(canvas.getByText("Grace Hopper"));
    await expect(args.onAdd).toHaveBeenCalledWith({
      id: "m3",
      name: "Grace Hopper",
    });
    await expect(args.onClose).toHaveBeenCalled();
  },
};

export const CallsOnCloseOnEscape: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("combobox", { name: "Search members" });
    await userEvent.click(input);
    await userEvent.keyboard("{Escape}");
    await expect(args.onClose).toHaveBeenCalled();
  },
};
