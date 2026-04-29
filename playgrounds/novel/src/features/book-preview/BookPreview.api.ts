import { api } from "../../lib/api-client";
import type { components } from "../../types/openapi";

export type BookPreview = components["schemas"]["BookPreview"];
export type Page = components["schemas"]["Page"];

export const bookPreviewApi = {
  getPreview: (id: string) =>
    api.get(`books/${id}/preview`).json<BookPreview>(),
};
