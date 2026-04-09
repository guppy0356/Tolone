import { api } from "../../lib/api-client";
import type { components } from "../../types/openapi";

export type Profile = components["schemas"]["Profile"];
export type UpdateProfileInput = components["schemas"]["UpdateProfileInput"];

export const profileSettingsApi = {
  get: () => api.get("settings/profile").json<Profile>(),
  update: (input: UpdateProfileInput) =>
    api.patch("settings/profile", { json: input }).json<Profile>(),
};
