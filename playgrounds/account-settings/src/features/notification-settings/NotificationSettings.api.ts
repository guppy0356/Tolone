import { api } from "../../lib/api-client";
import type { components } from "../../types/openapi";

export type NotificationPreferences =
  components["schemas"]["NotificationPreferences"];
export type UpdateNotificationsInput =
  components["schemas"]["UpdateNotificationsInput"];

export const notificationSettingsApi = {
  get: () => api.get("settings/notifications").json<NotificationPreferences>(),
  update: (input: UpdateNotificationsInput) =>
    api
      .patch("settings/notifications", { json: input })
      .json<NotificationPreferences>(),
};
