import { getRouteApi } from "@tanstack/react-router";
import { useBookPreviewFacade } from "./BookPreview.facade";
import { BookPreviewComponent } from "./BookPreview.component";
import { useSidebarFacade } from "../sidebar/Sidebar.facade";
import { SidebarComponent } from "../sidebar/Sidebar.component";
import { useAuth } from "../../lib/use-auth";

const route = getRouteApi("/preview-books/$id");

export function BookPreviewContainer() {
  const { id } = route.useParams();
  const facade = useBookPreviewFacade(id);
  const sidebarFacade = useSidebarFacade();
  const { isLoggedIn } = useAuth();

  return (
    <div className="flex min-h-screen">
      <SidebarComponent
        {...sidebarFacade}
        currentBookId={id}
        isLoggedIn={isLoggedIn}
      />
      <main className="flex-1">
        <BookPreviewComponent {...facade} isLoggedIn={isLoggedIn} />
      </main>
    </div>
  );
}
