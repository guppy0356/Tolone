import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { CompanyPicker, type CompanyPickerProps } from "./CompanyPicker.component";

const companies = [
  { id: "c1", name: "Acme" },
  { id: "c2", name: "Globex" },
];

function props(overrides: Partial<CompanyPickerProps> = {}): CompanyPickerProps {
  return {
    selected: null,
    keyword: "",
    onKeywordChange: vi.fn(),
    companies: [],
    isSearching: false,
    isOpen: false,
    onOpen: vi.fn(),
    onClose: vi.fn(),
    onSelect: vi.fn(),
    error: undefined,
    ...overrides,
  };
}

test("opens on click and forwards what is typed", async () => {
  const p = props();
  const screen = await render(<CompanyPicker {...p} />);
  await screen.getByLabelText("Company").click();
  expect(p.onOpen).toHaveBeenCalled();

  await screen.rerender(<CompanyPicker {...p} isOpen />);
  await screen.getByPlaceholder("Search companies").fill("Ac");
  expect(p.onKeywordChange).toHaveBeenLastCalledWith("Ac");
});

test("lists the matches and selects one", async () => {
  const p = props({ isOpen: true, keyword: "g", companies });
  const screen = await render(<CompanyPicker {...p} />);
  await screen.getByRole("option", { name: "Globex" }).click();
  expect(p.onSelect).toHaveBeenCalledWith(companies[1]);
});

test("says when it is searching and when nothing matches", async () => {
  const searching = await render(<CompanyPicker {...props({ isOpen: true, keyword: "zz", isSearching: true })} />);
  await expect.element(searching.getByText("Searching…")).toBeVisible();
  await searching.rerender(<CompanyPicker {...props({ isOpen: true, keyword: "zz" })} />);
  await expect.element(searching.getByText("No companies match")).toBeVisible();
});

test("closes on a click outside", async () => {
  const p = props({ isOpen: true });
  const screen = await render(
    <div>
      <p>Outside</p>
      <CompanyPicker {...p} />
    </div>,
  );
  await screen.getByText("Outside").click();
  expect(p.onClose).toHaveBeenCalled();
});
