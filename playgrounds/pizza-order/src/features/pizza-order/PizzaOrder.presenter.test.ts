import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { usePizzaOrderPresenter } from "./PizzaOrder.presenter";
import type { PizzaOrderPresenterProps } from "./PizzaOrder.presenter";

const baseProps: PizzaOrderPresenterProps = {
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
  submitOrder: vi.fn(),
};

describe("usePizzaOrderPresenter — price calculation", () => {
  it("case 1: Hand-Tossed, Medium, Whole, Pepperoni → $16.50", () => {
    const { result } = renderHook(() =>
      usePizzaOrderPresenter({
        ...baseProps,
        crust: "hand-tossed",
        size: "medium",
        mode: "whole",
        leftToppings: ["pepperoni"],
      }),
    );
    expect(result.current.totalPrice).toBe("$16.50");
    expect(result.current.leftDiscountLabel).toBeNull();
    expect(result.current.rightDiscountLabel).toBeNull();
  });

  it("case 2: Stuffed Crust, Large, Whole, Pepperoni+Sausage+Bacon → $25.50 with Meat Lovers", () => {
    const { result } = renderHook(() =>
      usePizzaOrderPresenter({
        ...baseProps,
        crust: "stuffed",
        size: "large",
        mode: "whole",
        leftToppings: ["pepperoni", "sausage", "bacon"],
      }),
    );
    expect(result.current.totalPrice).toBe("$25.50");
    expect(result.current.leftDiscountLabel).toBe("Meat Lovers applied (−$1.00)");
    expect(result.current.rightDiscountLabel).toBeNull();
  });

  it("case 3: Pan, Large, Half&Half — Left Meat Lovers, Right 2 veggies → $22.75", () => {
    const { result } = renderHook(() =>
      usePizzaOrderPresenter({
        ...baseProps,
        crust: "pan",
        size: "large",
        mode: "half",
        leftToppings: ["pepperoni", "sausage", "ham"],
        rightToppings: ["mushroom", "onion"],
      }),
    );
    expect(result.current.totalPrice).toBe("$22.75");
    expect(result.current.leftDiscountLabel).toBe("Meat Lovers applied (−$1.00)");
    expect(result.current.rightDiscountLabel).toBeNull();
  });

  it("case 4: Hand-Tossed, Large, Half&Half — both sides Meat Lovers → $25.50", () => {
    const { result } = renderHook(() =>
      usePizzaOrderPresenter({
        ...baseProps,
        crust: "hand-tossed",
        size: "large",
        mode: "half",
        leftToppings: ["pepperoni", "sausage", "bacon", "mushroom", "onion"],
        rightToppings: ["chicken", "ham", "pepperoni", "green-pepper", "black-olive"],
      }),
    );
    expect(result.current.totalPrice).toBe("$25.50");
    expect(result.current.leftDiscountLabel).toBe("Meat Lovers applied (−$1.00)");
    expect(result.current.rightDiscountLabel).toBe("Meat Lovers applied (−$1.00)");
  });

  it("case 5: Thin&Crispy, Medium, Half&Half — Left 1 veggie, Right 5 veggies → $19.50", () => {
    const { result } = renderHook(() =>
      usePizzaOrderPresenter({
        ...baseProps,
        crust: "thin-crispy",
        size: "medium",
        mode: "half",
        leftToppings: ["extra-cheese"],
        rightToppings: ["mushroom", "onion", "green-pepper", "black-olive", "jalapeno"],
      }),
    );
    expect(result.current.totalPrice).toBe("$19.50");
    expect(result.current.leftDiscountLabel).toBeNull();
    expect(result.current.rightDiscountLabel).toBeNull();
  });
});
