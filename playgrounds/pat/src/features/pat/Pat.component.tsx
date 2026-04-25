import { memo } from "react";
import { usePatPresenter } from "./Pat.presenter";
import type { PatFacade } from "./Pat.facade";
import type { Pat } from "./Pat.api";

export function PatSkeleton() {
  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="mb-4 text-2xl font-bold">Personal access tokens</h1>

      <div className="mb-6 flex gap-2">
        <input
          type="text"
          disabled
          placeholder="Token name"
          className="flex-1 rounded border px-3 py-2"
        />
        <button
          type="button"
          disabled
          className="rounded bg-blue-500 px-4 py-2 text-white opacity-50"
        >
          Generate token
        </button>
      </div>

      <ul className="space-y-2">
        {Array.from({ length: 3 }, (_, i) => (
          <li
            key={i}
            className="flex animate-pulse items-center gap-2 rounded border p-3"
          >
            <div className="h-4 flex-1 rounded bg-gray-200" />
            <div className="size-6 rounded bg-gray-200" />
            <div className="h-6 w-16 rounded bg-gray-200" />
          </li>
        ))}
      </ul>
    </div>
  );
}

interface PatViewProps {
  pats: Pat[];
  addPat: PatFacade["addPat"];
  updatePat: PatFacade["updatePat"];
  deletePat: PatFacade["deletePat"];
}

const PatView = memo(function PatView({
  pats,
  addPat,
  updatePat,
  deletePat,
}: PatViewProps) {
  const {
    newTitle,
    setNewTitle,
    handleCreate,
    createError,
    dismissCreateError,
    editingId,
    editingTitle,
    setEditingTitle,
    startEdit,
    cancelEdit,
    handleSaveEdit,
    rowErrors,
    dismissRowError,
    handleDelete,
  } = usePatPresenter({ addPat, updatePat, deletePat });

  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="mb-4 text-2xl font-bold">Personal access tokens</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleCreate();
        }}
        className="mb-2 flex gap-2"
      >
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Token name"
          className="flex-1 rounded border px-3 py-2"
        />
        <button
          type="submit"
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          Generate token
        </button>
      </form>

      {createError && (
        <div
          role="alert"
          className="mb-4 flex items-center justify-between rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          <span>{createError}</span>
          <button
            type="button"
            onClick={dismissCreateError}
            aria-label="Dismiss create error"
            className="ml-2 text-red-700 hover:text-red-900"
          >
            ×
          </button>
        </div>
      )}

      <ul className="space-y-2">
        {pats.map((pat) => {
          const isEditing = editingId === pat.id;
          const rowError = rowErrors[pat.id];

          return (
            <li
              key={pat.id}
              className="rounded border p-3"
            >
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      aria-label={`Edit title for ${pat.title}`}
                      className="flex-1 rounded border px-2 py-1"
                    />
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      className="rounded bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1">{pat.title}</span>
                    <button
                      type="button"
                      onClick={() => startEdit(pat.id, pat.title)}
                      aria-label={`Edit ${pat.title}`}
                      className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    >
                      <PencilIcon />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(pat.id)}
                      className="rounded px-3 py-1 text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>

              {rowError && (
                <div
                  role="alert"
                  className="mt-2 flex items-center justify-between text-sm text-red-600"
                >
                  <span>{rowError}</span>
                  <button
                    type="button"
                    onClick={() => dismissRowError(pat.id)}
                    aria-label={`Dismiss error for ${pat.title}`}
                    className="ml-2 text-red-600 hover:text-red-800"
                  >
                    ×
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
});

function PencilIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

export function PatComponent({
  pats,
  isPending,
  isFetching,
  addPat,
  updatePat,
  deletePat,
}: PatFacade) {
  if (isPending) {
    return <PatSkeleton />;
  }

  return (
    <div
      className={`transition-opacity ${isFetching ? "opacity-50" : ""}`}
    >
      <PatView
        pats={pats}
        addPat={addPat}
        updatePat={updatePat}
        deletePat={deletePat}
      />
    </div>
  );
}
