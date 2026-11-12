import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { RouterProvider } from "@tanstack/react-router";
import { createMemoRouter } from "../../../test/memo-router";
import { MemoComponent } from "./Memo.component";

const memos = [
  { id: "1", title: "買い物リスト", status: "draft", createdAt: "2026-10-20T09:00:00Z" },
  { id: "2", title: "会議の議事録", status: "published", createdAt: "2026-10-23T10:15:00Z" },
] as const;

function page(props: Partial<React.ComponentProps<typeof MemoComponent>> = {}, initialUrl = "/") {
  const router = createMemoRouter({
    initialUrl,
    children: (
      <MemoComponent
        memos={[...memos]}
        isPending={false}
        isRefetching={false}
        deleteMemo={vi.fn()}
        search={{ status: "all" }}
        {...props}
      />
    ),
  });
  return { router, element: <RouterProvider router={router} /> };
}

test("各行にステータスの日本語と日付が出る", async () => {
  const screen = await render(page().element);
  // The composed string pins exactly what the user sees; the tab also says
  // "下書き" alone, so the query is the row's whole text, not the word.
  await expect.element(screen.getByText("下書き · 2026/10/20", { exact: true })).toBeInTheDocument();
  await expect.element(screen.getByText("公開済み · 2026/10/23", { exact: true })).toBeInTheDocument();
});

test("search が draft なら下書きだけが出る", async () => {
  // The read side: what the Container injects is an ordinary prop.
  const screen = await render(page({ search: { status: "draft" } }).element);
  await expect.element(screen.getByText("買い物リスト")).toBeInTheDocument();
  await expect.element(screen.getByText("会議の議事録")).not.toBeInTheDocument();
});

test("下書きタブを押すと URL が ?status=draft になる", async () => {
  // The write side: the Component changes the address, and nothing else.
  const { router, element } = page();
  const screen = await render(element);
  await screen.getByRole("tab", { name: "下書き" }).click();
  await vi.waitFor(() => expect(router.state.location.search).toEqual({ status: "draft" }));
});

test("すべてに戻すと status は URL から消える", async () => {
  // A reset is an absence: the default is stripped, so / and /?status=all are one address.
  const { router, element } = page({ search: { status: "draft" } }, "/?status=draft");
  const screen = await render(element);
  await screen.getByRole("tab", { name: "すべて" }).click();
  await vi.waitFor(() => expect(router.state.location.searchStr).toBe(""));
});

test("タブはロード中も表示される", async () => {
  const screen = await render(page({ memos: [], isPending: true }).element);
  await expect.element(screen.getByRole("tab", { name: "公開済み" })).toBeInTheDocument();
});

test("削除を押すとその id で deleteMemo が呼ばれる", async () => {
  const deleteMemo = vi.fn();
  const screen = await render(page({ deleteMemo }).element);
  await screen.getByRole("button", { name: "会議の議事録 を削除" }).click();
  expect(deleteMemo).toHaveBeenCalledWith("2");
});
