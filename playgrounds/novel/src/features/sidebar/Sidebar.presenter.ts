import { useCallback, useMemo } from "react";
import type { BookSummary } from "./Sidebar.api";

export interface SidebarPresenterProps {
  books: BookSummary[];
  currentBookId: string | undefined;
  logout: () => Promise<void>;
}

export interface SidebarBookItem {
  id: string;
  title: string;
  author: string;
  isCurrent: boolean;
}

export interface SidebarPresenter {
  bookItems: SidebarBookItem[];
  handleLogout: () => Promise<void>;
}

export function useSidebarPresenter({
  books,
  currentBookId,
  logout,
}: SidebarPresenterProps): SidebarPresenter {
  const bookItems = useMemo(
    () =>
      books.map((b) => ({
        id: b.id,
        title: b.title,
        author: b.author,
        isCurrent: b.id === currentBookId,
      })),
    [books, currentBookId],
  );

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch {
      // swallow
    }
  }, [logout]);

  return {
    bookItems,
    handleLogout,
  };
}
