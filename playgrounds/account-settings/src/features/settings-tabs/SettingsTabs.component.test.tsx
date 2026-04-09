import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { SettingsTabsNav } from "./SettingsTabs.component";

describe("SettingsTabsNav", () => {
  it("marks the active tab as selected", () => {
    render(<SettingsTabsNav activeTab="profile" onTabChange={vi.fn()} />);
    expect(screen.getByRole("tab", { name: "Profile" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      screen.getByRole("tab", { name: "Notifications" }),
    ).toHaveAttribute("aria-selected", "false");
  });

  it("calls onTabChange when a tab is clicked", async () => {
    const onTabChange = vi.fn();
    const user = userEvent.setup();
    render(
      <SettingsTabsNav activeTab="profile" onTabChange={onTabChange} />,
    );
    await user.click(screen.getByRole("tab", { name: "Notifications" }));
    expect(onTabChange).toHaveBeenCalledWith("notifications");
  });
});
