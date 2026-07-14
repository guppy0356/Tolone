import { createRouter } from "@tanstack/react-router";
import { rootRoute } from "./root.route";
import { galleryRoute } from "./features/gallery/Gallery/Gallery.route";

const routeTree = rootRoute.addChildren([galleryRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
