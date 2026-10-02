import { memo } from "react";
import { Link } from "@tanstack/react-router";
import type { ApplicationDetail, ApplicationStatus, Interview } from "@api/Application.api";
import { useApplicationDetailComponent } from "./ApplicationDetail.component.hook";
import type { ApplicationDetailContainerState } from "./ApplicationDetail.container.hook";
import type { ApplicationDetailSearch, ApplicationDetailTab } from "./ApplicationDetail.search";
import { TAB_OPTIONS } from "./ApplicationDetail.view-model";

export interface ApplicationDetailComponentProps extends ApplicationDetailContainerState {
  search: ApplicationDetailSearch;
}

const STATUS_TONE: Record<ApplicationStatus, string> = {
  applied: "bg-gray-100 text-gray-700",
  screening: "bg-blue-100 text-blue-700",
  interviewing: "bg-amber-100 text-amber-800",
  offer: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

interface ApplicationDetailBodyProps {
  detail: ApplicationDetail;
  interviews: Interview[];
  tab: ApplicationDetailTab;
  // Reaches the body on purpose: it flips only when the interviews pane loads,
  // never on a page-wide refetch, so memo still holds.
  isInterviewsLoading: boolean;
}

// Private memo'd body. It needs the raw domain as well as the view model, so
// the component hook is called here.
const ApplicationDetailBody = memo(function ApplicationDetailBody({
  detail,
  interviews,
  tab,
  isInterviewsLoading,
}: ApplicationDetailBodyProps) {
  const { overview, interviewRows } = useApplicationDetailComponent({ detail, interviews });

  return (
    <article>
      <header className="mb-4">
        <h1 className="text-2xl font-bold">{overview.headline}</h1>
        <p className="mt-1 flex items-center gap-3 text-sm text-gray-600">
          <span className={`rounded px-2 py-0.5 text-xs ${STATUS_TONE[overview.status]}`}>
            {overview.statusLabel}
          </span>
          <span>Applied {overview.appliedAt}</span>
          <span>Salary: {overview.salary}</span>
        </p>
      </header>

      {/* A pane is not a destination: tabs replace, so the list stays one Back away. */}
      <nav className="mb-4 flex gap-4 border-b text-sm" aria-label="Sections">
        {TAB_OPTIONS.map((o) => (
          <Link
            key={o.value}
            to="/applications/$applicationId"
            params={{ applicationId: detail.id }}
            search={{ tab: o.value }}
            replace
            activeOptions={{ exact: true }}
            className="-mb-px border-b-2 border-transparent px-1 pb-2 text-gray-600"
            activeProps={{ className: "-mb-px border-b-2 border-blue-600 px-1 pb-2 font-medium text-blue-700" }}
          >
            {o.label}
          </Link>
        ))}
      </nav>

      {tab === "overview" ? (
        <p className="whitespace-pre-wrap text-gray-800">{overview.notes}</p>
      ) : isInterviewsLoading ? (
        <InterviewsSkeleton />
      ) : interviewRows.length === 0 ? (
        <p className="text-gray-500">No interviews scheduled.</p>
      ) : (
        <ul className="divide-y rounded border">
          {interviewRows.map((row) => (
            <li key={row.id} className="flex items-center justify-between p-3 text-sm">
              <span className="font-medium">{row.kindLabel}</span>
              <span className="text-gray-600">
                {row.scheduledAt} · {row.interviewer}
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
});

function InterviewsSkeleton() {
  return (
    <ul className="divide-y rounded border" aria-label="Loading interviews">
      {[0, 1].map((i) => (
        <li key={i} className="p-3">
          <div className="h-5 w-56 animate-pulse rounded bg-gray-200" />
        </li>
      ))}
    </ul>
  );
}

// Page-level placeholder: the layout depends on the detail.
function ApplicationDetailSkeleton() {
  return (
    <div className="space-y-3" aria-label="Loading application">
      <div className="h-8 w-80 animate-pulse rounded bg-gray-200" />
      <div className="h-4 w-56 animate-pulse rounded bg-gray-200" />
      <div className="h-24 animate-pulse rounded bg-gray-200" />
    </div>
  );
}

export function ApplicationDetailComponent({
  detail,
  interviews,
  isDetailPending,
  isDetailRefetching,
  isInterviewsLoading,
  isNotFound,
  search,
}: ApplicationDetailComponentProps) {
  return (
    <>
      {/* Labeled for where it goes, not "Back": a reader sent this link has no back to go to. */}
      <Link to="/applications" className="mb-4 inline-block text-sm text-blue-600 hover:underline">
        All applications
      </Link>

      {isNotFound ? (
        <p className="rounded border border-dashed p-6 text-center text-gray-500">
          This application does not exist.
        </p>
      ) : isDetailPending || detail === undefined ? (
        <ApplicationDetailSkeleton />
      ) : (
        <div className={`transition-opacity ${isDetailRefetching ? "opacity-50" : ""}`}>
          <ApplicationDetailBody
            detail={detail}
            interviews={interviews}
            tab={search.tab}
            isInterviewsLoading={isInterviewsLoading}
          />
        </div>
      )}
    </>
  );
}
