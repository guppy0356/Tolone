import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { RiceCatalogComponent } from "./RiceCatalog.component";
import type { RiceCatalogFacade } from "./RiceCatalog.facade";

const baseFacade: RiceCatalogFacade = {
  rices: [
    { id: "1", brand: "コシヒカリ", producer: "魚沼農協", region: "新潟県" },
    { id: "2", brand: "コシヒカリ", producer: "丹後農協", region: "京都府" },
    { id: "3", brand: "あきたこまち", producer: "大潟村農協", region: "秋田県" },
    { id: "4", brand: "ひとめぼれ", producer: "JA仙台", region: "宮城県" },
  ],
  isPending: false,
  isFetching: false,
};

describe("RiceCatalogComponent", () => {
  it("renders all rices in table", () => {
    render(<RiceCatalogComponent {...baseFacade} />);
    const tbody = screen.getAllByRole("rowgroup")[1];
    const rows = within(tbody).getAllByRole("row");
    expect(rows).toHaveLength(4);
    expect(within(tbody).getByText("魚沼農協")).toBeInTheDocument();
    expect(within(tbody).getByText("丹後農協")).toBeInTheDocument();
    expect(within(tbody).getByText("大潟村農協")).toBeInTheDocument();
    expect(within(tbody).getByText("JA仙台")).toBeInTheDocument();
  });

  it("shows skeleton when isPending", () => {
    render(<RiceCatalogComponent {...baseFacade} isPending={true} />);
    expect(screen.getByLabelText("Loading rice catalog")).toBeInTheDocument();
    expect(screen.queryByText("Rice Catalog")).not.toBeInTheDocument();
  });

  it("applies opacity when isFetching", () => {
    const { container } = render(
      <RiceCatalogComponent {...baseFacade} isFetching={true} />,
    );
    expect(container.firstElementChild).toHaveClass("opacity-50");
  });

  it("filters rows by free-text search", async () => {
    const user = userEvent.setup();
    render(<RiceCatalogComponent {...baseFacade} />);

    const input = screen.getByPlaceholderText(
      "Search by brand, producer, or region...",
    );
    await user.type(input, "コシヒカリ");

    const tbody = screen.getAllByRole("rowgroup")[1];
    const rows = within(tbody).getAllByRole("row");
    expect(rows).toHaveLength(2);
    expect(within(tbody).getByText("魚沼農協")).toBeInTheDocument();
    expect(within(tbody).getByText("丹後農協")).toBeInTheDocument();
    expect(within(tbody).queryByText("あきたこまち")).not.toBeInTheDocument();
  });

  it("filters rows by select-box", async () => {
    const user = userEvent.setup();
    render(<RiceCatalogComponent {...baseFacade} />);

    const regionSelect = screen.getByLabelText("Region filter");
    await user.selectOptions(regionSelect, "新潟県");

    const tbody = screen.getAllByRole("rowgroup")[1];
    const rows = within(tbody).getAllByRole("row");
    expect(rows).toHaveLength(1);
    expect(within(tbody).getByText("魚沼農協")).toBeInTheDocument();
    expect(within(tbody).queryByText("丹後農協")).not.toBeInTheDocument();
  });

  it("derives select-box options from text-filtered results", async () => {
    const user = userEvent.setup();
    render(<RiceCatalogComponent {...baseFacade} />);

    const input = screen.getByPlaceholderText(
      "Search by brand, producer, or region...",
    );
    await user.type(input, "コシヒカリ");

    const regionSelect = screen.getByLabelText("Region filter");
    const options = within(regionSelect).getAllByRole("option");
    const optionValues = options.map((o) => o.textContent);

    expect(optionValues).toContain("新潟県");
    expect(optionValues).toContain("京都府");
    expect(optionValues).not.toContain("秋田県");
    expect(optionValues).not.toContain("宮城県");
  });

  it("resets select-box when option disappears from search", async () => {
    const user = userEvent.setup();
    render(<RiceCatalogComponent {...baseFacade} />);

    // Select 京都府 region
    const regionSelect = screen.getByLabelText("Region filter");
    await user.selectOptions(regionSelect, "京都府");

    const tbody = screen.getAllByRole("rowgroup")[1];
    let rows = within(tbody).getAllByRole("row");
    expect(rows).toHaveLength(1);
    expect(within(tbody).getByText("丹後農協")).toBeInTheDocument();

    // Now search for "魚沼" — only matches 新潟県, so 京都府 disappears from options
    const input = screen.getByPlaceholderText(
      "Search by brand, producer, or region...",
    );
    await user.type(input, "魚沼");

    // Region filter should have been auto-reset, showing the 魚沼 entry
    rows = within(tbody).getAllByRole("row");
    expect(rows).toHaveLength(1);
    expect(within(tbody).getByText("魚沼農協")).toBeInTheDocument();
  });
});
