import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { RiceCatalogComponent } from "./RiceCatalog.component";
import type { RiceCatalogFacade } from "./RiceCatalog.facade";

const sampleRices = [
  { id: "1", brand: "コシヒカリ", producer: "魚沼農協", region: "新潟県" },
  { id: "2", brand: "コシヒカリ", producer: "丹後農協", region: "京都府" },
  { id: "3", brand: "あきたこまち", producer: "大潟村農協", region: "秋田県" },
  { id: "4", brand: "ひとめぼれ", producer: "JA仙台", region: "宮城県" },
];

const sampleFilters: RiceCatalogFacade["filters"] = {
  brands: ["あきたこまち", "コシヒカリ", "ひとめぼれ"],
  producers: ["JA仙台", "大潟村農協", "丹後農協", "魚沼農協"],
  regions: ["京都府", "宮城県", "新潟県", "秋田県"],
  totalBrands: 3,
  totalProducers: 4,
  totalRegions: 4,
};

const meta = {
  title: "features/RiceCatalog",
  component: RiceCatalogComponent,
  args: {
    rices: sampleRices,
    filters: sampleFilters,
    isPending: false,
    isFetching: false,
    params: {},
    setSearchQuery: fn(),
  },
} satisfies Meta<typeof RiceCatalogComponent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tbody = canvas.getAllByRole("rowgroup")[1];
    const rows = within(tbody).getAllByRole("row");
    await expect(rows).toHaveLength(4);
    await expect(within(tbody).getByText("魚沼農協")).toBeInTheDocument();
    await expect(within(tbody).getByText("丹後農協")).toBeInTheDocument();
    await expect(within(tbody).getByText("大潟村農協")).toBeInTheDocument();
    await expect(within(tbody).getByText("JA仙台")).toBeInTheDocument();
  },
};

export const Empty: Story = {
  args: {
    rices: [],
    filters: {
      brands: [],
      producers: [],
      regions: [],
      totalBrands: 0,
      totalProducers: 0,
      totalRegions: 0,
    },
  },
};

export const Skeleton: Story = {
  args: { isPending: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByLabelText("Loading rice catalog"),
    ).toBeInTheDocument();
    await expect(canvas.queryByText("Rice Catalog")).not.toBeInTheDocument();
  },
};

export const FetchingOpacity: Story = {
  args: { isFetching: true },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toHaveClass("opacity-50");
  },
};

export const RendersFilterOptions: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const brandSelect = canvas.getByLabelText("Brand filter");
    const brandOptions = within(brandSelect)
      .getAllByRole("option")
      .map((o) => o.textContent);
    await expect(brandOptions).toEqual([
      "Brand",
      "あきたこまち",
      "コシヒカリ",
      "ひとめぼれ",
    ]);

    const regionSelect = canvas.getByLabelText("Region filter");
    const regionOptions = within(regionSelect)
      .getAllByRole("option")
      .map((o) => o.textContent);
    await expect(regionOptions).toEqual([
      "Region",
      "京都府",
      "宮城県",
      "新潟県",
      "秋田県",
    ]);
  },
};

export const DebouncedSearch: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText(
      "Search by brand, producer, or region...",
    );
    await userEvent.type(input, "山");
    await expect(args.setSearchQuery).not.toHaveBeenCalled();
    await new Promise((resolve) => setTimeout(resolve, 350));
    await expect(args.setSearchQuery).toHaveBeenCalledWith({ search: "山" });
  },
};

export const SelectBrandFilter: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const brandSelect = canvas.getByLabelText("Brand filter");
    await userEvent.selectOptions(brandSelect, "コシヒカリ");
    await expect(args.setSearchQuery).toHaveBeenCalledWith({
      brand: "コシヒカリ",
    });
  },
};

export const KeepsSelectedFilterWhenNotInOptions: Story = {
  args: {
    params: { brand: "コシヒカリ" },
    filters: {
      brands: ["ななつぼし", "ゆめぴりか"],
      producers: ["JA北海道"],
      regions: ["北海道"],
      totalBrands: 3,
      totalProducers: 4,
      totalRegions: 4,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const brandSelect = canvas.getByLabelText("Brand filter");
    await expect(brandSelect).toHaveValue("コシヒカリ");
    const brandOptions = within(brandSelect)
      .getAllByRole("option")
      .map((o) => o.textContent);
    await expect(brandOptions).toContain("コシヒカリ");
    await expect(brandOptions).toContain("ななつぼし");
    await expect(brandOptions).toContain("ゆめぴりか");
  },
};

export const FilterLabelShowsCountWhenFiltered: Story = {
  args: {
    filters: {
      brands: ["ななつぼし", "ゆめぴりか"],
      producers: ["JA北海道"],
      regions: ["北海道"],
      totalBrands: 3,
      totalProducers: 4,
      totalRegions: 4,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const brandDefault = within(canvas.getByLabelText("Brand filter"))
      .getAllByRole("option")[0];
    await expect(brandDefault).toHaveTextContent("Brand (2)");

    const producerDefault = within(canvas.getByLabelText("Producer filter"))
      .getAllByRole("option")[0];
    await expect(producerDefault).toHaveTextContent("Producer (1)");

    const regionDefault = within(canvas.getByLabelText("Region filter"))
      .getAllByRole("option")[0];
    await expect(regionDefault).toHaveTextContent("Region (1)");
  },
};

export const PlainLabelWhenAllOptionsAvailable: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const brandDefault = within(canvas.getByLabelText("Brand filter"))
      .getAllByRole("option")[0];
    await expect(brandDefault).toHaveTextContent("Brand");
    await expect(brandDefault).not.toHaveTextContent("Brand (");
  },
};

export const SetSearchQueryMergesCurrentParams: Story = {
  args: {
    params: { search: "コシ", brand: "コシヒカリ" },
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.selectOptions(canvas.getByLabelText("Region filter"), "新潟県");
    await expect(args.setSearchQuery).toHaveBeenLastCalledWith({
      search: "コシ",
      brand: "コシヒカリ",
      region: "新潟県",
    });
  },
};
