import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createRouter,
  createRootRoute,
  createRoute,
  RouterProvider,
} from "@tanstack/react-router";
import { useBlogFacade, useBlogDetailFacade } from "./features/blog/Blog.facade";
import { BlogPage } from "./features/blog/BlogPage";
import { BlogDetail } from "./features/blog/BlogDetail.component";
import "./app.css";

const queryClient = new QueryClient();

function BlogListContainer() {
  const { blogs, isPending, isFetching, addBlog } = useBlogFacade();

  return (
    <BlogPage
      blogs={blogs}
      isPending={isPending}
      isFetching={isFetching}
      addBlog={addBlog}
    />
  );
}

function BlogDetailContainer() {
  const { id } = blogDetailRoute.useParams();
  const { blog, isPending, isFetching } = useBlogDetailFacade(id);

  return (
    <BlogDetail
      blog={blog}
      isPending={isPending}
      isFetching={isFetching}
    />
  );
}

const rootRoute = createRootRoute();

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: BlogListContainer,
});

const blogDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/blogs/$id",
  component: BlogDetailContainer,
});

const routeTree = rootRoute.addChildren([indexRoute, blogDetailRoute]);
const router = createRouter({ routeTree });

async function enableMocking() {
  const { worker } = await import("./mocks/browser");
  return worker.start({ onUnhandledRequest: "bypass" });
}

enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  );
});
