import { Link } from "@tanstack/react-router";
import { useSidebarFacade } from "./features/sidebar/Sidebar.facade";
import { SidebarComponent } from "./features/sidebar/Sidebar.component";
import { useAuth } from "./lib/use-auth";

export function IndexContainer() {
  const sidebarFacade = useSidebarFacade();
  const { isLoggedIn } = useAuth();

  return (
    <div className="flex min-h-screen">
      <SidebarComponent
        {...sidebarFacade}
        currentBookId={undefined}
        isLoggedIn={isLoggedIn}
      />
      <main className="flex flex-1 items-center justify-center p-8">
        <div className="max-w-sm space-y-3 text-center">
          <p className="text-lg font-medium text-gray-700">
            Select a book from the sidebar to start reading.
          </p>
          <p className="text-sm text-gray-500">
            Previews include only the first few pages.
          </p>
          {!isLoggedIn && (
            <p className="text-sm text-gray-500">
              <Link to="/login" className="text-blue-500 underline">
                Log in
              </Link>{" "}
              to read every page.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
