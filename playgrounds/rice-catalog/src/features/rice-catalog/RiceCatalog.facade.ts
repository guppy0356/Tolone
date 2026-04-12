import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { riceCatalogApi, type Rice } from "./RiceCatalog.api";

export interface RiceCatalogFacade {
  rices: Rice[];
  isPending: boolean;
  isFetching: boolean;
}

const riceKeys = {
  all: ["rices"] as const,
};

export function useRiceCatalogFacade(): RiceCatalogFacade {
  const { data, isPending, isFetching } = useQuery({
    queryKey: riceKeys.all,
    queryFn: riceCatalogApi.getAll,
    placeholderData: keepPreviousData,
  });

  return {
    rices: data ?? [],
    isPending,
    isFetching,
  };
}
