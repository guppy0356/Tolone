import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { LoginComponent, type LoginComponentProps } from "./Login.component";

const baseProps: LoginComponentProps = {
  submit: vi.fn().mockResolvedValue(undefined),
  isPending: false,
  error: null,
  onLoggedIn: vi.fn(),
};

describe("LoginComponent", () => {
  it("renders the email and password inputs", () => {
    render(<LoginComponent {...baseProps} />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("calls submit with typed credentials, then onLoggedIn", async () => {
    const submit = vi.fn().mockResolvedValue(undefined);
    const onLoggedIn = vi.fn();
    const user = userEvent.setup();
    render(
      <LoginComponent
        {...baseProps}
        submit={submit}
        onLoggedIn={onLoggedIn}
      />,
    );

    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(submit).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "secret",
    });
    expect(onLoggedIn).toHaveBeenCalled();
  });

  it("disables the button and shows pending label while submitting", () => {
    render(<LoginComponent {...baseProps} isPending={true} />);
    const button = screen.getByRole("button", { name: "Signing in…" });
    expect(button).toBeDisabled();
  });

  it("shows an error message when error is set", () => {
    render(
      <LoginComponent {...baseProps} error={new Error("nope")} />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Login failed. Try again.",
    );
  });

  it("does not call onLoggedIn if submit rejects", async () => {
    const submit = vi.fn().mockRejectedValue(new Error("boom"));
    const onLoggedIn = vi.fn();
    const user = userEvent.setup();
    render(
      <LoginComponent
        {...baseProps}
        submit={submit}
        onLoggedIn={onLoggedIn}
      />,
    );

    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(submit).toHaveBeenCalled();
    expect(onLoggedIn).not.toHaveBeenCalled();
  });
});
