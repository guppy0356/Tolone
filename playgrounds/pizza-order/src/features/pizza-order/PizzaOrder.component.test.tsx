import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { PizzaOrderComponent } from "./PizzaOrder.component";
import type { PizzaOrderFacade } from "./PizzaOrder.facade";

const baseFacade: PizzaOrderFacade = {
  crust: null,
  size: null,
  selection: { mode: "whole", toppings: [] },
  setCrust: vi.fn(),
  setSize: vi.fn(),
  setSelection: vi.fn(),
  isSubmitting: false,
  submitOrder: vi.fn(),
};

describe("PizzaOrderComponent", () => {
  it("renders crust options", () => {
    render(<PizzaOrderComponent {...baseFacade} />);
    expect(screen.getByText("Hand-Tossed")).toBeInTheDocument();
    expect(screen.getByText("Pan")).toBeInTheDocument();
    expect(screen.getByText("Thin & Crispy")).toBeInTheDocument();
    expect(screen.getByText("Stuffed Crust")).toBeInTheDocument();
  });

  it("renders size options", () => {
    render(<PizzaOrderComponent {...baseFacade} />);
    expect(screen.getByText("Medium")).toBeInTheDocument();
    expect(screen.getByText("Large")).toBeInTheDocument();
  });

  it("renders topping options", () => {
    render(<PizzaOrderComponent {...baseFacade} />);
    expect(screen.getByText("Pepperoni")).toBeInTheDocument();
    expect(screen.getByText("Mushroom")).toBeInTheDocument();
  });

  it("submit button is disabled when crust and size not selected", () => {
    render(<PizzaOrderComponent {...baseFacade} />);
    expect(screen.getByRole("button", { name: "Place Order" })).toBeDisabled();
  });

  it("submit button is disabled when crust and size selected but no toppings", () => {
    render(<PizzaOrderComponent {...baseFacade} crust="hand-tossed" size="medium" />);
    expect(screen.getByRole("button", { name: "Place Order" })).toBeDisabled();
  });

  it("submit button is enabled when crust, size, and toppings are selected", () => {
    render(
      <PizzaOrderComponent
        {...baseFacade}
        crust="hand-tossed"
        size="medium"
        selection={{ mode: "whole", toppings: ["pepperoni"] }}
      />,
    );
    expect(screen.getByRole("button", { name: "Place Order" })).not.toBeDisabled();
  });

  it("calls setCrust when a crust button is clicked", async () => {
    const setCrust = vi.fn();
    const user = userEvent.setup();
    render(<PizzaOrderComponent {...baseFacade} setCrust={setCrust} />);
    await user.click(screen.getByText("Hand-Tossed"));
    expect(setCrust).toHaveBeenCalledWith("hand-tossed");
  });

  it("calls setSize when a size button is clicked", async () => {
    const setSize = vi.fn();
    const user = userEvent.setup();
    render(<PizzaOrderComponent {...baseFacade} setSize={setSize} />);
    await user.click(screen.getByText("Medium"));
    expect(setSize).toHaveBeenCalledWith("medium");
  });

  it("calls setSelection when a topping checkbox is toggled", async () => {
    const setSelection = vi.fn();
    const user = userEvent.setup();
    render(<PizzaOrderComponent {...baseFacade} setSelection={setSelection} />);
    await user.click(screen.getByLabelText("Pepperoni"));
    expect(setSelection).toHaveBeenCalled();
  });

  it("shows Meat Lovers discount label when 3+ meat toppings selected (whole mode)", () => {
    render(
      <PizzaOrderComponent
        {...baseFacade}
        crust="hand-tossed"
        size="medium"
        selection={{ mode: "whole", toppings: ["pepperoni", "sausage", "bacon"] }}
      />,
    );
    expect(screen.getByText("Meat Lovers applied (−$1.00)")).toBeInTheDocument();
  });

  it("shows Half & Half panels when mode is half", () => {
    render(
      <PizzaOrderComponent
        {...baseFacade}
        selection={{ mode: "half", left: [], right: [] }}
      />,
    );
    expect(screen.getByText("Left Half")).toBeInTheDocument();
    expect(screen.getByText("Right Half")).toBeInTheDocument();
  });

  it("shows opacity-50 overlay when isSubmitting", () => {
    const { container } = render(
      <PizzaOrderComponent {...baseFacade} isSubmitting={true} />,
    );
    expect(container.firstChild).toHaveClass("opacity-50");
  });

  it("Thin & Crispy is disabled when Large is selected", () => {
    render(<PizzaOrderComponent {...baseFacade} size="large" />);
    expect(screen.getByRole("button", { name: /Thin & Crispy/i })).toBeDisabled();
  });

  it("Large is disabled when Thin & Crispy is selected", () => {
    render(<PizzaOrderComponent {...baseFacade} crust="thin-crispy" />);
    expect(screen.getByRole("button", { name: /Large/i })).toBeDisabled();
  });

  it("shows price summary", () => {
    render(
      <PizzaOrderComponent
        {...baseFacade}
        crust="hand-tossed"
        size="medium"
        selection={{ mode: "whole", toppings: ["pepperoni"] }}
      />,
    );
    expect(screen.getByText("$16.50")).toBeInTheDocument();
  });

  it("toggle mode resets toppings", async () => {
    const setSelection = vi.fn();
    const user = userEvent.setup();
    render(
      <PizzaOrderComponent
        {...baseFacade}
        selection={{ mode: "whole", toppings: ["pepperoni"] }}
        setSelection={setSelection}
      />,
    );
    await user.click(screen.getByText("Switch to Half & Half"));
    expect(setSelection).toHaveBeenCalled();
    const updater = setSelection.mock.calls[0][0];
    const next = updater({ mode: "whole", toppings: ["pepperoni"] });
    expect(next).toEqual({ mode: "half", left: [], right: [] });
  });
});
