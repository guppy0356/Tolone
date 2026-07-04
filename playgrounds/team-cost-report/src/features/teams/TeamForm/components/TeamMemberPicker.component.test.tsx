import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import type { Member } from "@api/Member.api";
import {
  TeamMemberPicker,
  type TeamMemberPickerProps,
} from "./TeamMemberPicker.component";

const candidates: Member[] = [
  { id: "m1", name: "Ada Lovelace" },
  { id: "m3", name: "Grace Hopper" },
];

function buildProps(
  overrides: Partial<TeamMemberPickerProps> = {},
): TeamMemberPickerProps {
  return {
    open: true,
    query: "",
    setQuery: vi.fn(),
    candidates,
    isSearching: false,
    onAdd: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
}

async function renderPicker(overrides: Partial<TeamMemberPickerProps> = {}) {
  const props = buildProps(overrides);
  const screen = await render(
    <TeamMemberPicker
      open={props.open}
      query={props.query}
      setQuery={props.setQuery}
      candidates={props.candidates}
      isSearching={props.isSearching}
      onAdd={props.onAdd}
      onClose={props.onClose}
    />,
  );
  return { screen, props };
}

test("renders nothing while closed", async () => {
  const { screen } = await renderPicker({ open: false });

  expect(screen.container.childElementCount).toBe(0);
});

test("forwards typed input to setQuery", async () => {
  const { screen, props } = await renderPicker();

  await screen.getByRole("combobox", { name: "Search members" }).fill("Ada");

  expect(props.setQuery).toHaveBeenCalledWith("Ada");
});

test("calls onAdd and onClose when a candidate is selected", async () => {
  const { screen, props } = await renderPicker();

  await screen.getByText("Grace Hopper").click();

  expect(props.onAdd).toHaveBeenCalledWith({ id: "m3", name: "Grace Hopper" });
  expect(props.onClose).toHaveBeenCalled();
});

test("calls onClose on Escape", async () => {
  const { screen, props } = await renderPicker();

  const input = screen.getByRole("combobox", { name: "Search members" });
  await input.click();
  input
    .element()
    .dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

  await vi.waitFor(() => {
    expect(props.onClose).toHaveBeenCalled();
  });
});

test("calls onClose on a click outside", async () => {
  const props = buildProps();
  const screen = await render(
    <div>
      <button type="button">outside</button>
      <TeamMemberPicker
        open={props.open}
        query={props.query}
        setQuery={props.setQuery}
        candidates={props.candidates}
        isSearching={props.isSearching}
        onAdd={props.onAdd}
        onClose={props.onClose}
      />
    </div>,
  );

  await screen.getByRole("button", { name: "outside" }).click();

  expect(props.onClose).toHaveBeenCalled();
});

test("shows the searching placeholder before results arrive", async () => {
  const { screen } = await renderPicker({ isSearching: true, candidates: [] });

  await expect.element(screen.getByText("Searching…")).toBeInTheDocument();
});

test("shows the no-match message when the search comes back empty", async () => {
  const { screen } = await renderPicker({ candidates: [] });

  await expect.element(screen.getByText("No members match")).toBeInTheDocument();
});
