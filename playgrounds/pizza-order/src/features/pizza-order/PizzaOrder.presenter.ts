import { useCallback } from "react";
import {
  MEAT_TOPPINGS,
  type CrustId,
  type PizzaOrderInput,
  type SizeId,
  type ToppingId,
} from "./PizzaOrder.api";
import type { PizzaOrderFacade } from "./PizzaOrder.facade";

export type PizzaOrderPresenterProps = Omit<PizzaOrderFacade, "isSubmitting">;

export interface CrustOptionVM {
  id: CrustId;
  label: string;
  priceLabel: string;
  isDisabled: boolean;
}

export interface SizeOptionVM {
  id: SizeId;
  label: string;
  priceLabel: string;
  isDisabled: boolean;
}

export interface ToppingOptionVM {
  id: ToppingId;
  label: string;
  category: "meat" | "veggie";
  isChecked: boolean;
  isDisabled: boolean;
}

export interface PizzaOrderPresenter {
  totalPrice: string;
  leftDiscountLabel: string | null;
  rightDiscountLabel: string | null;
  isSubmitDisabled: boolean;
  crustOptions: CrustOptionVM[];
  sizeOptions: SizeOptionVM[];
  wholeToppingOptions: ToppingOptionVM[];
  leftToppingOptions: ToppingOptionVM[];
  rightToppingOptions: ToppingOptionVM[];
  handleSelectCrust: (id: CrustId) => void;
  handleSelectSize: (id: SizeId) => void;
  handleToggleMode: () => void;
  handleToggleWholeTopping: (id: ToppingId) => void;
  handleToggleLeftTopping: (id: ToppingId) => void;
  handleToggleRightTopping: (id: ToppingId) => void;
  handleCopyToRight: () => void;
  handleApplyToWhole: () => void;
  handleSubmit: () => Promise<void>;
}

const CRUST_META: { id: CrustId; label: string; priceLabel: string }[] = [
  { id: "hand-tossed", label: "Hand-Tossed", priceLabel: "" },
  { id: "pan", label: "Pan", priceLabel: "" },
  { id: "thin-crispy", label: "Thin & Crispy", priceLabel: "" },
  { id: "stuffed", label: "Stuffed Crust", priceLabel: "+$2.00" },
];

const SIZE_META: { id: SizeId; label: string; priceLabel: string }[] = [
  { id: "medium", label: "Medium", priceLabel: "$15.00" },
  { id: "large", label: "Large", priceLabel: "$20.00" },
];

const TOPPING_META: { id: ToppingId; label: string; category: "meat" | "veggie" }[] = [
  { id: "pepperoni", label: "Pepperoni", category: "meat" },
  { id: "sausage", label: "Sausage", category: "meat" },
  { id: "bacon", label: "Bacon", category: "meat" },
  { id: "chicken", label: "Chicken", category: "meat" },
  { id: "ham", label: "Ham", category: "meat" },
  { id: "mushroom", label: "Mushroom", category: "veggie" },
  { id: "onion", label: "Onion", category: "veggie" },
  { id: "green-pepper", label: "Green Pepper", category: "veggie" },
  { id: "black-olive", label: "Black Olive", category: "veggie" },
  { id: "jalapeno", label: "Jalapeño", category: "veggie" },
  { id: "extra-cheese", label: "Extra Cheese", category: "veggie" },
  { id: "pineapple", label: "Pineapple", category: "veggie" },
];

function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function calcMeatCount(toppings: ToppingId[]): number {
  return toppings.filter((t) => MEAT_TOPPINGS.has(t)).length;
}

function calcSidePrice(toppings: ToppingId[], perTopping: number): number {
  const meatCount = calcMeatCount(toppings);
  const discount = meatCount >= 3 ? 1.0 : 0.0;
  return toppings.length * perTopping - discount;
}

function buildToppingOptions(
  toppings: ToppingId[],
  totalCount: number,
  meatCount: number,
): ToppingOptionVM[] {
  return TOPPING_META.map(({ id, label, category }) => {
    const isChecked = toppings.includes(id);
    const isMeat = category === "meat";
    const atTotalLimit = !isChecked && totalCount >= 5;
    const atMeatLimit = !isChecked && isMeat && meatCount >= 3;
    return {
      id,
      label,
      category,
      isChecked,
      isDisabled: atTotalLimit || atMeatLimit,
    };
  });
}

