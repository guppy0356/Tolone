import { api } from "../lib/api-client";
import type { components } from "../types/openapi";

export type Team = components["schemas"]["Team"];
export type TeamMember = components["schemas"]["TeamMember"];
export type CreateTeamInput = components["schemas"]["CreateTeamInput"];
export type CreateTeamMemberInput =
  components["schemas"]["CreateTeamMemberInput"];

export const teamApi = {
  getAll: () => api.get("teams").json<Team[]>(),
  create: (input: CreateTeamInput) =>
    api.post("teams", { json: input }).json<Team>(),
};
