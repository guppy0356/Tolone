import { type Dispatch, type SetStateAction, useCallback, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  pizzaOrderApi,
  type CrustId,
  type PizzaOrderConfirmation,
  type PizzaOrderInput,
  type SizeId,
  type ToppingId,
} from "./PizzaOrder.api";

export type ToppingSelection =
  | { mode: "whole"; toppings: ToppingId[] }
  | { mode: "half"; left: ToppingId[]; right: ToppingId[] };

export interface PizzaOrderFacade {
  crust: CrustId | null;
  size: SizeId | null;
  selection: ToppingSelection;
  setCrust: (c: CrustId | null) => void;
  setSize: (s: SizeId | null) => void;
  setSelection: Dispatch<SetStateAction<ToppingSelection>>;
  isSubmitting: boolean;
  submitOrder: (input: PizzaOrderInput) => Promise<void>;
  lastConfirmation: PizzaOrderConfirmation | null;
}

export function usePizzaOrderFacade(): PizzaOrderFacade {
  const queryClient = useQueryClient();
  const [crust, setCrust] = useState<CrustId | null>(null);
  const [size, setSize] = useState<SizeId | null>(null);
  const [selection, setSelection] = useState<ToppingSelection>({
    mode: "whole",
    toppings: [],
  });

  const mutation = useMutation({
    mutationFn: (input: PizzaOrderInput) => pizzaOrderApi.submit(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setCrust(null);
      setSize(null);
      setSelection({ mode: "whole", toppings: [] });
    },
  });

  const submitOrder = useCallback(
    async (input: PizzaOrderInput) => {
      await mutation.mutateAsync(input);
    },
    [mutation.mutateAsync],
  );

  return {
    crust,
    size,
    selection,
    setCrust,
    setSize,
    setSelection,
    isSubmitting: mutation.isPending,
    submitOrder,
    lastConfirmation: mutation.data ?? null,
  };
}
