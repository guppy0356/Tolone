import { useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { ApplicationDetail } from "@api/Application.api";
import { useApplicationFormComponent, type ApplicationFormField } from "./ApplicationForm.component.hook";
import type { ApplicationFormContainerState } from "./ApplicationForm.container.hook";
import { CompanyPicker } from "./components/CompanyPicker.component";

interface FieldProps {
  id: string;
  label: string;
  field: ApplicationFormField;
  type?: "text" | "date";
}

// Simple fragment: no own state, no concern of its own — stays private.
function Field({ id, label, field, type = "text" }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={field.value}
        onChange={(e) => field.onChange(e.target.value)}
        onBlur={field.onBlur}
        className="w-full rounded border px-3 py-2"
      />
      {field.error && <p className="mt-1 text-sm text-red-600">{field.error}</p>}
    </div>
  );
}

// The component hook holds the form state, so it is called here — a form has
// no loaded body to memo and no Skeleton to show.
export function ApplicationFormComponent({
  companies,
  companyKeyword,
  setCompanyKeyword,
  isFetching,
  addApplication,
}: ApplicationFormContainerState) {
  const navigate = useNavigate();
  const onSaved = useCallback(
    (created: ApplicationDetail) =>
      navigate({ to: "/applications/$applicationId", params: { applicationId: created.id } }),
    [navigate],
  );
  const {
    positionField,
    appliedAtField,
    notesField,
    companyError,
    selectedCompany,
    isPickerOpen,
    openPicker,
    closePicker,
    selectCompany,
    canSubmit,
    isSubmitting,
    handleSubmit,
  } = useApplicationFormComponent({ addApplication, setCompanyKeyword, onSaved });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      className="space-y-4"
    >
      <h1 className="text-2xl font-bold">New application</h1>

      <div>
        <p className="mb-1 text-sm font-medium">Company</p>
        <CompanyPicker
          selected={selectedCompany}
          keyword={companyKeyword}
          onKeywordChange={setCompanyKeyword}
          companies={companies}
          isSearching={isFetching}
          isOpen={isPickerOpen}
          onOpen={openPicker}
          onClose={closePicker}
          onSelect={selectCompany}
          error={companyError}
        />
      </div>

      <Field id="position" label="Position" field={positionField} />
      <Field id="appliedAt" label="Applied on" field={appliedAtField} type="date" />

      <div>
        <label htmlFor="notes" className="mb-1 block text-sm font-medium">
          Notes
        </label>
        <textarea
          id="notes"
          value={notesField.value}
          onChange={(e) => notesField.onChange(e.target.value)}
          onBlur={notesField.onBlur}
          rows={4}
          className="w-full rounded border px-3 py-2"
        />
      </div>

      <button
        type="submit"
        disabled={!canSubmit || isSubmitting}
        className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
      >
        {isSubmitting ? "Saving…" : "Save application"}
      </button>
    </form>
  );
}
