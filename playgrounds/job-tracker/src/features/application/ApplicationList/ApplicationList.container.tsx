import { useSearch } from "@tanstack/react-router";
import { useApplicationListContainer } from "./ApplicationList.container.hook";
import { ApplicationListComponent } from "./ApplicationList.component";

export function ApplicationListContainer() {
  const search = useSearch({ from: "/applications" });
  const { applications, total, pageSize, isPending, isRefetching, updateStatus, deleteApplication } =
    useApplicationListContainer({ params: search });
  return (
    <ApplicationListComponent
      applications={applications}
      total={total}
      pageSize={pageSize}
      isPending={isPending}
      isRefetching={isRefetching}
      updateStatus={updateStatus}
      deleteApplication={deleteApplication}
      search={search}
    />
  );
}
