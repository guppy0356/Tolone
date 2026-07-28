import { useSearch } from "@tanstack/react-router";
import { useIncidentListContainer } from "./IncidentList.container.hook";
import { IncidentListComponent } from "./IncidentList.component";

export function IncidentListContainer() {
  // The URL is read here, once: the container hook receives the parsed values
  // as params, and the Component receives them as a prop to render and write
  // back.
  const search = useSearch({ from: "/incidents" });

  const {
    incidents,
    total,
    totalPages,
    assignees,
    isIncidentsPending,
    isIncidentsRefetching,
    isAssigneesPending,
  } = useIncidentListContainer({ params: search });

  return (
    <IncidentListComponent
      incidents={incidents}
      total={total}
      totalPages={totalPages}
      assignees={assignees}
      isIncidentsPending={isIncidentsPending}
      isIncidentsRefetching={isIncidentsRefetching}
      isAssigneesPending={isAssigneesPending}
      search={search}
    />
  );
}
