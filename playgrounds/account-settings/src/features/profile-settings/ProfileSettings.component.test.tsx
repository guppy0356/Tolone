import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { ProfileSettingsComponent } from "./ProfileSettings.component";
import type { ProfileSettingsFacade } from "./ProfileSettings.facade";

const baseFacade: ProfileSettingsFacade = {
  profile: { name: "Octocat", bio: "The cat that codes." },
  isPending: false,
  isFetching: false,
  updateProfile: vi.fn(),
};

describe("ProfileSettingsComponent", () => {
  it("renders skeleton while pending", () => {
    render(
      <ProfileSettingsComponent
        {...baseFacade}
        profile={undefined}
        isPending
      />,
    );
    expect(screen.getByLabelText("Loading profile")).toBeInTheDocument();
  });

  it("initializes form fields with server values", async () => {
    render(<ProfileSettingsComponent {...baseFacade} />);
    await waitFor(() => {
      expect(screen.getByLabelText("Name")).toHaveValue("Octocat");
    });
    expect(screen.getByLabelText("Bio")).toHaveValue("The cat that codes.");
  });

  it("disables Save until form is dirty", async () => {
    render(<ProfileSettingsComponent {...baseFacade} />);
    await waitFor(() => {
      expect(screen.getByLabelText("Name")).toHaveValue("Octocat");
    });
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("submits updated values", async () => {
    const updateProfile = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(
      <ProfileSettingsComponent
        {...baseFacade}
        updateProfile={updateProfile}
      />,
    );
    const nameInput = screen.getByLabelText("Name");
    await waitFor(() => expect(nameInput).toHaveValue("Octocat"));
    await user.clear(nameInput);
    await user.type(nameInput, "Hubot");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalledWith({
        name: "Hubot",
        bio: "The cat that codes.",
      });
    });
  });

  it("shows error when name is empty", async () => {
    const user = userEvent.setup();
    render(<ProfileSettingsComponent {...baseFacade} />);
    const nameInput = screen.getByLabelText("Name");
    await waitFor(() => expect(nameInput).toHaveValue("Octocat"));
    await user.clear(nameInput);
    expect(
      await screen.findByText("Name is required"),
    ).toBeInTheDocument();
  });

  it("shows error when name exceeds 39 characters", async () => {
    const user = userEvent.setup();
    render(<ProfileSettingsComponent {...baseFacade} />);
    const nameInput = screen.getByLabelText("Name");
    await waitFor(() => expect(nameInput).toHaveValue("Octocat"));
    await user.clear(nameInput);
    await user.type(nameInput, "a".repeat(40));
    expect(
      await screen.findByText("Name must be 39 characters or less"),
    ).toBeInTheDocument();
  });

  it("shows error when bio exceeds 160 characters", async () => {
    const user = userEvent.setup();
    render(<ProfileSettingsComponent {...baseFacade} />);
    const bioInput = screen.getByLabelText("Bio");
    await waitFor(() =>
      expect(bioInput).toHaveValue("The cat that codes."),
    );
    await user.clear(bioInput);
    await user.type(bioInput, "a".repeat(161));
    expect(
      await screen.findByText("Bio must be 160 characters or less"),
    ).toBeInTheDocument();
  });
});
