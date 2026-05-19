import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { PizzaOrderComponent } from "./PizzaOrder.component";
import type { PizzaOrderFacade } from "./PizzaOrder.facade";

const baseArgs: PizzaOrderFacade = {
  crust: null,
  size: null,
  selection: { mode: "whole", toppings: [] },
  setCrust: fn(),
  setSize: fn(),
  setSelection: fn(),
  isSubmitting: false,
  submitOrder: fn(),
  lastConfirmation: null,
};

const meta = {
  title: "features/PizzaOrder",
  component: PizzaOrderComponent,
  args: baseArgs,
} satisfies Meta<typeof PizzaOrderComponent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Hand-Tossed")).toBeInTheDocument();
    await expect(canvas.getByText("Pan")).toBeInTheDocument();
    await expect(canvas.getByText("Thin & Crispy")).toBeInTheDocument();
    await expect(canvas.getByText("Stuffed Crust")).toBeInTheDocument();
    await expect(canvas.getByText("Medium")).toBeInTheDocument();
    await expect(canvas.getByText("Large")).toBeInTheDocument();
    await expect(canvas.getByText("Pepperoni")).toBeInTheDocument();
    await expect(canvas.getByText("Mushroom")).toBeInTheDocument();
  },
};

export const PlaceOrderDisabledByDefault: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("button", { name: "Place Order" }),
    ).toBeDisabled();
  },
};

export const PlaceOrderDisabledWithoutToppings: Story = {
  args: { crust: "hand-tossed", size: "medium" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("button", { name: "Place Order" }),
    ).toBeDisabled();
  },
};

export const PlaceOrderEnabledWhenAllSelected: Story = {
  args: {
    crust: "hand-tossed",
    size: "medium",
    selection: { mode: "whole", toppings: ["pepperoni"] },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("button", { name: "Place Order" }),
    ).not.toBeDisabled();
  },
};

export const SelectsCrust: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText("Hand-Tossed"));
    await expect(args.setCrust).toHaveBeenCalledWith("hand-tossed");
  },
};

export const SelectsSize: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText("Medium"));
    await expect(args.setSize).toHaveBeenCalledWith("medium");
  },
};

export const TogglesTopping: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByLabelText("Pepperoni"));
    await expect(args.setSelection).toHaveBeenCalled();
  },
};

export const MeatLoversDiscount: Story = {
  args: {
    crust: "hand-tossed",
    size: "medium",
    selection: {
      mode: "whole",
      toppings: ["pepperoni", "sausage", "bacon"],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText("Meat Lovers applied (−$1.00)"),
    ).toBeInTheDocument();
  },
};

export const HalfAndHalfPanels: Story = {
  args: {
    selection: { mode: "half", left: [], right: [] },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Left Half")).toBeInTheDocument();
    await expect(canvas.getByText("Right Half")).toBeInTheDocument();
  },
};

export const SubmittingOverlay: Story = {
  args: { isSubmitting: true },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstChild).toHaveClass("opacity-50");
  },
};

export const ThinCrispyDisabledForLarge: Story = {
  args: { size: "large" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("button", { name: /Thin & Crispy/i }),
    ).toBeDisabled();
  },
};

export const LargeDisabledForThinCrispy: Story = {
  args: { crust: "thin-crispy" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("button", { name: /Large/i }),
    ).toBeDisabled();
  },
};

export const PriceSummary: Story = {
  args: {
    crust: "hand-tossed",
    size: "medium",
    selection: { mode: "whole", toppings: ["pepperoni"] },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("$16.50")).toBeInTheDocument();
  },
};

export const SuccessBanner: Story = {
  args: {
    lastConfirmation: { orderId: "abc-123", totalPrice: 16.5 },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Order placed!")).toBeInTheDocument();
    await expect(canvas.getByText("abc-123")).toBeInTheDocument();
    await expect(canvas.getByText("Total: $16.50")).toBeInTheDocument();
  },
};

export const PriceStuffedLargeMeatLovers: Story = {
  args: {
    crust: "stuffed",
    size: "large",
    selection: {
      mode: "whole",
      toppings: ["pepperoni", "sausage", "bacon"],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("$25.50")).toBeInTheDocument();
    await expect(
      canvas.getByText("Meat Lovers applied (−$1.00)"),
    ).toBeInTheDocument();
  },
};

export const PricePanLargeHalfMeatLovers: Story = {
  args: {
    crust: "pan",
    size: "large",
    selection: {
      mode: "half",
      left: ["pepperoni", "sausage", "ham"],
      right: ["mushroom", "onion"],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("$22.75")).toBeInTheDocument();
  },
};

export const PriceHandTossedLargeBothMeatLovers: Story = {
  args: {
    crust: "hand-tossed",
    size: "large",
    selection: {
      mode: "half",
      left: ["pepperoni", "sausage", "bacon", "mushroom", "onion"],
      right: ["chicken", "ham", "pepperoni", "green-pepper", "black-olive"],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("$25.50")).toBeInTheDocument();
  },
};

export const PriceThinCrispyMediumHalfVeggie: Story = {
  args: {
    crust: "thin-crispy",
    size: "medium",
    selection: {
      mode: "half",
      left: ["extra-cheese"],
      right: ["mushroom", "onion", "green-pepper", "black-olive", "jalapeno"],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("$19.50")).toBeInTheDocument();
  },
};

export const ToggleModeResetsToppings: Story = {
  args: {
    selection: { mode: "whole", toppings: ["pepperoni"] },
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText("Switch to Half & Half"));
    await expect(args.setSelection).toHaveBeenCalled();
    const setSelectionMock = args.setSelection as ReturnType<typeof fn>;
    const updater = setSelectionMock.mock.calls[0][0] as (
      prev: PizzaOrderFacade["selection"],
    ) => PizzaOrderFacade["selection"];
    const next = updater({ mode: "whole", toppings: ["pepperoni"] });
    await expect(next).toEqual({ mode: "half", left: [], right: [] });
  },
};
