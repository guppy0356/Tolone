import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { RiceCatalogComponent } from "./RiceCatalog.component";
import type { RiceCatalogFacade } from "./RiceCatalog.facade";

const baseFacade: RiceCatalogFacade = {
  rices: [
    { id: "1", brand: "コシヒカリ", producer: "魚沼農協", region: "新潟県" },
    { id: "2", brand: "コシヒカリ", producer: "丹後農協", region: "京都府" },
    { id: "3", brand: "あきたこまち", producer: "大潟村農協", region: "秋田県" },
    { id: "4", brand: "ひとめぼれ", producer: "JA仙台", region: "宮城県" },
  ],
  filters: {
    brands: ["あきたこまち", "コシヒカリ", "ひとめぼれ"],
    producers: ["JA仙台", "大潟村農協", "丹後農協", "魚沼農協"],
    regions: ["京都府", "宮城県", "新潟県", "秋田県"],
  },
  isPending: false,
  isFetching: false,
  params: {},
  setSearchQuery: vi.fn(),
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

  it("renders filter options from filters prop", () => {
    render(<RiceCatalogComponent {...baseFacade} />);

    const brandSelect = screen.getByLabelText("Brand filter");
    const brandOptions = within(brandSelect)
      .getAllByRole("option")
      .map((o) => o.textContent);
    expect(brandOptions).toEqual([
      "All brands",
      "あきたこまち",
      "コシヒカリ",
      "ひとめぼれ",
    ]);

    const regionSelect = screen.getByLabelText("Region filter");
    const regionOptions = within(regionSelect)
      .getAllByRole("option")
      .map((o) => o.textContent);
    expect(regionOptions).toEqual([
      "All regions",
      "京都府",
      "宮城県",
      "新潟県",
      "秋田県",
    ]);
  });

  it("calls setSearchQuery on search input change", async () => {
    const setSearchQuery = vi.fn();
    const user = userEvent.setup();
    render(
      <RiceCatalogComponent {...baseFacade} setSearchQuery={setSearchQuery} />,
    );

    const input = screen.getByPlaceholderText(
      "Search by brand, producer, or region...",
    );
    await user.type(input, "山");
    expect(setSearchQuery).toHaveBeenCalledWith({ search: "山" });
  });

  it("calls setSearchQuery on brand select change", async () => {
    const setSearchQuery = vi.fn();
    const user = userEvent.setup();
    render(
      <RiceCatalogComponent {...baseFacade} setSearchQuery={setSearchQuery} />,
    );

    const brandSelect = screen.getByLabelText("Brand filter");
    await user.selectOptions(brandSelect, "コシヒカリ");
    expect(setSearchQuery).toHaveBeenCalledWith({ brand: "コシヒカリ" });
  });

  it("keeps selected filter value visible in select-box when not in options", () => {
    render(
      <RiceCatalogComponent
        {...baseFacade}
        params={{ brand: "コシヒカリ" }}
        filters={{
          brands: ["ななつぼし", "ゆめぴりか"],
          producers: ["JA北海道"],
          regions: ["北海道"],
        }}
      />,
    );

    const brandSelect = screen.getByLabelText("Brand filter");
    expect(brandSelect).toHaveValue("コシヒカリ");
    const brandOptions = within(brandSelect)
      .getAllByRole("option")
      .map((o) => o.textContent);
    expect(brandOptions).toContain("コシヒカリ");
    expect(brandOptions).toContain("ななつぼし");
    expect(brandOptions).toContain("ゆめぴりか");
  });

  it("calls setSearchQuery with all current params on change", async () => {
    const setSearchQuery = vi.fn();
    const user = userEvent.setup();
    render(
      <RiceCatalogComponent
        {...baseFacade}
        params={{ search: "コシ", brand: "コシヒカリ" }}
        setSearchQuery={setSearchQuery}
      />,
    );

    await user.selectOptions(screen.getByLabelText("Region filter"), "新潟県");
    expect(setSearchQuery).toHaveBeenLastCalledWith({
      search: "コシ",
      brand: "コシヒカリ",
      region: "新潟県",
    });
  });
});
