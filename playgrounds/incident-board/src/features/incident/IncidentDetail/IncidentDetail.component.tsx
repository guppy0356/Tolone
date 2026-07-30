import { memo } from "react";
import { Link } from "@tanstack/react-router";
import type { IncidentComment, IncidentDetail } from "@api/Incident.api";
import type { IncidentDetailContainerState } from "./IncidentDetail.container.hook";
import { useIncidentDetailComponent } from "./IncidentDetail.component.hook";
import {
  toListSearch,
  type IncidentDetailSearch,
  type IncidentListSearch,
} from "../Incident.search";

export interface IncidentDetailComponentProps
  extends IncidentDetailContainerState {
  search: IncidentDetailSearch;
}

function BackToList({ search }: { search: IncidentListSearch }) {
  return (
    // The filters travelled here in the URL, so the way back is just a link —
    // nothing had to remember them.
    <Link to="/incidents" search={search} className="text-sm text-blue-700">
      ← Back to incidents
    </Link>
  );
}

const IncidentOverview = memo(function IncidentOverview({
  detail,
  comments,
  isCommentsLoading,
  search,
}: {
  detail: IncidentDetail;
  comments: IncidentComment[];
  isCommentsLoading: boolean;
  search: IncidentDetailSearch;
}) {
  const { headline, tabs, timelineRows, commentRows } =
    useIncidentDetailComponent({ detail, comments, search });

  return (
    <>
      <header className="mb-4">
        <p className="font-mono text-xs text-gray-500">{headline.key}</p>
        <h1 className="text-2xl font-bold">{headline.title}</h1>
        <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
          <div className="flex gap-1">
            <dt className="font-semibold">Status</dt>
            <dd>{headline.statusLabel}</dd>
          </div>
          <div className="flex gap-1">
            <dt className="font-semibold">Severity</dt>
            <dd>{headline.severityLabel}</dd>
          </div>
          <div className="flex gap-1">
            <dt className="font-semibold">Assignee</dt>
            <dd>{headline.assigneeLabel}</dd>
          </div>
          <div className="flex gap-1">
            <dt className="font-semibold">Opened</dt>
            <dd>{headline.openedAtLabel}</dd>
          </div>
        </dl>
        <p className="mt-3 max-w-2xl text-gray-800">{headline.description}</p>
      </header>

      <nav className="mb-4 flex gap-2 border-b">
        {tabs.map((tab) => (
          <Link
            key={tab.value}
            to="/incidents/$incidentId"
            params={{ incidentId: detail.id }}
            search={{ ...search, tab: tab.value }}
            // The two tabs differ only by `tab`, and the default-valued one is
            // stripped from the URL, so it has nothing to disagree with: without
            // `exact` both links report themselves current.
            activeOptions={{ exact: true }}
            // A tab is not a place to come back to — replacing keeps the list
            // one Back away however many tabs the reader opened.
            replace
            className={`-mb-px border-b-2 px-3 py-2 text-sm ${
              tab.isActive
                ? "border-blue-600 font-semibold text-blue-700"
                : "border-transparent text-gray-600"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {search.tab === "timeline" ? (
        <ul className="space-y-3">
          {timelineRows.map((row) => (
            <li key={row.id} className="rounded border p-3">
              <p className="text-xs text-gray-500">
                {row.atLabel} · {row.kindLabel} · {row.actor}
              </p>
              <p className="mt-1">{row.message}</p>
            </li>
          ))}
        </ul>
      ) : isCommentsLoading ? (
        <ul className="space-y-3">
          {[0, 1].map((index) => (
            <li key={index} className="rounded border p-3">
              <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
            </li>
          ))}
        </ul>
      ) : commentRows.length === 0 ? (
        <p className="rounded border border-dashed p-8 text-center text-gray-500">
          No comments yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {commentRows.map((row) => (
            <li key={row.id} className="rounded border p-3">
              <p className="text-xs text-gray-500">
                {row.author} · {row.postedAtLabel}
              </p>
              <p className="mt-1">{row.body}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
});

function IncidentDetailSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-8 w-2/3 animate-pulse rounded bg-gray-200" />
      <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
      <div className="h-24 w-full animate-pulse rounded bg-gray-200" />
    </div>
  );
}

export function IncidentDetailComponent({
  detail,
  comments,
  isDetailPending,
  isDetailNotFound,
  isCommentsLoading,
  search,
}: IncidentDetailComponentProps) {
  const listSearch = toListSearch(search);

  return (
    <div className="p-6">
      <div className="mb-4">
        <BackToList search={listSearch} />
      </div>

      {isDetailPending ? (
        <IncidentDetailSkeleton />
      ) : isDetailNotFound || !detail ? (
        <p className="rounded border border-dashed p-8 text-center text-gray-500">
          That incident no longer exists.
        </p>
      ) : (
        <IncidentOverview
          detail={detail}
          comments={comments}
          isCommentsLoading={isCommentsLoading}
          search={search}
        />
      )}
    </div>
  );
}
