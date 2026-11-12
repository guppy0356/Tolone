import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { MemoComponent } from "./Memo.component";

// hook が useSearch を呼ぶので、story は router の中でしか描画できなくなった。
function withRouter(children: ReactNode) {
  const rootRoute = createRootRoute();
  const routeTree = rootRoute.addChildren([
    createRoute({ getParentRoute: () => rootRoute, path: "/", component: () => children }),
  ]);
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ["/"] }) });
  return <RouterProvider router={router} />;
}

const sampleMemos = [
  { id: "1", title: "買い物リスト", status: "draft", createdAt: "2026-10-20T09:00:00Z" },
  { id: "2", title: "読書メモ: 設計の話", status: "published", createdAt: "2026-10-21T13:30:00Z" },
  { id: "3", title: "週末の予定", status: "draft", createdAt: "2026-10-22T18:45:00Z" },
  { id: "4", title: "会議の議事録", status: "published", createdAt: "2026-10-23T10:15:00Z" },
  { id: "5", title: "アイデア置き場", status: "draft", createdAt: "2026-10-24T22:00:00Z" },
] as const;

const meta = {
  title: "features/Memo",
  component: MemoComponent,
  args: { memos: [], isPending: false, isRefetching: false, deleteMemo: fn() },
  decorators: [(Story) => withRouter(<Story />)],
} satisfies Meta<typeof MemoComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { memos: [...sampleMemos] } };
export const Empty: Story = { args: { memos: [] } };
export const Loading: Story = { args: { isPending: true, memos: [] } };
export const Refetching: Story = { args: { memos: [...sampleMemos], isRefetching: true } };
