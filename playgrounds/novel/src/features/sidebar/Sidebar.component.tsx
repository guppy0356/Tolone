import { memo } from "react";
import { Link } from "@tanstack/react-router";
import { useSidebarPresenter } from "./Sidebar.presenter";
import type { SidebarFacade } from "./Sidebar.facade";

export function SidebarSkeleton() {
  return (
    <aside className="flex min-h-screen w-64 shrink-0 flex-col border-r bg-gray-50 p-4">
      <div className="mb-4 h-5 w-20 animate-pulse rounded bg-gray-200" />
      <ul className="flex-1 space-y-2">
        {Array.from({ length: 3 }, (_, i) => (
          <li
            key={i}
            className="h-12 animate-pulse rounded bg-gray-200"
          />
        ))}
      </ul>
      <div className="mt-4 h-10 animate-pulse rounded border bg-gray-200" />
    </aside>
  );
}

interface SidebarViewProps {
  books: SidebarFacade["books"];
  currentBookId: string | undefined;
  isLoggedIn: boolean;
  logout: SidebarFacade["logout"];
}

const SidebarView = memo(function SidebarView({
  books,
  currentBookId,
  isLoggedIn,
  logout,
}: SidebarViewProps) {
  const { bookItems, handleLogout } = useSidebarPresenter({
    books,
    currentBookId,
    logout,
  });

  return (
    <aside className="flex min-h-screen w-64 shrink-0 flex-col border-r bg-gray-50 p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
        Books
      </h2>
      <ul className="flex-1 space-y-1 overflow-y-auto">
        {bookItems.map((item) => {
          const className = `block rounded px-3 py-2 text-sm hover:bg-gray-100 ${
            item.isCurrent ? "bg-blue-100 font-medium text-blue-900" : ""
          }`;
          return (
            <li key={item.id}>
              {isLoggedIn ? (
                <Link
                  to="/books/$id"
                  params={{ id: item.id }}
                  search={{ page: 1 }}
                  className={className}
                >
                  <div className="truncate">{item.title}</div>
                  <div className="truncate text-xs text-gray-500">
                    {item.author}
                  </div>
                </Link>
              ) : (
                <Link
                  to="/preview-books/$id"
                  params={{ id: item.id }}
                  search={{ page: 1, flash: undefined }}
                  className={className}
                >
                  <div className="truncate">{item.title}</div>
                  <div className="truncate text-xs text-gray-500">
                    {item.author}
                  </div>
                </Link>
              )}
            </li>
          );
        })}
      </ul>
      <div className="mt-4 border-t pt-4">
        {isLoggedIn ? (
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded border px-3 py-2 text-sm hover:bg-gray-100"
          >
            Logout
          </button>
        ) : (
          <Link
            to="/login"
            className="block rounded border px-3 py-2 text-center text-sm hover:bg-gray-100"
          >
            Login
          </Link>
        )}
      </div>
    </aside>
  );
});

export interface SidebarComponentProps extends SidebarFacade {
  currentBookId: string | undefined;
  isLoggedIn: boolean;
}

export function SidebarComponent({
  books,
  isPending,
  isFetching,
  logout,
  currentBookId,
  isLoggedIn,
}: SidebarComponentProps) {
  if (isPending) {
    return <SidebarSkeleton />;
  }

  return (
    <div className={`transition-opacity ${isFetching ? "opacity-50" : ""}`}>
      <SidebarView
        books={books}
        currentBookId={currentBookId}
        isLoggedIn={isLoggedIn}
        logout={logout}
      />
    </div>
  );
}
