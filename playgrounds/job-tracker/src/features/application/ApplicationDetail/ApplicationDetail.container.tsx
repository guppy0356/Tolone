import { useParams, useSearch } from "@tanstack/react-router";
import { useApplicationDetailContainer } from "./ApplicationDetail.container.hook";
import { ApplicationDetailComponent } from "./ApplicationDetail.component";

export function ApplicationDetailContainer() {
  const { applicationId } = useParams({ from: "/applications/$applicationId" });
  const search = useSearch({ from: "/applications/$applicationId" });
  // Translating is wiring: the hook never sees the URL's vocabulary.
  const { detail, interviews, isDetailPending, isDetailRefetching, isInterviewsLoading, isNotFound } =
    useApplicationDetailContainer({ applicationId, withInterviews: search.tab === "interviews" });
  return (
    <ApplicationDetailComponent
      detail={detail}
      interviews={interviews}
      isDetailPending={isDetailPending}
      isDetailRefetching={isDetailRefetching}
      isInterviewsLoading={isInterviewsLoading}
      isNotFound={isNotFound}
      search={search}
    />
  );
}
