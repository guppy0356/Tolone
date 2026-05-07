import { type Dispatch, type SetStateAction, useCallback, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  pizzaOrderApi,
  type CrustId,
  type PizzaOrderInput,
  type SizeId,
  type ToppingId,
} from "./PizzaOrder.api";

export interface PizzaOrderFacade {
  crust: CrustId | null;
  size: SizeId | null;
  mode: "whole" | "half";
  leftToppings: ToppingId[];
  rightToppings: ToppingId[];
  setCrust: (c: CrustId | null) => void;
  setSize: (s: SizeId | null) => void;
  setMode: (m: "whole" | "half") => void;
  setLeftToppings: Dispatch<SetStateAction<ToppingId[]>>;
  setRightToppings: Dispatch<SetStateAction<ToppingId[]>>;
  isSubmitting: boolean;
  submitOrder: (input: PizzaOrderInput) => Promise<void>;
}

export function usePizzaOrderFacade(): PizzaOrderFacade {
  const [crust, setCrust] = useState<CrustId | null>(null);
  const [size, setSize] = useState<SizeId | null>(null);
  const [mode, setMode] = useState<"whole" | "half">("whole");
  const [leftToppings, setLeftToppings] = useState<ToppingId[]>([]);
  const [rightToppings, setRightToppings] = useState<ToppingId[]>([]);

  const mutation = useMutation({
    mutationFn: (input: PizzaOrderInput) => pizzaOrderApi.submit(input),
  });

  const submitOrder = useCallback(
    async (input: PizzaOrderInput) => {
      await mutation.mutateAsync(input);
    },
    [mutation],
  );

  return {
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
    isSubmitting: mutation.isPending,
    submitOrder,
  };
}
