import { useCallback } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  notificationSettingsApi,
  type NotificationPreferences,
  type UpdateNotificationsInput,
} from "./NotificationSettings.api";

export type NotificationKey = keyof NotificationPreferences;

export interface NotificationSettingsFacade {
  preferences: NotificationPreferences | undefined;
  isPending: boolean;
  isFetching: boolean;
  updatePreference: (key: NotificationKey, value: boolean) => Promise<void>;
}

const notificationKeys = {
  all: ["settings", "notifications"] as const,
};

export function useNotificationSettingsFacade(): NotificationSettingsFacade {
  const queryClient = useQueryClient();

  const { data, isPending, isFetching } = useQuery({
    queryKey: notificationKeys.all,
    queryFn: notificationSettingsApi.get,
    placeholderData: keepPreviousData,
  });

  const updateMutation = useMutation({
    mutationFn: (input: UpdateNotificationsInput) =>
      notificationSettingsApi.update(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.all });
      const previous =
        queryClient.getQueryData<NotificationPreferences>(notificationKeys.all);
      queryClient.setQueryData<NotificationPreferences>(
        notificationKeys.all,
        (old) => (old ? { ...old, ...input } : old),
      );
      return { previous };
    },
    onError: (_err, _input, context) => {
      queryClient.setQueryData(notificationKeys.all, context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });

  const updatePreference = useCallback(
    async (key: NotificationKey, value: boolean) => {
      await updateMutation.mutateAsync({ [key]: value });
    },
    [updateMutation.mutateAsync],
  );

  return {
    preferences: data,
    isPending,
    isFetching,
    updatePreference,
  };
}
