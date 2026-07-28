import { useParams, useSearch } from "@tanstack/react-router";
import { useIncidentDetailContainer } from "./IncidentDetail.container.hook";
import { IncidentDetailComponent } from "./IncidentDetail.component";

export function IncidentDetailContainer() {
  const { incidentId } = useParams({ from: "/incidents/$incidentId" });
  const search = useSearch({ from: "/incidents/$incidentId" });

  const {
    detail,
    comments,
    isDetailPending,
    isDetailNotFound,
    isCommentsLoading,
  } = useIncidentDetailContainer({
    incidentId,
    // Which tab spells "the reader wants the comments" is a URL fact, so the
    // translation happens here rather than in the hook.
    withComments: search.tab === "comments",
  });

  return (
    <IncidentDetailComponent
      detail={detail}
      comments={comments}
      isDetailPending={isDetailPending}
      isDetailNotFound={isDetailNotFound}
      isCommentsLoading={isCommentsLoading}
      search={search}
    />
  );
}