export function usePizzaOrderPresenter({
  crust,
  size,
  mode,
  leftToppings,
  rightToppings,
  setCrust,
  setSize,
  setMode,
  setLeftToppings,
  setRightToppings,
  submitOrder,
}: PizzaOrderPresenterProps): PizzaOrderPresenter {
  const basePrice = size === "medium" ? 15.0 : size === "large" ? 20.0 : 0.0;
  const crustPremium = crust === "stuffed" ? 2.0 : 0.0;

  const leftMeatCount = calcMeatCount(leftToppings);
  const rightMeatCount = calcMeatCount(rightToppings);

  let totalPrice: number;
  if (mode === "whole") {
    totalPrice = basePrice + crustPremium + calcSidePrice(leftToppings, 1.5);
  } else {
    totalPrice =
      basePrice +
      crustPremium +
      calcSidePrice(leftToppings, 0.75) +
      calcSidePrice(rightToppings, 0.75);
  }

  const leftDiscountLabel =
    leftMeatCount >= 3 ? "Meat Lovers applied (−$1.00)" : null;
  const rightDiscountLabel =
    mode === "half" && rightMeatCount >= 3
      ? "Meat Lovers applied (−$1.00)"
      : null;

  const isSubmitDisabled =
    !crust ||
    !size ||
    leftToppings.length === 0 ||
    (mode === "half" && rightToppings.length === 0);

  const crustOptions: CrustOptionVM[] = CRUST_META.map((c) => ({
    ...c,
    isDisabled: c.id === "thin-crispy" && size === "large",
  }));

  const sizeOptions: SizeOptionVM[] = SIZE_META.map((s) => ({
    ...s,
    isDisabled: s.id === "large" && crust === "thin-crispy",
  }));

  const wholeToppingOptions = buildToppingOptions(
    leftToppings,
    leftToppings.length,
    leftMeatCount,
  );

  const leftToppingOptions = buildToppingOptions(
    leftToppings,
    leftToppings.length,
    leftMeatCount,
  );

  const rightToppingOptions = buildToppingOptions(
    rightToppings,
    rightToppings.length,
    rightMeatCount,
  );

  const handleSelectCrust = useCallback(
    (id: CrustId) => {
      setCrust(id);
      if (id === "thin-crispy" && size === "large") {
        setSize(null);
      }
    },
    [setCrust, setSize, size],
  );

  const handleSelectSize = useCallback(
    (id: SizeId) => {
      setSize(id);
      if (id === "large" && crust === "thin-crispy") {
        setCrust(null);
      }
    },
    [setSize, setCrust, crust],
  );

  const handleToggleMode = useCallback(() => {
    setMode(mode === "whole" ? "half" : "whole");
  }, [setMode, mode]);

  const handleToggleWholeTopping = useCallback(
    (id: ToppingId) => {
      setLeftToppings((prev) =>
        prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
      );
    },
    [setLeftToppings],
  );

  const handleToggleLeftTopping = useCallback(
    (id: ToppingId) => {
      setLeftToppings((prev) =>
        prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
      );
    },
    [setLeftToppings],
  );

  const handleToggleRightTopping = useCallback(
    (id: ToppingId) => {
      setRightToppings((prev) =>
        prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
      );
    },
    [setRightToppings],
  );

  const handleCopyToRight = useCallback(() => {
    setRightToppings([...leftToppings]);
  }, [setRightToppings, leftToppings]);

  const handleApplyToWhole = useCallback(() => {
    setMode("whole");
  }, [setMode]);

  const handleSubmit = useCallback(async () => {
    if (!crust || !size) return;
    const input: PizzaOrderInput =
      mode === "whole"
        ? { crust, size, mode, toppings: leftToppings }
        : { crust, size, mode, leftToppings, rightToppings };
    await submitOrder(input);
  }, [crust, size, mode, leftToppings, rightToppings, submitOrder]);

  return {
    totalPrice: formatPrice(totalPrice),
    leftDiscountLabel,
    rightDiscountLabel,
    isSubmitDisabled,
    crustOptions,
    sizeOptions,
    wholeToppingOptions,
    leftToppingOptions,
    rightToppingOptions,
    handleSelectCrust,
    handleSelectSize,
    handleToggleMode,
    handleToggleWholeTopping,
    handleToggleLeftTopping,
    handleToggleRightTopping,
    handleCopyToRight,
    handleApplyToWhole,
    handleSubmit,
  };
}
