import { useCallback } from "react";
import {
  useQuery,
  useMutation,
  keepPreviousData,
} from "@tanstack/react-query";
import { sidebarApi, type BookSummary } from "./Sidebar.api";
import { clearAuthCookie } from "../../lib/auth-cookie";

export interface SidebarFacade {
  books: BookSummary[];
  isPending: boolean;
  isFetching: boolean;
  logout: () => Promise<void>;
}

const sidebarKeys = {
  books: ["books"] as const,
};

export function useSidebarFacade(): SidebarFacade {
  const { data, isPending, isFetching } = useQuery({
    queryKey: sidebarKeys.books,
    queryFn: sidebarApi.getBooks,
    placeholderData: keepPreviousData,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      clearAuthCookie();
    },
  });

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation.mutateAsync]);

  return {
    books: data ?? [],
    isPending,
    isFetching,
    logout,
  };
}
