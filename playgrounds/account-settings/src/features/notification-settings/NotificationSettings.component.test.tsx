import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { NotificationSettingsComponent } from "./NotificationSettings.component";
import type { NotificationSettingsFacade } from "./NotificationSettings.facade";

const baseFacade: NotificationSettingsFacade = {
  preferences: {
    reviewRequested: true,
    mentioned: true,
    issueAssigned: false,
  },
  isPending: false,
  isFetching: false,
  updatePreference: vi.fn(),
};

describe("NotificationSettingsComponent", () => {
  it("renders skeleton while pending", () => {
    render(
      <NotificationSettingsComponent
        {...baseFacade}
        preferences={undefined}
        isPending
      />,
    );
    expect(screen.getByLabelText("Loading notifications")).toBeInTheDocument();
  });

  it("renders all three toggles with server values", () => {
    render(<NotificationSettingsComponent {...baseFacade} />);
    expect(screen.getByLabelText("Review requested")).toBeChecked();
    expect(screen.getByLabelText("Mentioned")).toBeChecked();
    expect(screen.getByLabelText("Issue assigned")).not.toBeChecked();
  });

  it("calls updatePreference with flipped value when toggled", async () => {
    const updatePreference = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(
      <NotificationSettingsComponent
        {...baseFacade}
        updatePreference={updatePreference}
      />,
    );
    await user.click(screen.getByLabelText("Issue assigned"));
    expect(updatePreference).toHaveBeenCalledWith("issueAssigned", true);
  });

  it("toggles off an enabled preference", async () => {
    const updatePreference = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(
      <NotificationSettingsComponent
        {...baseFacade}
        updatePreference={updatePreference}
      />,
    );
    await user.click(screen.getByLabelText("Review requested"));
    expect(updatePreference).toHaveBeenCalledWith("reviewRequested", false);
  });
});
