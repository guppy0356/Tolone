import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "../../../root.route";
import { GalleryContainer } from "./Gallery.container";

export const galleryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: GalleryContainer,
});
