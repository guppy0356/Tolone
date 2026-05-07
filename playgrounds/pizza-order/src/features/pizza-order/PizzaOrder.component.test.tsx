import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { PizzaOrderComponent } from "./PizzaOrder.component";
import type { PizzaOrderFacade } from "./PizzaOrder.facade";

const baseFacade: PizzaOrderFacade = {
  crust: null,
  size: null,
  mode: "whole",
  leftToppings: [],
  rightToppings: [],
  setCrust: vi.fn(),
  setSize: vi.fn(),
  setMode: vi.fn(),
  setLeftToppings: vi.fn(),
  setRightToppings: vi.fn(),
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

  it("submit button is disabled when size is selected but no toppings", () => {
    render(<PizzaOrderComponent {...baseFacade} crust="hand-tossed" size="medium" />);
    expect(screen.getByRole("button", { name: "Place Order" })).toBeDisabled();
  });

  it("submit button is enabled when crust, size, and toppings are selected", () => {
    render(
      <PizzaOrderComponent
        {...baseFacade}
        crust="hand-tossed"
        size="medium"
        leftToppings={["pepperoni"]}
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

  it("calls setLeftToppings when a topping checkbox is toggled", async () => {
    const setLeftToppings = vi.fn();
    const user = userEvent.setup();
    render(<PizzaOrderComponent {...baseFacade} setLeftToppings={setLeftToppings} />);
    await user.click(screen.getByLabelText("Pepperoni"));
    expect(setLeftToppings).toHaveBeenCalled();
  });

  it("shows Meat Lovers discount label when 3+ meat toppings selected (whole mode)", () => {
    render(
      <PizzaOrderComponent
        {...baseFacade}
        crust="hand-tossed"
        size="medium"
        leftToppings={["pepperoni", "sausage", "bacon"]}
      />,
    );
    expect(screen.getByText("Meat Lovers applied (−$1.00)")).toBeInTheDocument();
  });

  it("shows Half & Half panels when mode is half", () => {
    render(<PizzaOrderComponent {...baseFacade} mode="half" />);
    expect(screen.getByText("Left Half")).toBeInTheDocument();
    expect(screen.getByText("Right Half")).toBeInTheDocument();
  });

  it("apply to whole calls setMode with whole", async () => {
    const setMode = vi.fn();
    const user = userEvent.setup();
    render(<PizzaOrderComponent {...baseFacade} mode="half" setMode={setMode} />);
    await user.click(screen.getByText("Apply to Whole Pizza"));
    expect(setMode).toHaveBeenCalledWith("whole");
  });

  it("shows opacity-50 overlay when isSubmitting", () => {
    const { container } = render(
      <PizzaOrderComponent {...baseFacade} isSubmitting={true} />,
    );
    expect(container.firstChild).toHaveClass("opacity-50");
  });

  it("Thin & Crispy is disabled when Large is selected", () => {
    render(<PizzaOrderComponent {...baseFacade} size="large" />);
    const thinCrispy = screen.getByRole("button", { name: /Thin & Crispy/i });
    expect(thinCrispy).toBeDisabled();
  });

  it("Large is disabled when Thin & Crispy is selected", () => {
    render(<PizzaOrderComponent {...baseFacade} crust="thin-crispy" />);
    const large = screen.getByRole("button", { name: /Large/i });
    expect(large).toBeDisabled();
  });

  it("shows price summary", () => {
    render(
      <PizzaOrderComponent
        {...baseFacade}
        crust="hand-tossed"
        size="medium"
        leftToppings={["pepperoni"]}
      />,
    );
    expect(screen.getByText("$16.50")).toBeInTheDocument();
  });
});
