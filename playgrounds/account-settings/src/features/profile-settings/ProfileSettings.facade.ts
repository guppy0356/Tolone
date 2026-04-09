import { useCallback } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  profileSettingsApi,
  type Profile,
  type UpdateProfileInput,
} from "./ProfileSettings.api";

export interface ProfileSettingsFacade {
  profile: Profile | undefined;
  isPending: boolean;
  isFetching: boolean;
  updateProfile: (input: UpdateProfileInput) => Promise<void>;
}

const profileKeys = {
  all: ["settings", "profile"] as const,
};

export function useProfileSettingsFacade(): ProfileSettingsFacade {
  const queryClient = useQueryClient();

  const { data, isPending, isFetching } = useQuery({
    queryKey: profileKeys.all,
    queryFn: profileSettingsApi.get,
    placeholderData: keepPreviousData,
  });

  const updateMutation = useMutation({
    mutationFn: (input: UpdateProfileInput) => profileSettingsApi.update(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: profileKeys.all });
      const previous = queryClient.getQueryData<Profile>(profileKeys.all);
      queryClient.setQueryData<Profile>(profileKeys.all, (old) =>
        old ? { ...old, ...input } : old,
      );
      return { previous };
    },
    onError: (_err, _input, context) => {
      queryClient.setQueryData(profileKeys.all, context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });

  const updateProfile = useCallback(
    async (input: UpdateProfileInput) => {
      await updateMutation.mutateAsync(input);
    },
    [updateMutation.mutateAsync],
  );

  return {
    profile: data,
    isPending,
    isFetching,
    updateProfile,
  };
}
