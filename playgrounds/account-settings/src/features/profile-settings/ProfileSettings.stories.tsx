import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { ProfileSettingsComponent } from "./ProfileSettings.component";

const meta = {
  title: "features/ProfileSettings",
  component: ProfileSettingsComponent,
  args: {
    profile: { name: "Octocat", bio: "The cat that codes." },
    isPending: false,
    isFetching: false,
    updateProfile: fn(),
  },
} satisfies Meta<typeof ProfileSettingsComponent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(async () => {
      await expect(canvas.getByLabelText("Name")).toHaveValue("Octocat");
    });
    await expect(canvas.getByLabelText("Bio")).toHaveValue(
      "The cat that codes.",
    );
  },
};

export const Skeleton: Story = {
  args: { profile: undefined, isPending: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByLabelText("Loading profile")).toBeInTheDocument();
  },
};

export const SaveDisabledUntilDirty: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(async () => {
      await expect(canvas.getByLabelText("Name")).toHaveValue("Octocat");
    });
    await expect(
      canvas.getByRole("button", { name: "Save" }),
    ).toBeDisabled();
  },
};

export const SubmitsUpdatedValues: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const nameInput = canvas.getByLabelText("Name");
    await waitFor(async () => {
      await expect(nameInput).toHaveValue("Octocat");
    });
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Hubot");
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));
    await waitFor(async () => {
      await expect(args.updateProfile).toHaveBeenCalledWith({
        name: "Hubot",
        bio: "The cat that codes.",
      });
    });
  },
};

export const ValidatesEmptyName: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nameInput = canvas.getByLabelText("Name");
    await waitFor(async () => {
      await expect(nameInput).toHaveValue("Octocat");
    });
    await userEvent.clear(nameInput);
    await expect(
      await canvas.findByText("Name is required"),
    ).toBeInTheDocument();
  },
};

export const ValidatesNameMaxLength: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nameInput = canvas.getByLabelText("Name");
    await waitFor(async () => {
      await expect(nameInput).toHaveValue("Octocat");
    });
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "a".repeat(40));
    await expect(
      await canvas.findByText("Name must be 39 characters or less"),
    ).toBeInTheDocument();
  },
};

export const ValidatesBioMaxLength: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bioInput = canvas.getByLabelText("Bio");
    await waitFor(async () => {
      await expect(bioInput).toHaveValue("The cat that codes.");
    });
    await userEvent.clear(bioInput);
    await userEvent.type(bioInput, "a".repeat(161));
    await expect(
      await canvas.findByText("Bio must be 160 characters or less"),
    ).toBeInTheDocument();
  },
};
