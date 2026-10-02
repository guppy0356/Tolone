import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { applicationQueries } from "@api/Application.queries";
import { companyQueries } from "@api/Company.queries";
import {
  applicationApi,
  type ApplicationDetail,
  type CreateApplicationInput,
} from "@api/Application.api";
import type { Company } from "@api/Company.api";

export interface ApplicationFormContainerState {
  companies: Company[];
  companyKeyword: string;
  setCompanyKeyword: (value: string) => void;
  isFetching: boolean;
  addApplication: (input: CreateApplicationInput) => Promise<ApplicationDetail>;
}

export function useApplicationFormContainer(): ApplicationFormContainerState {
  const queryClient = useQueryClient();

  // Hook-scoped query input: the typeahead keyword drives a query but is
  // pointless to bookmark, so it stays out of the URL.
  const [companyKeyword, setCompanyKeyword] = useState("");
  const keyword = companyKeyword.trim();
  const { data: companies, isFetching } = useQuery({
    ...companyQueries.search(keyword),
    enabled: keyword.length > 0,
  });

  // Invalidate only: the form navigates to the new application's detail on
  // save, so the list is never on screen to observe an optimistic row.
  const addMutation = useMutation({
    mutationFn: (input: CreateApplicationInput) => applicationApi.create(input),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: applicationQueries.lists() });
    },
  });

  // Returns the created application so the Component can navigate to its detail.
  const addApplication = useCallback(
    (input: CreateApplicationInput) => addMutation.mutateAsync(input),
    [addMutation.mutateAsync],
  );

  return {
    companies: companies ?? [],
    companyKeyword,
    setCompanyKeyword,
    isFetching,
    addApplication,
  };
}
