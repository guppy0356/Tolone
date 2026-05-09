import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { orderHistoryApi, type PizzaOrderRecord } from "./OrderHistory.api";

export interface OrderHistoryFacade {
  orders: PizzaOrderRecord[];
  isPending: boolean;
  isFetching: boolean;
}

const orderHistoryKeys = {
  all: ["orders"] as const,
};

export function useOrderHistoryFacade(): OrderHistoryFacade {
  const { data, isPending, isFetching } = useQuery({
    queryKey: orderHistoryKeys.all,
    queryFn: orderHistoryApi.getAll,
    placeholderData: keepPreviousData,
  });

  return {
    orders: data ?? [],
    isPending,
    isFetching,
  };
}
