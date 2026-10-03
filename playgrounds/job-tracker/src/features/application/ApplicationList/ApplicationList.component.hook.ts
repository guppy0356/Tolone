import { useCallback, useMemo } from "react";
import type { ApplicationSort, ApplicationStatus } from "@api/Application.api";
import type { ApplicationListContainerState } from "./ApplicationList.container.hook";
import type { ApplicationListSearch } from "./ApplicationList.search";
import { toApplicationListRow, type ApplicationListRow } from "./ApplicationList.view-model";

export interface ApplicationListComponentParams {
  applications: ApplicationListContainerState["applications"];
  total: ApplicationListContainerState["total"];
  pageSize: ApplicationListContainerState["pageSize"];
  search: ApplicationListSearch;
  // A control that navigates on change calls this with the next search.
  applySearch: (next: ApplicationListSearch) => void;
}

export interface ApplicationListComponentState {
  rows: ApplicationListRow[];
  pageCount: number;
  toggleStatus: (status: ApplicationStatus) => void;
  setSort: (sort: ApplicationSort) => void;
  // A <Link> has nothing to call, so pagination gets the search it points at.
  previousPageSearch: ApplicationListSearch | null;
  nextPageSearch: ApplicationListSearch | null;
}

export function useApplicationListComponent({
  applications,
  total,
  pageSize,
  search,
  applySearch,
}: ApplicationListComponentParams): ApplicationListComponentState {
  const rows = useMemo(() => applications.map(toApplicationListRow), [applications]);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  // Changing a filter or the sort returns to the first page: page 1 is the
  // default, so it leaves the address rather than being written into it.
  const toggleStatus = useCallback(
    (status: ApplicationStatus) => {
      const next = search.status.includes(status)
        ? search.status.filter((s) => s !== status)
        : [...search.status, status];
      applySearch({ ...search, status: next, page: 1 });
    },
    [search, applySearch],
  );

  const setSort = useCallback(
    (sort: ApplicationSort) => applySearch({ ...search, sort, page: 1 }),
    [search, applySearch],
  );

  const previousPageSearch = search.page > 1 ? { ...search, page: search.page - 1 } : null;
  const nextPageSearch = search.page < pageCount ? { ...search, page: search.page + 1 } : null;

  return { rows, pageCount, toggleStatus, setSort, previousPageSearch, nextPageSearch };
}
