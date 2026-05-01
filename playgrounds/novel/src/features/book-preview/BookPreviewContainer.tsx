import { useState } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { useBookPreviewFacade } from "./BookPreview.facade";
import { BookPreviewSummaryComponent } from "./BookPreviewSummary.component";
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
  const [showSummary, setShowSummary] = useState(true);

  return (
    <div className="flex min-h-screen">
      <SidebarComponent
        {...sidebarFacade}
        currentBookId={id}
        isLoggedIn={isLoggedIn}
      />
      <main className="flex-1">
        {showSummary ? (
          <BookPreviewSummaryComponent
            book={facade.book}
            isPending={facade.isPending}
            isFetching={facade.isFetching}
            onStartReading={() => setShowSummary(false)}
          />
        ) : (
          <BookPreviewComponent
            {...facade}
            isLoggedIn={isLoggedIn}
            onBackToSummary={() => setShowSummary(true)}
          />
        )}
      </main>
    </div>
  );
}
