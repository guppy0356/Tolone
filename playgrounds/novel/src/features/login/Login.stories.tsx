import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { LoginComponent } from "./Login.component";

const meta = {
  title: "features/Login",
  component: LoginComponent,
  args: {
    submit: fn(() => Promise.resolve()),
    isPending: false,
    error: null,
    onLoggedIn: fn(),
  },
} satisfies Meta<typeof LoginComponent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByLabelText("Email")).toBeInTheDocument();
    await expect(canvas.getByLabelText("Password")).toBeInTheDocument();
  },
};

export const SubmitsCredentialsAndCallsOnLoggedIn: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("Email"), "user@example.com");
    await userEvent.type(canvas.getByLabelText("Password"), "secret");
    await userEvent.click(canvas.getByRole("button", { name: "Sign in" }));
    await waitFor(async () => {
      await expect(args.submit).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "secret",
      });
      await expect(args.onLoggedIn).toHaveBeenCalled();
    });
  },
};

export const PendingState: Story = {
  args: { isPending: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Signing in…" });
    await expect(button).toBeDisabled();
  },
};

export const ErrorState: Story = {
  args: { error: new Error("nope") },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("alert")).toHaveTextContent(
      "Login failed. Try again.",
    );
  },
};

export const SubmitRejectionDoesNotCallOnLoggedIn: Story = {
  args: {
    submit: fn(() => Promise.reject(new Error("boom"))),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("Email"), "user@example.com");
    await userEvent.type(canvas.getByLabelText("Password"), "secret");
    await userEvent.click(canvas.getByRole("button", { name: "Sign in" }));
    await waitFor(async () => {
      await expect(args.submit).toHaveBeenCalled();
    });
    await expect(args.onLoggedIn).not.toHaveBeenCalled();
  },
};
