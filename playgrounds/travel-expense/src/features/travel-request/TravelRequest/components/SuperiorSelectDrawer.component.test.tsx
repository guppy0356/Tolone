import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import {
  SuperiorSelectDrawer,
  type SuperiorSelectDrawerProps,
} from "./SuperiorSelectDrawer.component";
import type { Superior } from "@api/Superior.api";

const superiors: Superior[] = [
  { id: "sup-1", name: "Aiko Tanaka", title: "Engineering Manager" },
  { id: "sup-2", name: "Kenji Sato", title: "Director of Sales" },
];

function makeProps(
  overrides: Partial<SuperiorSelectDrawerProps> = {},
): SuperiorSelectDrawerProps {
  return {
    superiors,
    isSuperiorsPending: false,
    onSelect: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
}

test("lists the superiors with their titles", async () => {
  const props = makeProps();
  const screen = await render(<SuperiorSelectDrawer {...props} />);

  await expect.element(screen.getByText("Aiko Tanaka")).toBeVisible();
  await expect.element(screen.getByText("Engineering Manager")).toBeVisible();
  await expect.element(screen.getByText("Kenji Sato")).toBeVisible();
  await expect.element(screen.getByText("Director of Sales")).toBeVisible();
});

test("choosing a superior reports their id", async () => {
  const props = makeProps();
  const screen = await render(<SuperiorSelectDrawer {...props} />);

  await screen.getByText("Kenji Sato").click();

  expect(props.onSelect).toHaveBeenCalledWith("sup-2");
});

test("shows a skeleton while superiors are loading", async () => {
  const props = makeProps({ superiors: [], isSuperiorsPending: true });
  const screen = await render(<SuperiorSelectDrawer {...props} />);

  await expect
    .element(screen.getByRole("dialog", { name: "Select next approver" }))
    .toBeVisible();
  await expect
    .element(screen.getByText("Aiko Tanaka"))
    .not.toBeInTheDocument();
});

test("the close button closes the drawer", async () => {
  const props = makeProps();
  const screen = await render(<SuperiorSelectDrawer {...props} />);

  await screen.getByRole("button", { name: "Close" }).click();
  expect(props.onClose).toHaveBeenCalled();
});
