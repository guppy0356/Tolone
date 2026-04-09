import { delay } from "msw";
import { createOpenApiHttp } from "openapi-msw";
import type { paths, components } from "../types/openapi";

type Profile = components["schemas"]["Profile"];
type NotificationPreferences =
  components["schemas"]["NotificationPreferences"];

const http = createOpenApiHttp<paths>();

let profile: Profile = {
  name: "Octocat",
  bio: "The cat that codes.",
};

let preferences: NotificationPreferences = {
  reviewRequested: true,
  mentioned: true,
  issueAssigned: false,
};

export const handlers = [
  http.get("/api/settings/profile", async ({ response }) => {
    await delay(800);
    return response(200).json(profile);
  }),

  http.patch("/api/settings/profile", async ({ request, response }) => {
    const body = await request.json();
    await delay(400);
    profile = {
      name: body.name ?? profile.name,
      bio: body.bio ?? profile.bio,
    };
    return response(200).json(profile);
  }),

  http.get("/api/settings/notifications", async ({ response }) => {
    await delay(800);
    return response(200).json(preferences);
  }),

  http.patch(
    "/api/settings/notifications",
    async ({ request, response }) => {
      const body = await request.json();
      await delay(400);
      preferences = { ...preferences, ...body };
      return response(200).json(preferences);
    },
  ),
];
