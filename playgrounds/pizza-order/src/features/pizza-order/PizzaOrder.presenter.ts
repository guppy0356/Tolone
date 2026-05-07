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
  wholeToppingCount: string;
  leftToppingCount: string;
  rightToppingCount: string;
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
  selection,
  setCrust,
  setSize,
  setSelection,
  submitOrder,
}: PizzaOrderPresenterProps): PizzaOrderPresenter {
  const basePrice = size === "medium" ? 15.0 : size === "large" ? 20.0 : 0.0;
  const crustPremium = crust === "stuffed" ? 2.0 : 0.0;

  const wholeToppings = selection.mode === "whole" ? selection.toppings : [];
  const leftToppings = selection.mode === "half" ? selection.left : [];
  const rightToppings = selection.mode === "half" ? selection.right : [];

  const wholeMeatCount = calcMeatCount(wholeToppings);
  const leftMeatCount = calcMeatCount(leftToppings);
  const rightMeatCount = calcMeatCount(rightToppings);

  const totalPrice =
    selection.mode === "whole"
      ? basePrice + crustPremium + calcSidePrice(wholeToppings, 1.5)
      : basePrice +
        crustPremium +
        calcSidePrice(leftToppings, 0.75) +
        calcSidePrice(rightToppings, 0.75);

  const leftDiscountLabel =
    (selection.mode === "whole" ? wholeMeatCount : leftMeatCount) >= 3
      ? "Meat Lovers applied (−$1.00)"
      : null;
  const rightDiscountLabel =
    selection.mode === "half" && rightMeatCount >= 3
      ? "Meat Lovers applied (−$1.00)"
      : null;

  const isSubmitDisabled =
    !crust ||
    !size ||
    (selection.mode === "whole"
      ? selection.toppings.length === 0
      : selection.left.length === 0 || selection.right.length === 0);

  const crustOptions: CrustOptionVM[] = CRUST_META.map((c) => ({
    ...c,
    isDisabled: c.id === "thin-crispy" && size === "large",
  }));

  const sizeOptions: SizeOptionVM[] = SIZE_META.map((s) => ({
    ...s,
    isDisabled: s.id === "large" && crust === "thin-crispy",
  }));

  const wholeToppingOptions = buildToppingOptions(wholeToppings, wholeToppings.length, wholeMeatCount);
  const leftToppingOptions = buildToppingOptions(leftToppings, leftToppings.length, leftMeatCount);
  const rightToppingOptions = buildToppingOptions(rightToppings, rightToppings.length, rightMeatCount);

  const handleSelectCrust = useCallback(
    (id: CrustId) => {
      setCrust(id);
      if (id === "thin-crispy" && size === "large") setSize(null);
    },
    [setCrust, setSize, size],
  );

  const handleSelectSize = useCallback(
    (id: SizeId) => {
      setSize(id);
      if (id === "large" && crust === "thin-crispy") setCrust(null);
    },
    [setSize, setCrust, crust],
  );

  const handleToggleMode = useCallback(() => {
    setSelection((prev) =>
      prev.mode === "whole"
        ? { mode: "half", left: [], right: [] }
        : { mode: "whole", toppings: [] },
    );
  }, [setSelection]);

  const handleToggleWholeTopping = useCallback(
    (id: ToppingId) => {
      setSelection((prev) => {
        if (prev.mode !== "whole") return prev;
        const toppings = prev.toppings.includes(id)
          ? prev.toppings.filter((t) => t !== id)
          : [...prev.toppings, id];
        return { mode: "whole", toppings };
      });
    },
    [setSelection],
  );

  const handleToggleLeftTopping = useCallback(
    (id: ToppingId) => {
      setSelection((prev) => {
        if (prev.mode !== "half") return prev;
        const left = prev.left.includes(id)
          ? prev.left.filter((t) => t !== id)
          : [...prev.left, id];
        return { ...prev, left };
      });
    },
    [setSelection],
  );

  const handleToggleRightTopping = useCallback(
    (id: ToppingId) => {
      setSelection((prev) => {
        if (prev.mode !== "half") return prev;
        const right = prev.right.includes(id)
          ? prev.right.filter((t) => t !== id)
          : [...prev.right, id];
        return { ...prev, right };
      });
    },
    [setSelection],
  );

  const handleSubmit = useCallback(async () => {
    if (!crust || !size) return;
    const input: PizzaOrderInput =
      selection.mode === "whole"
        ? { crust, size, mode: "whole", toppings: selection.toppings }
        : { crust, size, mode: "half", leftToppings: selection.left, rightToppings: selection.right };
    await submitOrder(input);
  }, [crust, size, selection, submitOrder]);

  return {
    totalPrice: formatPrice(totalPrice),
    wholeToppingCount: `${wholeToppings.length} / 5`,
    leftToppingCount: `${leftToppings.length} / 5`,
    rightToppingCount: `${rightToppings.length} / 5`,
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
    handleSubmit,
  };
}
