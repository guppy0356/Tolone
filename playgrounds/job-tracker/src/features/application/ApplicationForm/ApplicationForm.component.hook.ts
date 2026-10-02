import { useCallback, useState } from "react";
import { useController, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ApplicationDetail } from "@api/Application.api";
import type { Company } from "@api/Company.api";
import type { ApplicationFormContainerState } from "./ApplicationForm.container.hook";
import { applicationFormSchema, type ApplicationFormValues } from "./ApplicationForm.schema";

// Fields cross the hook boundary as plain objects: the Component never
// imports react-hook-form.
export interface ApplicationFormField {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error: string | undefined;
}

export interface ApplicationFormComponentParams {
  addApplication: ApplicationFormContainerState["addApplication"];
  setCompanyKeyword: ApplicationFormContainerState["setCompanyKeyword"];
  onSaved: (created: ApplicationDetail) => void;
}

export interface ApplicationFormComponentState {
  positionField: ApplicationFormField;
  appliedAtField: ApplicationFormField;
  notesField: ApplicationFormField;
  companyError: string | undefined;
  selectedCompany: Company | null;
  isPickerOpen: boolean;
  openPicker: () => void;
  closePicker: () => void;
  selectCompany: (company: Company) => void;
  canSubmit: boolean;
  isSubmitting: boolean;
  handleSubmit: () => Promise<void>;
}

const EMPTY_VALUES: ApplicationFormValues = {
  companyId: "",
  position: "",
  appliedAt: "",
  notes: "",
};

export function useApplicationFormComponent({
  addApplication,
  setCompanyKeyword,
  onSaved,
}: ApplicationFormComponentParams): ApplicationFormComponentState {
  const {
    control,
    handleSubmit: rhfHandleSubmit,
    reset,
    formState: { isValid, isSubmitting },
  } = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationFormSchema),
    mode: "onChange",
    defaultValues: EMPTY_VALUES,
  });

  const toField = (ctrl: ReturnType<typeof useController<ApplicationFormValues>>): ApplicationFormField => ({
    value: ctrl.field.value,
    onChange: (value) => ctrl.field.onChange(value),
    onBlur: ctrl.field.onBlur,
    error: ctrl.fieldState.error?.message,
  });

  const companyCtrl = useController({ name: "companyId", control });
  const positionField = toField(useController({ name: "position", control }));
  const appliedAtField = toField(useController({ name: "appliedAt", control }));
  const notesField = toField(useController({ name: "notes", control }));

  // Whether the picker is open is app-relevant state, so it lives here; the
  // picker's click-outside mechanics stay in the sub-component.
  const [isPickerOpen, setPickerOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const openPicker = useCallback(() => setPickerOpen(true), []);
  const closePicker = useCallback(() => {
    setPickerOpen(false);
    setCompanyKeyword("");
  }, [setCompanyKeyword]);

  // A non-text input is still a controlled field: picking a company computes
  // the next value and calls the controller's onChange.
  const selectCompany = useCallback(
    (company: Company) => {
      setSelectedCompany(company);
      companyCtrl.field.onChange(company.id);
      closePicker();
    },
    [companyCtrl.field, closePicker],
  );

  // The parsed output — `position` and `notes` arrive already trimmed.
  const onSubmit = useCallback(
    async (data: ApplicationFormValues) => {
      const created = await addApplication(data);
      reset(EMPTY_VALUES);
      setSelectedCompany(null);
      onSaved(created);
    },
    [addApplication, reset, onSaved],
  );

  const handleSubmit = useCallback(() => rhfHandleSubmit(onSubmit)(), [rhfHandleSubmit, onSubmit]);

  return {
    positionField,
    appliedAtField,
    notesField,
    companyError: companyCtrl.fieldState.error?.message,
    selectedCompany,
    isPickerOpen,
    openPicker,
    closePicker,
    selectCompany,
    canSubmit: isValid,
    isSubmitting,
    handleSubmit,
  };
}
