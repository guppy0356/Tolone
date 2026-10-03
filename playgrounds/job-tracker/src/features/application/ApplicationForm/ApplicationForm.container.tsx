import { useApplicationFormContainer } from "./ApplicationForm.container.hook";
import { ApplicationFormComponent } from "./ApplicationForm.component";

export function ApplicationFormContainer() {
  const { companies, companyKeyword, setCompanyKeyword, isFetching, addApplication } =
    useApplicationFormContainer();
  return (
    <ApplicationFormComponent
      companies={companies}
      companyKeyword={companyKeyword}
      setCompanyKeyword={setCompanyKeyword}
      isFetching={isFetching}
      addApplication={addApplication}
    />
  );
}
