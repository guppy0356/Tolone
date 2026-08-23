import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "../../../root.route";
import { BookContainer } from "./Book.container";

export const bookRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: BookContainer,
});
